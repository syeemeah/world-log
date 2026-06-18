import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  useCreateVisit,
  getListVisitsQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { COUNTRIES } from "@/lib/countries";
import { useToast } from "@/hooks/use-toast";

export default function NewVisit() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    country: "",
    countryCode: "",
    city: "",
    visitDate: new Date().toISOString().split("T")[0],
    notes: "",
    lat: "",
    lng: "",
  });

  const [countrySearch, setCountrySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCountries = countrySearch.length > 0
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 10)
    : [];

  useEffect(() => {
    const selected = COUNTRIES.find((c) => c.name === form.country);
    if (selected && (!form.lat || !form.lng)) {
      setForm((f) => ({ ...f, lat: String(selected.lat), lng: String(selected.lng) }));
    }
  }, [form.country]);

  const mutation = useCreateVisit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
        toast({ title: "Visit logged successfully" });
        navigate("/visits");
      },
      onError: () => toast({ title: "Failed to save visit", variant: "destructive" }),
    },
  });

  const handleCountrySelect = (name: string, code: string, lat: number, lng: number) => {
    setForm((f) => ({ ...f, country: name, countryCode: code, lat: String(lat), lng: String(lng) }));
    setCountrySearch(name);
    setShowDropdown(false);
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

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button onClick={() => navigate("/visits")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to visits
      </button>

      <h1 className="text-2xl font-semibold mb-1">Log a visit</h1>
      <p className="text-muted-foreground text-sm mb-8">Add a place you've been to your travel atlas.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Country */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1.5">Country <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => { setCountrySearch(e.target.value); setShowDropdown(true); setForm((f) => ({ ...f, country: "", countryCode: "" })); }}
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

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1.5">City <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="e.g. Tokyo"
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Visit Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Visit date <span className="text-destructive">*</span></label>
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
            <label className="block text-sm font-medium mb-1.5">Latitude <span className="text-destructive">*</span></label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="e.g. 35.67"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Longitude <span className="text-destructive">*</span></label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              placeholder="e.g. 139.65"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {form.country && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-3">
            <MapPin className="w-3 h-3" />
            Coordinates auto-filled from country centroid — adjust for specific city if needed.
          </p>
        )}

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
          disabled={mutation.isPending}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : "Save visit"}
        </button>
      </form>
    </div>
  );
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
