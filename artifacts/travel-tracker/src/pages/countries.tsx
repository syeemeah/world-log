import { useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Globe, Camera, X, Save, ChevronDown, ChevronUp,
  Pencil, Trash2, PlusCircle, MapPin, CalendarDays,
  BookOpen, Link2, ExternalLink,
} from "lucide-react";
import {
  useListVisits,
  useDeleteVisit,
  useListMemories,
  useUpsertMemory,
  getListMemoriesQueryKey,
  getListVisitsQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import type { Visit } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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

const TOTAL_COUNTRIES = 195;

interface CountryGroup {
  country: string;
  countryCode: string;
  visits: Visit[];
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}

function CountryCard({
  group,
  memory,
  links,
  onSave,
  onDeleteVisit,
}: {
  group: CountryGroup;
  memory?: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null };
  links: TravelLink[];
  onSave: (code: string, data: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null }) => void;
  onDeleteVisit: (id: number, city: string) => void;
}) {
  const [memo, setMemo] = useState(memory?.bestMemory ?? "");
  const [photo, setPhoto] = useState<string | null>(memory?.bestPhotoBase64 ?? null);
  const [photoMime, setPhotoMime] = useState<string | null>(memory?.bestPhotoMime ?? null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = memo !== (memory?.bestMemory ?? "") || photo !== (memory?.bestPhotoBase64 ?? null);

  const uniqueCities = Array.from(new Set(group.visits.map((v) => v.city))).join(", ");

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5 MB."); return; }
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
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{countryFlag(group.countryCode)}</span>
          <div className="text-left min-w-0">
            <p className="font-semibold text-foreground leading-tight">{group.country}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{uniqueCities}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs text-muted-foreground">{group.visits.length} {group.visits.length === 1 ? "visit" : "visits"}</span>
          {photo && <Camera className="w-3.5 h-3.5 text-primary" />}
          {memo && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          {links.length > 0 && <BookOpen className="w-3.5 h-3.5 text-blue-500" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Visits list */}
          <div className="px-5 pt-4 pb-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cities visited</p>
              <Link
                href={`/visits/new?country=${encodeURIComponent(group.country)}&code=${group.countryCode}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 font-medium transition-opacity"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add city
              </Link>
            </div>

            {group.visits
              .slice()
              .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
              .map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 group transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{visit.city}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CalendarDays className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {new Date(visit.visitDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                        {visit.notes && (
                          <span className="text-xs text-muted-foreground/60 truncate max-w-[180px]">· {visit.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <Link
                      href={`/visits/${visit.id}/edit`}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteVisit(visit.id, visit.city); }}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="mx-5 border-t border-border" />

          {/* Memory + photo section */}
          <div className="px-5 pb-5 pt-4 space-y-4">
            {/* Photo dropbox */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Best photo</p>
              {photo ? (
                <div className="relative group/photo">
                  <img
                    src={`data:${photoMime};base64,${photo}`}
                    alt="Best photo"
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => { setPhoto(null); setPhotoMime(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70"
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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
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

            {dirty && (
              <button
                onClick={() => onSave(group.countryCode, { bestMemory: memo || null, bestPhotoBase64: photo, bestPhotoMime: photoMime })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Save className="w-3.5 h-3.5" />
                Save memory
              </button>
            )}
          </div>

          {/* Journal links */}
          {links.length > 0 && (
            <>
              <div className="mx-5 border-t border-border" />
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">Travel Journal</p>
                <div className="flex flex-wrap gap-2">
                  {links.map((link) => {
                    const meta = TYPE_META[link.type];
                    const Icon = meta.icon;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${link.year}${link.description ? " · " + link.description : ""}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-75 ${meta.color}`}
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span>{link.year} · {link.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Countries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useAuth();

  const { data: visits = [] } = useListVisits({}, { query: { queryKey: getListVisitsQueryKey() } });
  const { data: memories = [] } = useListMemories({ query: { queryKey: getListMemoriesQueryKey() } });
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

  const upsertMutation = useUpsertMemory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
        toast({ title: "Memory saved" });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteVisit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
        toast({ title: "Visit removed" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  // Group visits by country
  const countryMap = new Map<string, CountryGroup>();
  for (const v of visits) {
    if (!countryMap.has(v.countryCode)) {
      countryMap.set(v.countryCode, { country: v.country, countryCode: v.countryCode, visits: [] });
    }
    countryMap.get(v.countryCode)!.visits.push(v);
  }
  const groups = Array.from(countryMap.values()).sort((a, b) => a.country.localeCompare(b.country));

  const memoriesByCode = Object.fromEntries(memories.map((m) => [m.countryCode, m]));

  // Map journal links to each country via the years that country was visited
  const linksByCountry = new Map<string, TravelLink[]>();
  for (const group of groups) {
    const visitYears = new Set(group.visits.map((v) => new Date(v.visitDate).getFullYear()));
    const matching = links.filter((l) => visitYears.has(l.year));
    if (matching.length) linksByCountry.set(group.countryCode, matching);
  }
  const visited = groups.length;
  const pct = Math.round((visited / TOTAL_COUNTRIES) * 100);

  const handleSave = (countryCode: string, data: { bestMemory?: string | null; bestPhotoBase64?: string | null; bestPhotoMime?: string | null }) => {
    const country = countryMap.get(countryCode)?.country ?? countryCode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsertMutation.mutate({ countryCode, data: { ...data, country } as any });
  };

  const handleDeleteVisit = (id: number, city: string) => {
    if (!confirm(`Remove visit to ${city}?`)) return;
    deleteMutation.mutate({ id });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">Countries</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Visits, memories, and photos by country</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Progress */}
        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-bold text-foreground">{visited}</span>
              <span className="text-muted-foreground text-sm ml-1.5">/ {TOTAL_COUNTRIES} countries</span>
            </div>
            <span className="text-sm font-semibold text-primary">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{TOTAL_COUNTRIES - visited} more to go — keep exploring.</p>
        </div>

        {/* Cards */}
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
                  links={linksByCountry.get(group.countryCode) ?? []}
                  onSave={handleSave}
                  onDeleteVisit={handleDeleteVisit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
