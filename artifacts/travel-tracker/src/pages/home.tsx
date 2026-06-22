import { useState } from "react";
import { Link } from "wouter";
import {
  Globe,
  Map as MapIcon,
  Layers,
  Plane,
  Target,
  Plus,
  Trash2,
  Check,
  MapPin,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import {
  useGetOverview,
  getGetOverviewQueryKey,
  useListBucketList,
  getListBucketListQueryKey,
  useCreateBucketListItem,
  useUpdateBucketListItem,
  useDeleteBucketListItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/countries";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";

type Priority = "low" | "medium" | "high";

const PRIORITY_STYLES: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  low: { label: "Low", className: "bg-sky-500/15 text-sky-500 border-sky-500/30" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function countryFlag(code?: string | null): string {
  if (!code) return "";
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}

export default function Home() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: overview } = useGetOverview({ query: { queryKey: getGetOverviewQueryKey() } });
  const { data: goals = [], isLoading: goalsLoading } = useListBucketList({
    query: { queryKey: getListBucketListQueryKey() },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListBucketListQueryKey() });

  const createMutation = useCreateBucketListItem({
    mutation: {
      onSuccess: () => { invalidate(); resetForm(); toast({ title: "Goal added to your list" }); },
      onError: () => toast({ title: "Couldn't add goal", variant: "destructive" }),
    },
  });
  const updateMutation = useUpdateBucketListItem({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Couldn't update goal", variant: "destructive" }),
    },
  });
  const deleteMutation = useDeleteBucketListItem({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Couldn't remove goal", variant: "destructive" }),
    },
  });

  // Add form state
  const [title, setTitle] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [country, setCountry] = useState<{ name: string; code: string } | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [priority, setPriority] = useState<Priority>("medium");
  const [targetYear, setTargetYear] = useState("");

  const filteredCountries =
    countrySearch.length > 0
      ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 8)
      : [];

  const resetForm = () => {
    setTitle("");
    setCountrySearch("");
    setCountry(null);
    setPriority("medium");
    setTargetYear("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Give your goal a name first", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        title: title.trim(),
        country: country?.name ?? null,
        countryCode: country?.code ?? null,
        priority,
        targetYear: targetYear ? Number(targetYear) : null,
      },
    });
  };

  const achieved = goals.filter((g) => g.achieved);
  const pending = goals.filter((g) => !g.achieved);
  const sortedPending = [...pending].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  });

  const statCards = [
    { label: "Countries", value: overview?.totalCountries ?? "—", icon: Globe, color: "text-primary" },
    { label: "Cities", value: overview?.totalCities ?? "—", icon: MapIcon, color: "text-emerald-500" },
    { label: "Total Visits", value: overview?.totalVisits ?? "—", icon: Layers, color: "text-amber-500" },
    { label: "Goals Reached", value: `${achieved.length}/${goals.length}`, icon: Target, color: "text-violet-500" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Greeting */}
        <Reveal>
          <div className="mb-8">
            <p className="text-sm text-muted-foreground">{greeting()},</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {session?.username ?? "traveler"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {overview?.topCountry
                ? `Your most-visited place so far is ${overview.topCountry}. Where to next?`
                : "Start mapping your world and set your sights on what's next."}
            </p>
          </div>
        </Reveal>

        {/* Quick summary */}
        <RevealGroup className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <RevealItem key={label}>
              <div className="bg-card rounded-xl px-4 py-4 border border-border h-full">
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Bucket list */}
        <Reveal>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Travel bucket list</h2>
            {pending.length > 0 && (
              <span className="text-xs text-muted-foreground">· {pending.length} to go</span>
            )}
          </div>
        </Reveal>

        {/* Add goal form */}
        <Reveal>
          <form
            onSubmit={handleAdd}
            className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. See the Northern Lights in Iceland"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Country */}
              <div className="relative">
                <input
                  type="text"
                  value={country ? country.name : countrySearch}
                  onChange={(e) => {
                    setCountry(null);
                    setCountrySearch(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCountryDropdown(false), 150)}
                  placeholder="Destination (optional)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="off"
                />
                {showCountryDropdown && filteredCountries.length > 0 && !country && (
                  <div className="absolute z-20 w-full bg-popover border border-popover-border rounded-lg shadow-lg mt-1 overflow-hidden">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onMouseDown={() => {
                          setCountry({ name: c.name, code: c.code });
                          setCountrySearch("");
                          setShowCountryDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <span>{countryFlag(c.code)}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              {/* Target year */}
              <input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                placeholder="Target year"
                min={new Date().getFullYear()}
                max={2100}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Add goal
            </button>
          </form>
        </Reveal>

        {/* Goals list */}
        {goalsLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading your goals…</p>
        ) : goals.length === 0 ? (
          <Reveal>
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
              <h3 className="text-base font-medium text-foreground mb-1">No goals yet</h3>
              <p className="text-sm text-muted-foreground">
                Add the places and experiences you're dreaming about above.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-6">
            {sortedPending.length > 0 && (
              <RevealGroup className="space-y-2">
                {sortedPending.map((g) => (
                  <RevealItem key={g.id}>
                    <GoalRow
                      goal={g}
                      onToggle={() =>
                        updateMutation.mutate({ id: g.id, data: { achieved: true } })
                      }
                      onDelete={() => deleteMutation.mutate({ id: g.id })}
                    />
                  </RevealItem>
                ))}
              </RevealGroup>
            )}

            {achieved.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Achieved · {achieved.length}
                </p>
                <div className="space-y-2">
                  {achieved.map((g) => (
                    <GoalRow
                      key={g.id}
                      goal={g}
                      onToggle={() =>
                        updateMutation.mutate({ id: g.id, data: { achieved: false } })
                      }
                      onDelete={() => deleteMutation.mutate({ id: g.id })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <Reveal>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/visits/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              Log a visit
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              View world map
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

type Goal = {
  id: number;
  title: string;
  country?: string | null;
  countryCode?: string | null;
  priority: string;
  targetYear?: number | null;
  achieved: boolean;
};

function GoalRow({
  goal,
  onToggle,
  onDelete,
}: {
  goal: Goal;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const pri = PRIORITY_STYLES[(goal.priority as Priority)] ?? PRIORITY_STYLES.medium;
  return (
    <div
      className={`flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 transition-colors ${
        goal.achieved ? "opacity-70" : ""
      }`}
    >
      <button
        onClick={onToggle}
        aria-label={goal.achieved ? "Mark as not done" : "Mark as achieved"}
        className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
          goal.achieved
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-border hover:border-primary text-transparent hover:text-primary/40"
        }`}
      >
        <Check className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-foreground truncate ${goal.achieved ? "line-through" : ""}`}>
          {goal.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {goal.country && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {countryFlag(goal.countryCode)} {goal.country}
            </span>
          )}
          {goal.targetYear && <span>· by {goal.targetYear}</span>}
        </div>
      </div>

      {!goal.achieved && (
        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pri.className}`}>
          {pri.label}
        </span>
      )}

      <button
        onClick={onDelete}
        aria-label="Delete goal"
        className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
