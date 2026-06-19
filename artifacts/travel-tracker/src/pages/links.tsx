import { useState, useRef } from "react";
import { ExternalLink, BookOpen, Camera, Link2, Plus, Pencil, Trash2, X, Check, Download, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TravelLink {
  id: number;
  year: number;
  title: string;
  url: string;
  type: "blog" | "photos" | "other";
  description: string | null;
  createdAt: string;
}

const TYPE_META = {
  blog:   { label: "Blog post",  icon: BookOpen, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  photos: { label: "Photo dump", icon: Camera,   color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  other:  { label: "Link",       icon: Link2,    color: "bg-muted text-muted-foreground" },
} as const;

async function fetchLinks(): Promise<TravelLink[]> {
  const res = await fetch("/api/links");
  if (!res.ok) throw new Error("Failed to load links");
  return res.json() as Promise<TravelLink[]>;
}

async function mutateLink(method: string, path: string, body: object, token: string) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: method !== "DELETE" ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const { error } = await res.json() as { error: string };
    throw new Error(error);
  }
  return method === "DELETE" ? null : (res.json() as Promise<TravelLink>);
}

function byYear(links: TravelLink[]) {
  const map: Record<number, TravelLink[]> = {};
  for (const l of links) (map[l.year] ??= []).push(l);
  return Object.entries(map)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year: Number(year), items }));
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2018 }, (_, i) => CURRENT_YEAR - i);

export default function Links() {
  const { session, isEditor } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const { data: links = [], isLoading } = useQuery({ queryKey: ["links"], queryFn: fetchLinks });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["links"] });

  const addMut = useMutation({
    mutationFn: (body: object) => mutateLink("POST", "/api/links", body, session!.token),
    onSuccess: () => { invalidate(); setShowAdd(false); setForm(emptyForm()); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => mutateLink("PATCH", `/api/links/${id}`, body, session!.token),
    onSuccess: () => { invalidate(); setEditId(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => mutateLink("DELETE", `/api/links/${id}`, {}, session!.token),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const emptyForm = () => ({ year: String(CURRENT_YEAR), title: "", url: "", type: "blog" as const, description: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  type EditForm = { year: string; id?: number; title?: string; url?: string; type?: "blog" | "photos" | "other"; description?: string | null; createdAt?: string };
  const [editForm, setEditForm] = useState<EditForm>({ year: "" });

  const startEdit = (l: TravelLink) => {
    setEditId(l.id);
    setEditForm({ year: String(l.year), title: l.title, url: l.url, type: l.type, description: l.description ?? "" });
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (links.length === 0) { toast({ title: "Nothing to export" }); return; }
    const exportData = links.map(({ year, title, url, type, description }) => ({ year, title, url, type, description }));
    downloadBlob(
      `sy-travel-journal-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(exportData, null, 2),
      "application/json"
    );
    toast({ title: `Exported ${links.length} links` });
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    e.target.value = "";
    setImporting(true);
    try {
      const text = await file.text();
      const items = JSON.parse(text) as Array<{ year?: number; title?: string; url?: string; type?: string; description?: string }>;
      if (!Array.isArray(items)) throw new Error("Expected a JSON array");

      let ok = 0, fail = 0;
      for (const item of items) {
        if (!item.year || !item.title || !item.url) { fail++; continue; }
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            year: Number(item.year), title: item.title, url: item.url,
            type: ["blog", "photos", "other"].includes(item.type ?? "") ? item.type : "blog",
            description: item.description ?? null,
          }),
        });
        if (res.ok) ok++; else fail++;
      }
      invalidate();
      toast({ title: "Import complete", description: `${ok} added${fail ? `, ${fail} skipped` : ""}` });
    } catch (err) {
      toast({ title: "Import failed", description: err instanceof Error ? err.message : "Invalid file", variant: "destructive" });
    } finally { setImporting(false); }
  };

  const groups = byYear(links);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Travel Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Blog posts &amp; photo dumps, year by year.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {/* Export — always visible */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Export all links as JSON"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          {isEditor && (
            <>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button
                onClick={() => importRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                title="Import links from JSON"
              >
                <Upload className="w-3.5 h-3.5" /> {importing ? "Importing…" : "Import"}
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add link
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-8 border border-border rounded-xl p-5 bg-card shadow-sm">
          <h2 className="font-semibold text-sm mb-4">New link</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "blog" }))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="blog">Blog post</option>
                  <option value="photos">Photo dump</option>
                  <option value="other">Other link</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Tokyo in Autumn"
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">URL</label>
              <input required type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description <span className="text-muted-foreground/60">(optional)</span></label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short note about this post…"
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm()); }} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                onClick={() => addMut.mutate({ year: Number(form.year), title: form.title, url: form.url, type: form.type, description: form.description || null })}
                disabled={addMut.isPending || !form.title || !form.url}
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {addMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isLoading && <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>}

      {!isLoading && links.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No links yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add blog posts or photo albums to get started.</p>
        </div>
      )}

      {/* Year groups */}
      <div className="space-y-10">
        {groups.map(({ year, items }) => (
          <div key={year}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-bold">{year}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "entry" : "entries"}</span>
            </div>
            <div className="space-y-3">
              {items.map((link) => {
                const meta = TYPE_META[link.type];
                const Icon = meta.icon;
                const isEditing = editId === link.id;
                return (
                  <div key={link.id} className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                            <select value={editForm.year} onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                            <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as "blog" }))}
                              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                              <option value="blog">Blog post</option>
                              <option value="photos">Photo dump</option>
                              <option value="other">Other link</option>
                            </select>
                          </div>
                        </div>
                        <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Title" />
                        <input value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="https://..." />
                        <input value={editForm.description ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Description (optional)" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
                          <button
                            onClick={() => editMut.mutate({ id: link.id, body: { year: Number(editForm.year), title: editForm.title, url: editForm.url, type: editForm.type, description: editForm.description || null } })}
                            disabled={editMut.isPending}
                            className="p-1.5 rounded hover:bg-muted"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-md ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className="font-medium text-sm hover:underline text-foreground flex items-center gap-1">
                              {link.title}
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${meta.color}`}>{meta.label}</span>
                          </div>
                          {link.description && <p className="text-xs text-muted-foreground mt-1">{link.description}</p>}
                        </div>
                        {isEditor && (
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <button onClick={() => startEdit(link)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete "${link.title}"?`)) delMut.mutate(link.id); }}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
