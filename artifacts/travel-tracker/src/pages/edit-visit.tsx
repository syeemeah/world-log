import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import {
  useGetVisit,
  useUpdateVisit,
  getListVisitsQueryKey,
  getGetVisitQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { COUNTRIES } from "@/lib/countries";
import { useToast } from "@/hooks/use-toast";

interface CitySuggestion {
  displayName: string;
  city: string;
  lat: number;
  lng: number;
}

async function searchCities(query: string, countryCode: string): Promise<CitySuggestion[]> {
  if (!query.trim()) return [];
  try {
    const q = encodeURIComponent(query);
    const cc = encodeURIComponent(countryCode);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&countrycodes=${cc}&format=json&limit=6&addressdetails=1&featuretype=city`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data: Array<{
      display_name: string;
      lat: string;
      lon: string;
      address: { city?: string; town?: string; village?: string; county?: string; state?: string };
    }> = await res.json();

    return data
      .filter((d) => d.address.city || d.address.town || d.address.village)
      .map((d) => {
        const cityName = d.address.city ?? d.address.town ?? d.address.village ?? query;
        const region = d.address.state ?? d.address.county ?? "";
        return {
          displayName: region ? `${cityName}, ${region}` : cityName,
          city: cityName,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        };
      });
  } catch {
    return [];
  }
}

export default function EditVisit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const visitId = Number(id);

  const { data: visit, isLoading } = useGetVisit(visitId, {
    query: { queryKey: getGetVisitQueryKey(visitId), enabled: !isNaN(visitId) },
  });

  const [form, setForm] = useState({
    country: "",
    countryCode: "",
    city: "",
    visitDate: "",
    notes: "",
    lat: "",
    lng: "",
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // City autocomplete
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityPinned, setCityPinned] = useState(false);
  const [citySearching, setCitySearching] = useState(false);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise form from loaded visit
  useEffect(() => {
    if (visit) {
      setForm({
        country: visit.country,
        countryCode: visit.countryCode,
        city: visit.city,
        visitDate: visit.visitDate,
        notes: visit.notes ?? "",
        lat: String(visit.lat),
        lng: String(visit.lng),
      });
      setCountrySearch(visit.country);
      setCityInput(visit.city);
      setCityPinned(true); // existing city is already placed
    }
  }, [visit]);

  const filteredCountries =
    countrySearch.length > 0
      ? COUNTRIES.filter((c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase())
        ).slice(0, 10)
      : [];

  const handleCountrySelect = (name: string, code: string, lat: number, lng: number) => {
    setForm((f) => ({ ...f, country: name, countryCode: code, lat: String(lat), lng: String(lng) }));
    setCountrySearch(name);
    setShowCountryDropdown(false);
    // Reset city when country changes
    setCityInput("");
    setCityPinned(false);
    setForm((f) => ({ ...f, city: "" }));
  };

  // Search cities as user types
  useEffect(() => {
    if (!form.country || !cityInput.trim()) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCitySearching(false);
      return;
    }
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    setCitySearching(true);

    const countryEntry = COUNTRIES.find((c) => c.name === form.country);
    const cc = countryEntry?.code?.toLowerCase() ?? "";

    cityDebounceRef.current = setTimeout(async () => {
      const results = await searchCities(cityInput, cc || form.country);
      setCitySuggestions(results);
      setShowCityDropdown(results.length > 0);
      setCitySearching(false);
    }, 400);

    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    };
  }, [cityInput, form.country]);

  const handleCitySelect = (s: CitySuggestion) => {
    setForm((f) => ({ ...f, city: s.city, lat: String(s.lat), lng: String(s.lng) }));
    setCityInput(s.displayName);
    setCityPinned(true);
    setShowCityDropdown(false);
    setCitySuggestions([]);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setCityPinned(false);
    setForm((f) => ({ ...f, city: value }));
    setShowCityDropdown(false);
  };

  const mutation = useUpdateVisit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(visitId) });
        queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
        toast({ title: "Visit updated" });
        navigate("/visits");
      },
      onError: () => toast({ title: "Failed to update visit", variant: "destructive" }),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id: visitId,
      data: {
        country: form.country,
        countryCode: form.countryCode,
        city: form.city,
        visitDate: form.visitDate,
        notes: form.notes || null,
        lat: Number(form.lat),
        lng: Number(form.lng),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="max-w-xl mx-auto px-6 py-8">
        <p className="text-muted-foreground">Visit not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate("/visits")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to visits
      </button>

      <h1 className="text-2xl font-semibold mb-1">Edit visit</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {visit.city}, {visit.country}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Country */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              setShowCountryDropdown(true);
              setForm((f) => ({ ...f, country: "", countryCode: "" }));
            }}
            onFocus={() => setShowCountryDropdown(true)}
            onBlur={() => setTimeout(() => setShowCountryDropdown(false), 150)}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
          />
          {showCountryDropdown && filteredCountries.length > 0 && (
            <div className="absolute z-20 w-full bg-popover border border-popover-border rounded-md shadow-lg mt-1 overflow-hidden">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onMouseDown={() => handleCountrySelect(c.name, c.code, c.lat, c.lng)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <span>{countryFlag(c.code)}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City — autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1.5">City</label>
          <div className="relative">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onFocus={() => { if (citySuggestions.length > 0) setShowCityDropdown(true); }}
              onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
              placeholder={form.country ? `Search cities in ${form.country}…` : "Select a country first"}
              disabled={!form.country}
              className="w-full border border-border rounded-md px-3 py-2.5 pr-9 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              autoComplete="off"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {citySearching ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : cityPinned ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : cityInput ? (
                <MapPin className="w-4 h-4 text-muted-foreground/50" />
              ) : null}
            </div>
          </div>

          {showCityDropdown && citySuggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-popover border border-popover-border rounded-md shadow-lg mt-1 overflow-hidden">
              {citySuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => handleCitySelect(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{s.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {cityPinned && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Pinned to exact location
            </p>
          )}
        </div>

        {/* Visit Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Visit date</label>
          <input
            type="date"
            value={form.visitDate}
            onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Lat/Lng */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => { setForm((f) => ({ ...f, lat: e.target.value })); setCityPinned(false); }}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => { setForm((f) => ({ ...f, lng: e.target.value })); setCityPinned(false); }}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
