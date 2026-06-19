import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: number;
  username: string;
  role: "admin" | "editor";
  createdAt: string;
}

async function apiFetch(path: string, options: RequestInit, token: string) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

function useUsers(token: string | undefined) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const res = await apiFetch("/api/auth/users", { method: "GET" }, token);
    if (res.ok) setUsers(await res.json() as UserRow[]);
    setLoading(false);
  };

  return { users, loading, load, setUsers };
}

export default function Users() {
  const { session, isAdmin } = useAuth();
  const { toast } = useToast();
  const { users, loading, load, setUsers } = useUsers(session?.token);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    load().then(() => setLoaded(true));
  }

  const [showAdd, setShowAdd] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor">("editor");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "editor">("editor");
  const [saving, setSaving] = useState(false);

  if (!isAdmin) return (
    <div className="p-8 text-center text-muted-foreground">Admin access required.</div>
  );

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setAdding(true);
    const res = await apiFetch("/api/auth/users", {
      method: "POST",
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
    }, session.token);
    setAdding(false);
    if (res.ok) {
      const user = await res.json() as UserRow;
      setUsers((prev) => [...(prev ?? []), user]);
      setNewUsername(""); setNewPassword(""); setNewRole("editor"); setShowAdd(false);
      toast({ title: "User created", description: `@${user.username} added successfully.` });
    } else {
      const { error } = await res.json() as { error: string };
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  const startEdit = (u: UserRow) => {
    setEditId(u.id); setEditPassword(""); setEditRole(u.role);
  };

  const saveEdit = async (u: UserRow) => {
    if (!session) return;
    setSaving(true);
    const body: Record<string, string> = { role: editRole };
    if (editPassword) body.password = editPassword;
    const res = await apiFetch(`/api/auth/users/${u.id}`, { method: "PATCH", body: JSON.stringify(body) }, session.token);
    setSaving(false);
    if (res.ok) {
      const updated = await res.json() as UserRow;
      setUsers((prev) => prev?.map((x) => x.id === updated.id ? { ...x, ...updated } : x) ?? null);
      setEditId(null);
      toast({ title: "Saved", description: `@${u.username} updated.` });
    } else {
      const { error } = await res.json() as { error: string };
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  const deleteUser = async (u: UserRow) => {
    if (!session) return;
    if (!confirm(`Delete @${u.username}? This cannot be undone.`)) return;
    const res = await apiFetch(`/api/auth/users/${u.id}`, { method: "DELETE" }, session.token);
    if (res.ok) {
      setUsers((prev) => prev?.filter((x) => x.id !== u.id) ?? null);
      toast({ title: "Deleted", description: `@${u.username} removed.` });
    } else {
      const { error } = await res.json() as { error: string };
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage who can sign in and edit.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" /> Add account
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="mb-6 border border-border rounded-xl p-5 bg-card shadow-sm">
          <h2 className="font-semibold text-sm mb-4">New account</h2>
          <form onSubmit={addUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <input
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. alice"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Strong password"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "admin" | "editor")}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="editor">Editor — can add/edit/delete visits & memories</option>
                <option value="admin">Admin — can also manage accounts</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="submit" disabled={adding} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {adding ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      {loading && !users && (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      )}

      {users && (
        <div className="border border-border rounded-xl overflow-hidden">
          {users.length === 0 && (
            <p className="text-center py-10 text-muted-foreground text-sm">No accounts yet.</p>
          )}
          {users.map((u, i) => (
            <div key={u.id} className={`px-5 py-4 flex items-center gap-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase ${u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {u.username[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{u.username}</span>
                  {u.role === "admin" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {u.role === "editor" && (
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Editor</span>
                  )}
                  {u.username === session?.username && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Inline edit */}
              {editId === u.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="New password (optional)"
                    className="px-2 py-1 border border-border rounded text-xs w-40 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "admin" | "editor")}
                    className="px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => saveEdit(u)} disabled={saving} className="p-1.5 rounded hover:bg-muted" title="Save">
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                  <button onClick={() => setEditId(null)} className="p-1.5 rounded hover:bg-muted" title="Cancel">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteUser(u)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
