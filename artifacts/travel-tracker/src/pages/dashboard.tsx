import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { PlusCircle, Globe, Map, Layers, Plane } from "lucide-react";
import { useListVisits, useGetOverview, getGetOverviewQueryKey } from "@workspace/api-client-react";

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      try {
        map.fitBounds(positions, { padding: [40, 40], maxZoom: 5 });
      } catch {}
    }
  }, [positions, map]);
  return null;
}

export default function Dashboard() {
  const { data: visits = [], isLoading: visitsLoading } = useListVisits();
  const { data: overview } = useGetOverview({ query: { queryKey: getGetOverviewQueryKey() } });

  const positions = useMemo(
    () => visits.map((v) => [v.lat, v.lng] as [number, number]),
    [visits]
  );

  const statCards = [
    { label: "Countries", value: overview?.totalCountries ?? "—", icon: Globe, color: "text-primary" },
    { label: "Cities", value: overview?.totalCities ?? "—", icon: Map, color: "text-emerald-500" },
    { label: "Total Visits", value: overview?.totalVisits ?? "—", icon: Layers, color: "text-amber-500" },
    { label: "Top Country", value: overview?.topCountry ?? "—", icon: Plane, color: "text-violet-500" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-semibold text-foreground">World Map</h1>
          {overview?.firstVisit && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Traveling since {new Date(overview.firstVisit).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
            </p>
          )}
        </div>
        <Link href="/visits/new" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <PlusCircle className="w-4 h-4" />
          Log visit
        </Link>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 border-b border-border bg-muted/40 grid grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-lg px-4 py-2.5 border border-border flex items-center gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              <p className="text-base font-semibold text-foreground leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {visitsLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading your world...</p>
            </div>
          </div>
        ) : visits.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10">
            <Globe className="w-12 h-12 text-primary/40 mx-auto mb-3" />
            <h3 className="text-base font-medium text-foreground mb-1">The world awaits</h3>
            <p className="text-sm text-muted-foreground mb-4">Log your first visit to see it appear on the map.</p>
            <Link href="/visits/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              <PlusCircle className="w-4 h-4" />
              Log your first visit
            </Link>
          </div>
        ) : (
          <MapContainer
            center={[20, 10]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.length > 0 && <FitBounds positions={positions} />}
            {visits.map((visit) => (
              <CircleMarker
                key={visit.id}
                center={[visit.lat, visit.lng]}
                radius={8}
                pathOptions={{
                  color: "hsl(196,80%,42%)",
                  fillColor: "hsl(196,80%,55%)",
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Tooltip
                  permanent
                  direction="right"
                  offset={[10, 0]}
                  opacity={1}
                  className="map-label"
                >
                  <span className="map-label-city">{visit.city}</span>
                  <span className="map-label-country">{visit.country}</span>
                </Tooltip>
                <Popup>
                  <div className="min-w-[140px]">
                    <p className="font-semibold text-sm">{visit.city}</p>
                    <p className="text-xs text-gray-600">{visit.country}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(visit.visitDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {visit.notes && <p className="text-xs text-gray-600 mt-1 italic">{visit.notes}</p>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
