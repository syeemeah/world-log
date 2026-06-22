import { useState } from "react";
import { Link } from "wouter";
import { Globe, Map, BookOpen, BarChart2, Camera, MapPin, ArrowRight, Check, Link2 } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";

const CYAN = "#22d3ee";
const BLUE = "#3b82f6";
const MUTED_LANDING = "rgba(255,255,255,0.45)";

const FEATURES = [
  { icon: Map,      color: CYAN,   title: "Interactive World Map",   desc: "Every city you've visited pinned on a live map. Zoom, explore, relive your routes." },
  { icon: Globe,    color: "#34d399", title: "Country Tracker",      desc: "Track all 195 countries with photos and memories per destination." },
  { icon: BarChart2,color: "#f59e0b", title: "Year-by-Year Stats",   desc: "Charts and breakdowns of how far you've ranged — by year, country, and city." },
  { icon: BookOpen, color: BLUE,   title: "Travel Journal",          desc: "Attach blog posts and photo albums to trips. Surfaced right where your data lives." },
];

const BULLETS = [
  "Pin cities to your personal world map",
  "Track countries & upload best photos",
  "Link blog posts & photo albums by year",
  "Year-by-year stats with charts",
  "Private — your data is yours alone",
];

function Grid() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

function GlowDot({ cx, cy, r = 3, color = CYAN }: { cx: number; cy: number; r?: number; color?: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r * 3} fill={color} opacity="0.12" />
      <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.9" />
    </>
  );
}

interface Dest {
  id: string;
  city: string;
  country: string;
  x: number;
  y: number;
}

// Sample destinations positioned on the 800x450 stylized world
const DESTINATIONS: Dest[] = [
  { id: "nyc", city: "New York", country: "USA", x: 150, y: 175 },
  { id: "mex", city: "Mexico City", country: "Mexico", x: 178, y: 238 },
  { id: "rio", city: "Rio", country: "Brazil", x: 250, y: 330 },
  { id: "lon", city: "London", country: "UK", x: 405, y: 128 },
  { id: "par", city: "Paris", country: "France", x: 425, y: 148 },
  { id: "cai", city: "Cairo", country: "Egypt", x: 442, y: 248 },
  { id: "cpt", city: "Cape Town", country: "South Africa", x: 418, y: 332 },
  { id: "tok", city: "Tokyo", country: "Japan", x: 662, y: 172 },
  { id: "bkk", city: "Bangkok", country: "Thailand", x: 600, y: 232 },
  { id: "syd", city: "Sydney", country: "Australia", x: 682, y: 345 },
];

function InteractiveDemo() {
  const [selected, setSelected] = useState<string[]>(["par", "tok", "nyc"]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const chosen = selected
    .map((id) => DESTINATIONS.find((d) => d.id === id))
    .filter((d): d is Dest => Boolean(d));

  const cities = chosen.length;
  const countries = new Set(chosen.map((d) => d.country)).size;
  const routeD = chosen.map((d, i) => `${i === 0 ? "M" : "L"}${d.x},${d.y}`).join(" ");

  return (
    <div>
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          aspectRatio: "16/9",
          background: "#0a1628",
          border: `1px solid rgba(34,211,238,0.2)`,
          boxShadow: `0 0 60px rgba(34,211,238,0.08), inset 0 0 60px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Live demo badge */}
        <div
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(3,11,26,0.85)", border: "1px solid rgba(34,211,238,0.25)", backdropFilter: "blur(8px)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: CYAN }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: CYAN }} />
          </span>
          <span style={{ fontSize: 10, color: CYAN, letterSpacing: "0.12em", fontFamily: "monospace" }} className="uppercase">
            Live Demo
          </span>
        </div>

        {/* Continent SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="160" cy="160" rx="110" ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="190" cy="230" rx="60"  ry="50"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="230" cy="310" rx="60"  ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="420" cy="140" rx="55"  ry="45"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="420" cy="270" rx="65"  ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="590" cy="160" rx="130" ry="75"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="660" cy="330" rx="65"  ry="45"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          <ellipse cx="300" cy="80"  rx="45"  ry="35"  fill="#0a2030" stroke="rgba(34,211,238,0.1)"  strokeWidth="1" />

          {/* Route line through chosen pins */}
          {chosen.length > 1 && (
            <path d={routeD} fill="none" stroke={CYAN} strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
          )}

          {/* All destinations — faint when unselected, glowing when selected */}
          {DESTINATIONS.map((d) => {
            const on = selected.includes(d.id);
            return (
              <g
                key={d.id}
                onClick={() => toggle(d.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(d.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${on ? "Remove" : "Add"} ${d.city}, ${d.country}`}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {/* Larger invisible hit area for easy tapping */}
                <circle cx={d.x} cy={d.y} r={16} fill="transparent" />
                {on ? (
                  <GlowDot cx={d.x} cy={d.y} r={4} color="#f59e0b" />
                ) : (
                  <circle cx={d.x} cy={d.y} r={3.5} fill="rgba(34,211,238,0.25)" stroke={CYAN} strokeWidth="1" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Stats overlay (live) */}
        <div
          className="absolute bottom-4 left-4 rounded-xl px-4 py-3"
          style={{
            background: "rgba(3,11,26,0.85)",
            border: "1px solid rgba(34,211,238,0.2)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 20px rgba(34,211,238,0.1)",
          }}
        >
          <p style={{ fontSize: 10, color: CYAN, letterSpacing: "0.1em", fontFamily: "monospace" }} className="uppercase mb-2">
            ∷ YOUR DEMO MAP
          </p>
          <div className="flex items-center gap-5" aria-live="polite">
            {[[countries, "countries"], [cities, "cities"]].map(([n, l], i) => (
              <div key={i} className="text-center">
                <p style={{ fontFamily: "monospace", color: CYAN, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{n}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Corner decoration */}
        <div className="absolute top-3 right-3 opacity-50">
          <div style={{ width: 16, height: 16, borderTop: `1.5px solid ${CYAN}`, borderRight: `1.5px solid ${CYAN}` }} />
        </div>
        <div className="absolute bottom-3 right-3 opacity-50">
          <div style={{ width: 16, height: 16, borderBottom: `1.5px solid ${CYAN}`, borderRight: `1.5px solid ${CYAN}` }} />
        </div>
      </div>

      {/* Destination chips */}
      <div className="mt-4">
        <p className="text-center text-xs mb-3" style={{ color: MUTED_LANDING }}>
          Tap a destination to drop a pin — no account needed
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {DESTINATIONS.map((d) => {
            const on = selected.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                aria-pressed={on}
                aria-label={`${on ? "Remove" : "Add"} ${d.city}, ${d.country}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: on ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${on ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.12)"}`,
                  color: on ? "#fbbf24" : "rgba(255,255,255,0.6)",
                }}
              >
                <MapPin className="w-3 h-3" />
                {d.city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearCard({ year, countries, cities, hasLink }: { year: number; countries: number; cities: number; hasLink?: boolean }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "monospace", color: CYAN, fontWeight: 700, fontSize: 15, width: 48 }}>{year}</span>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#34d399" }}>
          <Globe className="w-3 h-3" />{countries}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#f59e0b" }}>
          <MapPin className="w-3 h-3" />{cities}
        </span>
      </div>
      {hasLink && (
        <div className="px-4 py-2 flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: BLUE, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <BookOpen className="w-2.5 h-2.5" />Blog
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Camera className="w-2.5 h-2.5" />Photos
          </span>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const BG = "#030b1a";
  const TEXT = "rgba(255,255,255,0.9)";
  const MUTED = "rgba(255,255,255,0.45)";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, overflowY: "auto", overflowX: "hidden" }}>
      <Grid />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 800,
          height: 400,
          background: `radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 70%)`,
        }}
      />

      {/* Nav */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(3,11,26,0.8)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(34,211,238,0.1)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,211,238,0.15)", border: `1px solid rgba(34,211,238,0.4)` }}
            >
              <Globe className="w-4 h-4" style={{ color: CYAN }} />
            </div>
            <span style={{ fontWeight: 700, letterSpacing: "-0.02em", color: TEXT }}>World Log</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" style={{ fontSize: 14, color: MUTED }} className="hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                background: `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
                color: "#030b1a",
                boxShadow: `0 0 20px rgba(34,211,238,0.3)`,
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-16 text-center">
          <Reveal y={16}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
            style={{
              color: CYAN,
              background: "rgba(34,211,238,0.08)",
              border: `1px solid rgba(34,211,238,0.2)`,
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ color: CYAN, opacity: 0.6 }}>◈</span>
            YOUR PERSONAL TRAVEL ATLAS
          </div>

          <h1
            className="mb-4 leading-tight"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}
          >
            Every trip.{" "}
            <span style={{ color: CYAN, textShadow: `0 0 40px rgba(34,211,238,0.5)` }}>One place.</span>
          </h1>

          <p style={{ fontSize: 18, color: MUTED, maxWidth: 440, margin: "0 auto 2rem", lineHeight: 1.6 }}>
            World Log is your personal travel map — track every city, remember every moment, and watch your world fill in.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-85"
              style={{
                background: `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
                color: "#030b1a",
                boxShadow: `0 0 30px rgba(34,211,238,0.4), 0 4px 20px rgba(0,0,0,0.4)`,
              }}
            >
              Create your log
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors hover:border-white/20"
              style={{
                color: TEXT,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Sign in
            </Link>
          </div>
          </Reveal>
        </section>

        {/* Interactive demo */}
        <section className="pb-20">
          <Reveal>
            <InteractiveDemo />
          </Reveal>
        </section>

        {/* Features */}
        <section className="pb-20">
          <Reveal>
            <p className="text-center font-mono text-xs mb-2" style={{ color: CYAN, letterSpacing: "0.12em" }}>
              ◈ CAPABILITIES
            </p>
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "#fff" }}>
              Everything your travels deserve
            </h2>
            <p className="text-sm text-center mb-10" style={{ color: MUTED }}>Built for people who love exploring and remembering.</p>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <RevealItem key={f.title}>
                  <div
                    className="h-full rounded-2xl p-6 transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                      style={{
                        background: `${f.color}18`,
                        border: `1px solid ${f.color}40`,
                        boxShadow: `0 0 20px ${f.color}20`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <h3 className="font-semibold mb-1.5" style={{ color: "#fff" }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>

        {/* Split: bullets + year cards */}
        <section className="pb-20 grid grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="font-mono text-xs mb-2" style={{ color: CYAN, letterSpacing: "0.12em" }}>◈ FEATURES</p>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#fff" }}>
              Your history,{" "}
              <span style={{ color: CYAN }}>beautifully organised</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>
              Browse your travels year by year, see which countries you explored, and read back your journal entries — all in one clean view.
            </p>
            <ul className="space-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,211,238,0.12)", border: `1px solid rgba(34,211,238,0.3)` }}
                  >
                    <Check className="w-3 h-3" style={{ color: CYAN }} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
          <RevealGroup className="space-y-2">
            <RevealItem><YearCard year={2024} countries={6} cities={14} hasLink /></RevealItem>
            <RevealItem><YearCard year={2023} countries={4} cities={9} hasLink /></RevealItem>
            <RevealItem><YearCard year={2022} countries={3} cities={7} /></RevealItem>
            <RevealItem><YearCard year={2019} countries={8} cities={22} hasLink /></RevealItem>
          </RevealGroup>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <Reveal>
          <div
            className="rounded-3xl px-10 py-14 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.12))`,
              border: "1px solid rgba(34,211,238,0.2)",
              boxShadow: "0 0 80px rgba(34,211,238,0.08)",
            }}
          >
            {/* Corner brackets */}
            {[["top-4 left-4", "border-t border-l"], ["top-4 right-4", "border-t border-r"], ["bottom-4 left-4", "border-b border-l"], ["bottom-4 right-4", "border-b border-r"]].map(([pos, bdr]) => (
              <div key={pos} className={`absolute ${pos} w-6 h-6 ${bdr}`} style={{ borderColor: `rgba(34,211,238,0.4)` }} />
            ))}

            <Globe className="w-10 h-10 mx-auto mb-4" style={{ color: CYAN, filter: `drop-shadow(0 0 12px rgba(34,211,238,0.6))` }} />
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#fff", letterSpacing: "-0.03em" }}>
              Start your world log today
            </h2>
            <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: MUTED }}>
              Free to use. Your data stays private. No tracking, no ads.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-85"
              style={{
                background: `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
                color: "#030b1a",
                boxShadow: `0 0 30px rgba(34,211,238,0.5)`,
              }}
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
