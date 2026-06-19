import { useState, useRef, useCallback } from "react";
import { Camera, X, Save, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetYearStats, getGetYearStatsQueryKey } from "@workspace/api-client-react";

interface JournalEntry {
  id: number;
  year: number;
  entryText: string | null;
  photoBase64: string | null;
  photoMime: string | null;
  updatedAt: string;
}

async function apiFetch(path: string, method: string, token: string, body?: object) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
    throw new Error(data.error ?? "Request failed");
  }
  if (res.status === 204) return null;
  return res.json() as Promise<JournalEntry>;
}

function YearCard({
  year,
  entry,
  token,
  onSave,
  onDelete,
}: {
  year: number;
  entry?: JournalEntry;
  token: string;
  onSave: (year: number, data: { entryText: string | null; photoBase64: string | null; photoMime: string | null }) => void;
  onDelete: (year: number) => void;
}) {
  const [text, setText] = useState(entry?.entryText ?? "");
  const [photo, setPhoto] = useState<string | null>(entry?.photoBase64 ?? null);
  const [photoMime, setPhotoMime] = useState<string | null>(entry?.photoMime ?? null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(!!entry);
  const fileRef = useRef<HTMLInputElement>(null);

  const savedText = entry?.entryText ?? "";
  const savedPhoto = entry?.photoBase64 ?? null;
  const dirty = text !== savedText || photo !== savedPhoto;

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
      {/* Year header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground tabular-nums">{year}</span>
          {entry?.entryText && (
            <span className="text-xs text-muted-foreground truncate max-w-[260px] hidden sm:block">
              {entry.entryText.slice(0, 80)}{entry.entryText.length > 80 ? "…" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {entry?.photoBase64 && <Camera className="w-3.5 h-3.5 text-primary" />}
          {entry?.entryText && <BookOpen className="w-3.5 h-3.5 text-amber-500" />}
          <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pt-4 pb-5 space-y-4">
          {/* Photo */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Photo</p>
            {photo ? (
              <div className="relative group/photo">
                <img
                  src={`data:${photoMime};base64,${photo}`}
                  alt={`${year}`}
                  className="w-full h-56 object-cover rounded-lg border border-border"
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
                className={`border-2 border-dashed rounded-lg h-36 flex flex-col items-center justify-center cursor-pointer transition-colors ${
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

          {/* Text */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Journal entry</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`What happened in ${year}? Where did you go, what did you see?`}
              rows={5}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            {entry && (
              <button
                onClick={() => { if (confirm(`Delete journal entry for ${year}?`)) onDelete(year); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete entry
              </button>
            )}
            {dirty && (
              <button
                onClick={() => onSave(year, { entryText: text || null, photoBase64: photo, photoMime })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity ml-auto"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Links() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const token = session?.token ?? "";

  const { data: entries = [], isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    queryFn: async () => {
      const res = await fetch("/api/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load journal");
      return res.json() as Promise<JournalEntry[]>;
    },
    enabled: !!token,
  });

  const { data: yearStats = [] } = useGetYearStats({
    query: { queryKey: getGetYearStatsQueryKey() },
  });

  // Union of years from visits and years from existing journal entries
  const visitYears = new Set(yearStats.map((y) => y.year));
  const journalYears = new Set(entries.map((e) => e.year));
  const allYears = Array.from(new Set([...visitYears, ...journalYears])).sort((a, b) => b - a);

  const entriesByYear = Object.fromEntries(entries.map((e) => [e.year, e]));

  const saveMutation = useMutation({
    mutationFn: ({ year, data }: { year: number; data: { entryText: string | null; photoBase64: string | null; photoMime: string | null } }) =>
      apiFetch(`/api/journal/${year}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      toast({ title: "Journal saved" });
    },
    onError: (err: Error) => toast({ title: "Failed to save", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (year: number) => apiFetch(`/api/journal/${year}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      toast({ title: "Entry deleted" });
    },
    onError: (err: Error) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">Travel Journal</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Write about each year — add a photo and your memories</p>
      </div>

      <div className="px-6 py-6 max-w-2xl">
        {entriesLoading ? (
          <div className="text-center py-12">
            <BookOpen className="w-6 h-6 text-primary animate-pulse mx-auto" />
          </div>
        ) : allYears.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No travel years yet</p>
            <p className="text-xs mt-1">Log some visits to unlock journal entries.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allYears.map((year) => (
              <YearCard
                key={year}
                year={year}
                entry={entriesByYear[year]}
                token={token}
                onSave={(y, data) => saveMutation.mutate({ year: y, data })}
                onDelete={(y) => deleteMutation.mutate(y)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
