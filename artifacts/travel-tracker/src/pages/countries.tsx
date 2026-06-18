import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Camera, X, Save, ChevronDown, ChevronUp } from "lucide-react";
import {
  useListVisits,
  useListMemories,
  useUpsertMemory,
  getListMemoriesQueryKey,
  getListVisitsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const TOTAL_COUNTRIES = 195;

interface CountryGroup {
  country: string;
  countryCode: string;
  cities: string[];
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}

function CountryCard({
  group,
  memory,
  onSave,
}: {
  group: CountryGroup;
  memory?: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null };
  onSave: (code: string, data: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null }) => void;
}) {
  const [memo, setMemo] = useState(memory?.bestMemory ?? "");
  const [photo, setPhoto] = useState<string | null>(memory?.bestPhotoBase64 ?? null);
  const [photoMime, setPhotoMime] = useState<string | null>(memory?.bestPhotoMime ?? null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = memo !== (memory?.bestMemory ?? "") || photo !== (memory?.bestPhotoBase64 ?? null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setPhoto(base64);
      setPhotoMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{countryFlag(group.countryCode)}</span>
          <div className="text-left min-w-0">
            <p className="font-semibold text-foreground leading-tight">{group.country}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {group.cities.join(", ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {photo && <Camera className="w-3.5 h-3.5 text-primary" />}
          {memo && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Has memo" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          {/* Photo dropbox */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Best photo</p>
            {photo ? (
              <div className="relative group">
                <img
                  src={`data:${photoMime};base64,${photo}`}
                  alt="Best photo"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => { setPhoto(null); setPhotoMime(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <Camera className="w-6 h-6 text-muted-foreground mb-1.5" />
                <p className="text-xs text-muted-foreground">Drop a photo or <span className="text-primary">browse</span></p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG, WEBP — max 5 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Memo */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Best memory</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={`What's your favourite memory from ${group.country}?`}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Save */}
          {dirty && (
            <button
              onClick={() => onSave(group.countryCode, { bestMemory: memo || null, bestPhotoBase64: photo, bestPhotoMime: photoMime })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Countries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: visits = [] } = useListVisits({}, { query: { queryKey: getListVisitsQueryKey() } });
  const { data: memories = [] } = useListMemories({ query: { queryKey: getListMemoriesQueryKey() } });

  const upsertMutation = useUpsertMemory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
        toast({ title: "Memory saved" });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    },
  });

  // Group visits by country
  const countryMap = new Map<string, CountryGroup>();
  for (const v of visits) {
    if (!countryMap.has(v.countryCode)) {
      countryMap.set(v.countryCode, { country: v.country, countryCode: v.countryCode, cities: [] });
    }
    const g = countryMap.get(v.countryCode)!;
    if (!g.cities.includes(v.city)) g.cities.push(v.city);
  }
  const groups = Array.from(countryMap.values()).sort((a, b) => a.country.localeCompare(b.country));

  const memoriesByCode = Object.fromEntries(memories.map((m) => [m.countryCode, m]));

  const visited = groups.length;
  const pct = Math.round((visited / TOTAL_COUNTRIES) * 100);

  const handleSave = (countryCode: string, data: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null }) => {
    const country = countryMap.get(countryCode)?.country ?? countryCode;
    upsertMutation.mutate({ countryCode, data: { ...data, country } });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">Countries</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your memories from each country</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Progress section */}
        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-bold text-foreground">{visited}</span>
              <span className="text-muted-foreground text-sm ml-1.5">/ {TOTAL_COUNTRIES} countries</span>
            </div>
            <span className="text-sm font-semibold text-primary">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {TOTAL_COUNTRIES - visited} more to go — keep exploring.
          </p>
        </div>

        {/* Country cards */}
        <div className="px-6 py-5">
          {groups.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No countries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Log a visit to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <CountryCard
                  key={group.countryCode}
                  group={group}
                  memory={memoriesByCode[group.countryCode]}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
