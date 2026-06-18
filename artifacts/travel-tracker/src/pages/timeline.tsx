import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import { Play, Pause, SkipBack, SkipForward, Clock, Globe } from "lucide-react";
import { useGetTimeline, getGetTimelineQueryKey } from "@workspace/api-client-react";
import type { Visit } from "@workspace/api-client-react";

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
        {/* Controls */}
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
            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{ color: "hsl(196,80%,55%)", weight: 2, opacity: 0.6, dashArray: "6 4" }}
              />
            )}
            {visibleVisits.map((visit, i) => (
              <CircleMarker
                key={visit.id}
                center={[visit.lat, visit.lng]}
                radius={i === visibleVisits.length - 1 ? 10 : 7}
                pathOptions={{
                  color: i === visibleVisits.length - 1 ? "hsl(35,80%,55%)" : "hsl(196,80%,42%)",
                  fillColor: i === visibleVisits.length - 1 ? "hsl(35,80%,65%)" : "hsl(196,80%,55%)",
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <p className="font-semibold text-sm">{visit.city}</p>
                  <p className="text-xs text-gray-600">{visit.country}</p>
                  <p className="text-xs text-gray-500">{new Date(visit.visitDate).toLocaleDateString()}</p>
                </Popup>
              </CircleMarker>
            ))}
            {current && <FlyTo lat={current.lat} lng={current.lng} />}
          </MapContainer>
        </div>

        {/* Visit list sidebar */}
        <div className="w-64 border-l border-border overflow-y-auto bg-card">
          <div className="px-4 py-2 border-b border-border sticky top-0 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Journey</p>
          </div>
          {visits.map((visit, i) => {
            const isPast = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={visit.id}
                onClick={() => { stop(); setCurrentIndex(i); }}
                className={`px-4 py-2.5 border-b border-border cursor-pointer transition-colors text-sm ${
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : isPast
                    ? "text-foreground hover:bg-muted/50"
                    : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? "bg-amber-500" : isPast ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <div>
                    <p className="font-medium leading-tight">{visit.city}</p>
                    <p className="text-xs text-muted-foreground">{visit.country} · {new Date(visit.visitDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
