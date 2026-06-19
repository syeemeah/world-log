import { Link } from "wouter";
import { Globe, Map, BookOpen, BarChart2, Camera, MapPin, ArrowRight, Check, Link2 } from "lucide-react";

const CYAN = "#22d3ee";
const BLUE = "#3b82f6";

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

function MapMockup() {
  const pins: [number, number][] = [
    [20, 37], [30, 34], [49, 33], [55, 32], [58, 45],
    [62, 37], [72, 39], [78, 54], [83, 34],
  ];

  return (
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

      {/* Continent SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Continents — dark teal tones */}
        <ellipse cx="160" cy="160" rx="110" ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="190" cy="230" rx="60"  ry="50"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="230" cy="310" rx="60"  ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="420" cy="140" rx="55"  ry="45"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="420" cy="270" rx="65"  ry="90"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="590" cy="160" rx="130" ry="75"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="660" cy="330" rx="65"  ry="45"  fill="#0f2d3d" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
        <ellipse cx="300" cy="80"  rx="45"  ry="35"  fill="#0a2030" stroke="rgba(34,211,238,0.1)"  strokeWidth="1" />

        {/* Route lines between pins */}
        {pins.slice(1).map(([x2, y2], i) => {
          const [x1, y1] = pins[i];
          const bx = (x1 + x2) / 2 * 8;
          const by = (y1 + y2) / 2 * 4.5 - 40;
          return (
            <path
              key={i}
              d={`M${x1 * 8},${y1 * 4.5} Q${bx},${by} ${x2 * 8},${y2 * 4.5}`}
              fill="none"
              stroke={CYAN}
              strokeWidth="0.8"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          );
        })}

        {/* Pins */}
        {pins.map(([x, y], i) => (
          <GlowDot key={i} cx={x * 8} cy={y * 4.5} r={i === pins.length - 1 ? 5 : 3} color={i === pins.length - 1 ? "#f59e0b" : CYAN} />
        ))}
      </svg>

      {/* Stats overlay */}
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
          ∷ LIFETIME STATS
        </p>
        <div className="flex items-center gap-5">
          {[["42", "countries"], ["180", "cities"], ["12", "years"]].map(([n, l], i) => (
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
      <div className="absolute bottom-3 left-3 opacity-50">
        <div style={{ width: 16, height: 16, borderBottom: `1.5px solid ${CYAN}`, borderLeft: `1.5px solid ${CYAN}` }} />
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
        </section>

        {/* Map */}
        <section className="pb-20">
          <MapMockup />
        </section>

        {/* Features */}
        <section className="pb-20">
          <p className="text-center font-mono text-xs mb-2" style={{ color: CYAN, letterSpacing: "0.12em" }}>
            ◈ CAPABILITIES
          </p>
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "#fff" }}>
            Everything your travels deserve
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: MUTED }}>Built for people who love exploring and remembering.</p>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl p-6 transition-colors"
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
              );
            })}
          </div>
        </section>

        {/* Split: bullets + year cards */}
        <section className="pb-20 grid grid-cols-2 gap-12 items-center">
          <div>
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
          </div>
          <div className="space-y-2">
            <YearCard year={2024} countries={6} cities={14} hasLink />
            <YearCard year={2023} countries={4} cities={9} hasLink />
            <YearCard year={2022} countries={3} cities={7} />
            <YearCard year={2019} countries={8} cities={22} hasLink />
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
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
        </section>
      </div>
    </div>
  );
}
