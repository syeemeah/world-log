import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import { Play, Pause, SkipBack, SkipForward, Clock, Globe } from "lucide-react";
import { useGetTimeline, getGetTimelineQueryKey } from "@workspace/api-client-react";
import type { Visit } from "@workspace/api-client-react";

// Shared year palette (same order as world map)
const YEAR_PALETTE = [
  { stroke: "#0369a1", fill: "#38bdf8" },
  { stroke: "#047857", fill: "#34d399" },
  { stroke: "#b45309", fill: "#fbbf24" },
  { stroke: "#7c3aed", fill: "#a78bfa" },
  { stroke: "#be123c", fill: "#fb7185" },
  { stroke: "#0e7490", fill: "#22d3ee" },
  { stroke: "#a16207", fill: "#facc15" },
  { stroke: "#065f46", fill: "#6ee7b7" },
  { stroke: "#9333ea", fill: "#c084fc" },
  { stroke: "#c2410c", fill: "#fb923c" },
  { stroke: "#0f766e", fill: "#5eead4" },
  { stroke: "#1d4ed8", fill: "#60a5fa" },
];

function getYearColor(year: number, sortedYears: number[]) {
  const idx = sortedYears.indexOf(year);
  return YEAR_PALETTE[idx % YEAR_PALETTE.length];
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 5), { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export default function Timeline() {
  const { data: visits = [], isLoading } = useGetTimeline({
    query: { queryKey: getGetTimelineQueryKey() },
  });

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleVisits = currentIndex === -1 ? [] : visits.slice(0, currentIndex + 1);
  const current: Visit | undefined = visits[currentIndex];

  const sortedYears = useMemo(() => {
    const years = Array.from(new Set(visits.map((v) => new Date(v.visitDate).getFullYear())));
    return years.sort((a, b) => a - b);
  }, [visits]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const play = useCallback(() => {
    if (visits.length === 0) return;
    setPlaying(true);
    if (currentIndex >= visits.length - 1) setCurrentIndex(-1);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= visits.length) {
          setPlaying(false);
          clearInterval(intervalRef.current!);
          return prev;
        }
        return next;
      });
    }, 1500);
  }, [visits, currentIndex]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const reset = () => { stop(); setCurrentIndex(-1); };
  const prev = () => { stop(); setCurrentIndex((i) => Math.max(-1, i - 1)); };
  const next = () => { stop(); setCurrentIndex((i) => Math.min(visits.length - 1, i + 1)); };

  const polylinePositions = visibleVisits.map((v) => [v.lat, v.lng] as [number, number]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Globe className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-medium">No visits logged yet</p>
          <p className="text-sm text-muted-foreground mt-1">Log some visits to watch your journey unfold.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Timeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentIndex === -1
              ? "Press play to animate your journey"
              : `${currentIndex + 1} / ${visits.length} visits`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-2 rounded-md hover:bg-muted transition-colors" title="Reset">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={prev} disabled={currentIndex <= -1} className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            <SkipForward className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={playing ? stop : play}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={next} disabled={currentIndex >= visits.length - 1} className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="px-6 py-2 border-b border-border bg-muted/30">
        <input
          type="range"
          min={-1}
          max={visits.length - 1}
          value={currentIndex}
          onChange={(e) => { stop(); setCurrentIndex(Number(e.target.value)); }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
          <span>{visits[0] ? new Date(visits[0].visitDate).getFullYear() : ""}</span>
          <span>{visits[visits.length - 1] ? new Date(visits[visits.length - 1].visitDate).getFullYear() : ""}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[20, 10]} zoom={2} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Polyline segments colored by year */}
            {visibleVisits.slice(1).map((visit, i) => {
              const year = new Date(visibleVisits[i].visitDate).getFullYear();
              const { fill } = getYearColor(year, sortedYears);
              return (
                <Polyline
                  key={`seg-${visit.id}`}
                  positions={[
                    [visibleVisits[i].lat, visibleVisits[i].lng],
                    [visit.lat, visit.lng],
                  ]}
                  pathOptions={{ color: fill, weight: 2, opacity: 0.55, dashArray: "6 4" }}
                />
              );
            })}

            {visibleVisits.map((visit, i) => {
              const year = new Date(visit.visitDate).getFullYear();
              const { stroke, fill } = getYearColor(year, sortedYears);
              const isCurrent = i === visibleVisits.length - 1;
              return (
                <CircleMarker
                  key={visit.id}
                  center={[visit.lat, visit.lng]}
                  radius={isCurrent ? 10 : 7}
                  pathOptions={{
                    color: isCurrent ? "#fff" : stroke,
                    fillColor: fill,
                    fillOpacity: 0.9,
                    weight: isCurrent ? 3 : 1.5,
                  }}
                >
                  <Popup>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: fill, border: `2px solid ${stroke}` }}
                      />
                      <p className="font-semibold text-sm">{visit.city}</p>
                    </div>
                    <p className="text-xs text-gray-600">{visit.country}</p>
                    <p className="text-xs text-gray-500">{new Date(visit.visitDate).toLocaleDateString()}</p>
                  </Popup>
                </CircleMarker>
              );
            })}

            {current && <FlyTo lat={current.lat} lng={current.lng} />}

            {/* Year legend */}
            {sortedYears.length > 0 && (
              <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: "none" }}>
                <div
                  style={{ pointerEvents: "auto" }}
                  className="leaflet-control bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 mb-6 ml-3 border border-gray-200"
                >
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</p>
                  <div className="flex flex-col gap-1">
                    {sortedYears.map((year) => {
                      const { stroke, fill } = getYearColor(year, sortedYears);
                      return (
                        <div key={year} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: fill, border: `2px solid ${stroke}` }}
                          />
                          <span className="text-xs text-gray-700 font-medium">{year}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </MapContainer>
        </div>

        {/* Visit list sidebar */}
        <div className="w-64 border-l border-border overflow-y-auto bg-card">
          <div className="px-4 py-2 border-b border-border sticky top-0 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Journey</p>
          </div>

          {/* Group by year */}
          {sortedYears.map((year) => {
            const yearVisits = visits.filter(
              (v) => new Date(v.visitDate).getFullYear() === year
            );
            const { stroke, fill } = getYearColor(year, sortedYears);
            return (
              <div key={year}>
                {/* Year header */}
                <div
                  className="px-4 py-1.5 flex items-center gap-2 border-b border-border sticky top-[33px] bg-card/95 backdrop-blur-sm z-10"
                  style={{ borderLeft: `3px solid ${fill}` }}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: fill, border: `2px solid ${stroke}` }}
                  />
                  <span className="text-xs font-semibold" style={{ color: stroke }}>{year}</span>
                </div>

                {yearVisits.map((visit) => {
                  const idx = visits.indexOf(visit);
                  const isPast = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={visit.id}
                      onClick={() => { stop(); setCurrentIndex(idx); }}
                      className={`px-4 py-2.5 border-b border-border cursor-pointer transition-colors text-sm ${
                        isCurrent
                          ? "bg-accent text-accent-foreground"
                          : isPast
                          ? "text-foreground hover:bg-muted/50"
                          : "text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                          style={
                            isCurrent
                              ? { background: fill, border: `2px solid ${stroke}`, transform: "scale(1.3)" }
                              : isPast
                              ? { background: fill, border: `2px solid ${stroke}` }
                              : { background: "transparent", border: "2px solid #d1d5db" }
                          }
                        />
                        <div>
                          <p className="font-medium leading-tight">{visit.city}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.country} ·{" "}
                            {new Date(visit.visitDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
