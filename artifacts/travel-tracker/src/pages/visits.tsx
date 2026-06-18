import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Pencil, Trash2, Globe, Search, Filter } from "lucide-react";
import {
  useListVisits,
  useDeleteVisit,
  getListVisitsQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Visits() {
  const [year, setYear] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = {
    ...(year ? { year: Number(year) } : {}),
    ...(country ? { country } : {}),
  };

  const { data: visits = [], isLoading } = useListVisits(params, {
    query: { queryKey: getListVisitsQueryKey(params) },
  });

  const deleteMutation = useDeleteVisit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
        toast({ title: "Visit deleted" });
      },
      onError: () => toast({ title: "Failed to delete visit", variant: "destructive" }),
    },
  });

  const years = Array.from(new Set(visits.map((v) => new Date(v.visitDate).getFullYear()))).sort((a, b) => b - a);
  const countries = Array.from(new Set(visits.map((v) => v.country))).sort();

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">All Visits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{visits.length} {visits.length === 1 ? "visit" : "visits"} recorded</p>
        </div>
        <Link href="/visits/new" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <PlusCircle className="w-4 h-4" />
          Log visit
        </Link>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(year || country) && (
          <button onClick={() => { setYear(""); setCountry(""); }} className="text-xs text-muted-foreground hover:text-foreground underline">Clear filters</button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Globe className="w-6 h-6 text-primary animate-pulse" />
          </div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <Search className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No visits found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {year || country ? "Try clearing your filters." : "Log your first visit to get started."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">City</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} className="border-b border-border hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-3 font-medium text-foreground">{visit.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-base">{countryFlag(visit.countryCode)}</span>
                      {visit.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(visit.visitDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    <span className="truncate block">{visit.notes || <span className="text-muted-foreground/40 italic">No notes</span>}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link href={`/visits/${visit.id}/edit`} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Delete visit to ${visit.city}?`)) {
                            deleteMutation.mutate({ id: visit.id });
                          }
                        }}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
