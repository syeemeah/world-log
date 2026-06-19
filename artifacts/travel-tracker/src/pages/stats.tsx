import { ExternalLink, BarChart2, Globe, Map, Layers, BookOpen, Camera, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useGetYearStats,
  useGetOverview,
  getGetYearStatsQueryKey,
  getGetOverviewQueryKey,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

interface TravelLink {
  id: number;
  year: number;
  title: string;
  url: string;
  type: "blog" | "photos" | "other";
  description: string | null;
}

const TYPE_META = {
  blog:   { label: "Blog", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  photos: { label: "Photos", icon: Camera, color: "text-amber-600 bg-amber-50" },
  other:  { label: "Link", icon: Link2, color: "text-muted-foreground bg-muted" },
} as const;

export default function Stats() {
  const { session } = useAuth();

  const { data: yearStats = [], isLoading: yearLoading } = useGetYearStats({
    query: { queryKey: getGetYearStatsQueryKey() },
  });
  const { data: overview } = useGetOverview({
    query: { queryKey: getGetOverviewQueryKey() },
  });
  const { data: links = [] } = useQuery<TravelLink[]>({
    queryKey: ["links"],
    queryFn: async () => {
      const res = await fetch("/api/links", {
        headers: { Authorization: `Bearer ${session?.token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to load links");
      return res.json() as Promise<TravelLink[]>;
    },
    enabled: !!session?.token,
  });

  const linksByYear = links.reduce<Record<number, TravelLink[]>>((acc, l) => {
    (acc[l.year] ??= []).push(l);
    return acc;
  }, {});

  const chartData = [...yearStats].sort((a, b) => a.year - b.year).map((y) => ({
    year: String(y.year),
    visits: y.visits,
    countries: y.countries,
    cities: y.cities,
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">By Year</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your travel history, year by year</p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Overall totals */}
        {overview && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Countries</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{overview.totalCountries}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Map className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cities</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{overview.totalCities}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Visits</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{overview.totalVisits}</p>
            </div>
          </div>
        )}

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Visits per year</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,90%)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(215,20%,50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215,20%,50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid hsl(215,20%,88%)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "hsl(215,15%,94%)" }}
                />
                <Bar dataKey="visits" fill="hsl(196,80%,42%)" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year-by-year table */}
        {yearLoading ? (
          <div className="text-center py-8">
            <Globe className="w-6 h-6 text-primary animate-pulse mx-auto" />
          </div>
        ) : yearStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No travel data yet. Log your first visit to see stats.</div>
        ) : (
          <div className="space-y-3">
            {yearStats.map((row) => {
              const yearLinks = linksByYear[row.year] ?? [];
              return (
                <div key={row.year} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Year header row */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
                    <span className="text-lg font-bold text-foreground w-14 flex-shrink-0">{row.year}</span>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Globe className="w-3.5 h-3.5" />{row.countries} {row.countries === 1 ? "country" : "countries"}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <Map className="w-3.5 h-3.5" />{row.cities} {row.cities === 1 ? "city" : "cities"}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground truncate">{row.countryList?.join(", ") || "—"}</span>
                    </div>
                  </div>
                  {/* Journal links for this year */}
                  {yearLinks.length > 0 && (
                    <div className="px-5 py-3 flex flex-wrap gap-2">
                      {yearLinks.map((link) => {
                        const meta = TYPE_META[link.type];
                        const Icon = meta.icon;
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-75 ${meta.color}`}
                          >
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            {link.title}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
