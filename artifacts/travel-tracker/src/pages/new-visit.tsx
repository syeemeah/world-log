import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  useCreateVisit,
  getListVisitsQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { COUNTRIES } from "@/lib/countries";
import { useToast } from "@/hooks/use-toast";

type GeoStatus = "idle" | "loading" | "city" | "country" | "failed";

async function geocodeCity(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

export default function NewVisit() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = new URLSearchParams(search);
  const preCountry = params.get("country") ?? "";
  const preCode = params.get("code") ?? "";
  const preCountryData = preCode ? COUNTRIES.find((c) => c.code === preCode) : undefined;

  const [form, setForm] = useState({
    country: preCountry,
    countryCode: preCode,
    city: "",
    visitDate: new Date().toISOString().split("T")[0],
    notes: "",
    lat: preCountryData ? String(preCountryData.lat) : "",
    lng: preCountryData ? String(preCountryData.lng) : "",
  });

  const [countrySearch, setCountrySearch] = useState(preCountry);
  const [showDropdown, setShowDropdown] = useState(false);
  const [countryLocked] = useState(!!preCountry);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredCountries =
    countrySearch.length > 0 && !countryLocked
      ? COUNTRIES.filter((c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase())
        ).slice(0, 10)
      : [];

  // When country changes without a city yet, pre-fill country centroid
  useEffect(() => {
    if (countryLocked) return;
    const selected = COUNTRIES.find((c) => c.name === form.country);
    if (selected && !form.city) {
      setForm((f) => ({ ...f, lat: String(selected.lat), lng: String(selected.lng) }));
      setGeoStatus("country");
    }
  }, [form.country, countryLocked]);

  // Geocode city whenever city or country changes (debounced)
  useEffect(() => {
    if (!form.city.trim() || !form.country) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGeoStatus("loading");

    debounceRef.current = setTimeout(async () => {
      const result = await geocodeCity(form.city.trim(), form.country);
      if (result) {
        setForm((f) => ({ ...f, lat: String(result.lat), lng: String(result.lng) }));
        setGeoStatus("city");
      } else {
        // Fall back to country centroid
        const countryData = COUNTRIES.find((c) => c.name === form.country);
        if (countryData) {
          setForm((f) => ({ ...f, lat: String(countryData.lat), lng: String(countryData.lng) }));
        }
        setGeoStatus("failed");
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.city, form.country]);

  const mutation = useCreateVisit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
        toast({ title: "Visit logged successfully" });
        navigate(preCountry ? "/countries" : "/visits");
      },
      onError: () => toast({ title: "Failed to save visit", variant: "destructive" }),
    },
  });

  const handleCountrySelect = (name: string, code: string, lat: number, lng: number) => {
    setForm((f) => ({ ...f, country: name, countryCode: code, lat: String(lat), lng: String(lng) }));
    setCountrySearch(name);
    setShowDropdown(false);
    setGeoStatus("country");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.country || !form.city || !form.visitDate || !form.lat || !form.lng) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    mutation.mutate({
      data: {
        country: form.country,
        countryCode: form.countryCode,
        city: form.city,
        visitDate: form.visitDate,
        notes: form.notes || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
      },
    });
  };

  const backHref = preCountry ? "/countries" : "/visits";

  const geoHint = {
    idle: null,
    loading: (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Finding city coordinates…
      </span>
    ),
    city: (
      <span className="flex items-center gap-1 text-emerald-600">
        <CheckCircle2 className="w-3 h-3" />
        Pinned to {form.city}
      </span>
    ),
    country: (
      <span className="flex items-center gap-1 text-amber-600">
        <MapPin className="w-3 h-3" />
        Using country center — type a city to pin it precisely
      </span>
    ),
    failed: (
      <span className="flex items-center gap-1 text-amber-600">
        <AlertCircle className="w-3 h-3" />
        City not found — using country center. You can adjust manually.
      </span>
    ),
  }[geoStatus];

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(backHref)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {preCountry ? `Back to ${preCountry}` : "Back to visits"}
      </button>

      <h1 className="text-2xl font-semibold mb-1">
        {preCountry ? `Add city in ${preCountry}` : "Log a visit"}
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        {preCountry
          ? `Record a city you visited in ${preCountry}.`
          : "Add a place you've been to your travel atlas."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Country */}
        {countryLocked ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">Country</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border bg-muted/40 text-sm text-foreground">
              <span className="text-base">{countryFlag(form.countryCode)}</span>
              <span>{form.country}</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <label className="block text-sm font-medium mb-1.5">
              Country <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowDropdown(true);
                setForm((f) => ({ ...f, country: "", countryCode: "" }));
                setGeoStatus("idle");
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search countries..."
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
            />
            {showDropdown && filteredCountries.length > 0 && (
              <div className="absolute z-10 w-full bg-popover border border-popover-border rounded-md shadow-lg mt-1 overflow-hidden">
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
        )}

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            City <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="e.g. Tokyo"
            autoFocus={countryLocked}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Visit Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Visit date <span className="text-destructive">*</span>
          </label>
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
              onChange={(e) => { setForm((f) => ({ ...f, lat: e.target.value })); setGeoStatus("idle"); }}
              placeholder="e.g. 35.67"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => { setForm((f) => ({ ...f, lng: e.target.value })); setGeoStatus("idle"); }}
              placeholder="e.g. 139.65"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {geoHint && <p className="text-xs -mt-3">{geoHint}</p>}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="What made this trip memorable?"
            rows={3}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || geoStatus === "loading"}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : geoStatus === "loading" ? "Locating city…" : "Save visit"}
        </button>
      </form>
    </div>
  );
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
