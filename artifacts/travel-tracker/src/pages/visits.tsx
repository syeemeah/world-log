import { useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Pencil, Trash2, Globe, Search, Filter, CheckSquare, Square, Download, Upload } from "lucide-react";
import {
  useListVisits,
  useDeleteVisit,
  getListVisitsQueryKey,
  getGetOverviewQueryKey,
  getGetYearStatsQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: string | null | undefined) {
  const s = v ?? "";
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVRow(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitCSVRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function splitCSVRow(row: string): string[] {
  const cols: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) { cols.push(cur); cur = ""; }
    else cur += ch;
  }
  cols.push(cur);
  return cols;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Visits() {
  const [year, setYear] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, isEditor } = useAuth();

  const params = {
    ...(year ? { year: Number(year) } : {}),
    ...(country ? { country } : {}),
  };

  const { data: visits = [], isLoading } = useListVisits(params, {
    query: { queryKey: getListVisitsQueryKey(params) },
  });

  const deleteMutation = useDeleteVisit();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetOverviewQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetYearStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTimelineQueryKey() });
  }, [queryClient]);

  const years = Array.from(new Set(visits.map((v) => new Date(v.visitDate).getFullYear()))).sort((a, b) => b - a);
  const countries = Array.from(new Set(visits.map((v) => v.country))).sort();

  const allIds = visits.map((v) => v.id);
  const allSelected = visits.length > 0 && selected.size === visits.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSingle = (id: number, city: string) => {
    if (!confirm(`Delete visit to ${city}?`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; }); invalidateAll(); toast({ title: "Visit deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Delete ${count} ${count === 1 ? "visit" : "visits"}?`)) return;
    setDeleting(true);
    try {
      await Promise.all(Array.from(selected).map((id) =>
        new Promise<void>((resolve, reject) => deleteMutation.mutate({ id }, { onSuccess: () => resolve(), onError: reject }))
      ));
      setSelected(new Set()); invalidateAll();
      toast({ title: `${count} ${count === 1 ? "visit" : "visits"} deleted` });
    } catch { toast({ title: "Some deletes failed", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const deleteAll = async () => {
    if (visits.length === 0) return;
    if (!confirm(`Delete all ${visits.length} visits? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all(visits.map((v) =>
        new Promise<void>((resolve, reject) => deleteMutation.mutate({ id: v.id }, { onSuccess: () => resolve(), onError: reject }))
      ));
      setSelected(new Set()); invalidateAll();
      toast({ title: "All visits deleted" });
    } catch { toast({ title: "Some deletes failed", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    // Fetch all visits (no filters) for a full export
    const res = await fetch("/api/visits");
    if (!res.ok) { toast({ title: "Export failed", variant: "destructive" }); return; }
    const all = await res.json() as typeof visits;
    const header = "city,country,countryCode,visitDate,notes,lat,lng";
    const rows = all.map((v) =>
      [v.city, v.country, v.countryCode, v.visitDate, v.notes ?? "", v.lat, v.lng].map(String).map(escapeCSV).join(",")
    );
    downloadBlob(`sy-travels-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"), "text/csv");
    toast({ title: `Exported ${all.length} visits` });
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    e.target.value = "";
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast({ title: "No rows found in file", variant: "destructive" }); return; }

      let ok = 0, fail = 0;
      for (const row of rows) {
        if (!row.city || !row.country || !row.visitDate) { fail++; continue; }
        const res = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            city: row.city, country: row.country,
            countryCode: row.countryCode || "??",
            visitDate: row.visitDate,
            notes: row.notes || null,
            lat: parseFloat(row.lat) || 0,
            lng: parseFloat(row.lng) || 0,
          }),
        });
        if (res.ok) ok++; else fail++;
      }
      invalidateAll();
      toast({ title: `Import complete`, description: `${ok} added${fail ? `, ${fail} skipped` : ""}` });
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
    finally { setImporting(false); }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">All Visits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visits.length} {visits.length === 1 ? "visit" : "visits"} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export — always visible */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Export all visits as CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          {/* Import — editors only */}
          {isEditor && (
            <>
              <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <button
                onClick={() => importRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                title="Import visits from CSV"
              >
                <Upload className="w-3.5 h-3.5" /> {importing ? "Importing…" : "Import CSV"}
              </button>
              {visits.length > 0 && (
                <button
                  onClick={deleteAll}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete all
                </button>
              )}
              <Link
                href="/visits/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="w-4 h-4" /> Log visit
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Import hint bar */}
      {isEditor && (
        <div className="px-6 py-2 border-b border-border bg-muted/20 text-xs text-muted-foreground">
          CSV format: <code className="bg-muted px-1 py-0.5 rounded">city, country, countryCode, visitDate (YYYY-MM-DD), notes, lat, lng</code>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <select
          value={year}
          onChange={(e) => { setYear(e.target.value); setSelected(new Set()); }}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); setSelected(new Set()); }}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(year || country) && (
          <button
            onClick={() => { setYear(""); setCountry(""); setSelected(new Set()); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-6 py-2.5 bg-primary/8 border-b border-primary/20 flex items-center gap-3 animate-in slide-in-from-top-1 duration-150">
          <span className="text-sm font-medium text-primary">
            {selected.size} {selected.size === 1 ? "visit" : "visits"} selected
          </span>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting…" : `Delete ${selected.size === 1 ? "visit" : "selected"}`}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>
      )}

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
            <thead className="bg-muted/40 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="w-10 pl-4 py-3">
                  <button
                    onClick={toggleAll}
                    className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    title={allSelected ? "Deselect all" : "Select all"}
                  >
                    {allSelected ? <CheckSquare className="w-4 h-4 text-primary" />
                      : someSelected ? (
                        <span className="w-4 h-4 border-2 border-primary rounded-sm flex items-center justify-center">
                          <span className="w-2 h-0.5 bg-primary rounded-full" />
                        </span>
                      ) : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">City</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const isChecked = selected.has(visit.id);
                return (
                  <tr
                    key={visit.id}
                    className={`border-b border-border transition-colors group cursor-pointer ${isChecked ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/20"}`}
                    onClick={() => toggleOne(visit.id)}
                  >
                    <td className="w-10 pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleOne(visit.id)} className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">{visit.city}</td>
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
                      <span className="truncate block">
                        {visit.notes || <span className="text-muted-foreground/40 italic">No notes</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Link href={`/visits/${visit.id}/edit`} className="p-1.5 rounded hover:bg-muted transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Link>
                        <button onClick={() => deleteSingle(visit.id, visit.city)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function countryFlag(code: string): string {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
