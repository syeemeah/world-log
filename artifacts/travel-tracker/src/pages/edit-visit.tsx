import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
  const [showDropdown, setShowDropdown] = useState(false);

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
    }
  }, [visit]);

  const filteredCountries = countrySearch.length > 0
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 10)
    : [];

  const handleCountrySelect = (name: string, code: string, lat: number, lng: number) => {
    setForm((f) => ({ ...f, country: name, countryCode: code, lat: String(lat), lng: String(lng) }));
    setCountrySearch(name);
    setShowDropdown(false);
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
    return <div className="flex items-center justify-center h-32"><span className="text-muted-foreground text-sm">Loading...</span></div>;
  }

  if (!visit) {
    return <div className="max-w-xl mx-auto px-6 py-8"><p className="text-muted-foreground">Visit not found.</p></div>;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <button onClick={() => navigate("/visits")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to visits
      </button>

      <h1 className="text-2xl font-semibold mb-1">Edit visit</h1>
      <p className="text-muted-foreground text-sm mb-8">{visit.city}, {visit.country}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => { setCountrySearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
          />
          {showDropdown && filteredCountries.length > 0 && (
            <div className="absolute z-10 w-full bg-popover border border-popover-border rounded-md shadow-lg mt-1 overflow-hidden">
              {filteredCountries.map((c) => (
                <button key={c.code} type="button" onMouseDown={() => handleCountrySelect(c.name, c.code, c.lat, c.lng)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                  <span>{countryFlag(c.code)}</span><span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">City</label>
          <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Visit date</label>
          <input type="date" value={form.visitDate} onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Latitude</label>
            <input type="number" step="any" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Longitude</label>
            <input type="number" step="any" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3} className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
