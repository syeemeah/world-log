import { useState } from "react";
import { MessageSquare, Send, Trash2, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Category = "bug" | "idea" | "other";

interface FeedbackItem {
  id: number;
  category: Category;
  message: string;
  username: string;
  createdAt: string;
}

const CATEGORIES: { value: Category; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "other", label: "Other", icon: MessageCircle },
];

async function apiFetch<T>(path: string, method: string, token: string, body?: object): Promise<T | null> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const data = (await res.json().catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(data.error ?? "Request failed");
  }
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

export default function Feedback() {
  const { session, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = session?.token ?? "";

  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");

  const submit = useMutation({
    mutationFn: () => apiFetch("/api/feedback", "POST", token, { category, message }),
    onSuccess: () => {
      toast({ title: "Thanks for your feedback!", description: "We've received your message." });
      setMessage("");
      setCategory("bug");
      if (isAdmin) queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (e: Error) => toast({ title: "Could not send feedback", description: e.message, variant: "destructive" }),
  });

  const { data: items } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => apiFetch<FeedbackItem[]>("/api/feedback", "GET", token),
    enabled: isAdmin,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/feedback/${id}`, "DELETE", token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submit.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Found a bug or have an idea? Let us know — we read every message.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                  category === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the bug, idea, or anything else on your mind…"
            rows={6}
            maxLength={5000}
            required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/5000</p>
        </div>

        <button
          type="submit"
          disabled={submit.isPending || !message.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submit.isPending ? "Sending…" : "Send feedback"}
        </button>
      </form>

      {isAdmin && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-3">All submissions</h2>
          {!items || items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const cat = CATEGORIES.find((c) => c.value === item.category) ?? CATEGORIES[2];
                const Icon = cat.icon;
                return (
                  <li key={item.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          <Icon className="w-3 h-3" />
                          {cat.label}
                        </span>
                        <span className="text-muted-foreground">
                          {item.username} · {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => remove.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap break-words">{item.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
