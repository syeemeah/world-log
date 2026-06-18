import { BarChart2, Globe, Map, Layers } from "lucide-react";
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

export default function Stats() {
  const { data: yearStats = [], isLoading: yearLoading } = useGetYearStats({
    query: { queryKey: getGetYearStatsQueryKey() },
  });
  const { data: overview } = useGetOverview({
    query: { queryKey: getGetOverviewQueryKey() },
  });

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
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Countries</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cities</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Visits</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Countries visited</th>
                </tr>
              </thead>
              <tbody>
                {yearStats.map((row, i) => (
                  <tr key={row.year} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-5 py-3.5 font-semibold text-foreground">{row.year}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs">{row.countries}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs">{row.cities}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-semibold text-xs">{row.visits}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs max-w-xs">
                      <span className="leading-relaxed">{row.countryList?.join(", ") || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
