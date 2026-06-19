import { Link } from "wouter";
import { Globe, Map, BookOpen, BarChart2, Camera, MapPin, ArrowRight, Check } from "lucide-react";

const FEATURES = [
  {
    icon: Map,
    color: "text-primary bg-primary/10",
    title: "Interactive World Map",
    desc: "See every city you've visited pinned on a live map. Zoom, explore, and relive your routes.",
  },
  {
    icon: Globe,
    color: "text-emerald-600 bg-emerald-50",
    title: "Country Tracker",
    desc: "Track which of 195 countries you've visited, with photos and favourite memories per country.",
  },
  {
    icon: BarChart2,
    color: "text-amber-600 bg-amber-50",
    title: "Year-by-Year Stats",
    desc: "See how your travel has grown over the years — cities, countries, and visits at a glance.",
  },
  {
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50",
    title: "Travel Journal",
    desc: "Link your blog posts and photo albums to specific years, surfaced on your stats and country pages.",
  },
];

const BULLETS = [
  "Pin cities to your personal world map",
  "Track countries & upload best photos",
  "Link blog posts & photo albums by year",
  "Year-by-year stats with charts",
  "Private — your data is yours alone",
];

function MapMockup() {
  const pins = [
    { x: 22, y: 38 },
    { x: 30, y: 35 },
    { x: 49, y: 34 },
    { x: 55, y: 33 },
    { x: 58, y: 46 },
    { x: 62, y: 37 },
    { x: 72, y: 40 },
    { x: 78, y: 55 },
    { x: 83, y: 35 },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-xl bg-[#d4e9f7]" style={{ aspectRatio: "16/9" }}>
      {/* Ocean */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#b8ddf0] to-[#8ec9e8]" />

      {/* Continent blobs — purely decorative */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
        {/* North America */}
        <ellipse cx="160" cy="160" rx="110" ry="90" fill="#a8d5a2" opacity="0.9" />
        <ellipse cx="190" cy="230" rx="60" ry="50" fill="#a8d5a2" opacity="0.9" />
        {/* South America */}
        <ellipse cx="230" cy="310" rx="60" ry="90" fill="#a8d5a2" opacity="0.9" />
        {/* Europe */}
        <ellipse cx="420" cy="140" rx="55" ry="45" fill="#a8d5a2" opacity="0.9" />
        {/* Africa */}
        <ellipse cx="420" cy="270" rx="65" ry="90" fill="#a8d5a2" opacity="0.9" />
        {/* Asia */}
        <ellipse cx="590" cy="160" rx="130" ry="75" fill="#a8d5a2" opacity="0.9" />
        {/* Oceania */}
        <ellipse cx="660" cy="330" rx="65" ry="45" fill="#a8d5a2" opacity="0.9" />
        {/* Greenland */}
        <ellipse cx="300" cy="80" rx="45" ry="35" fill="#c5e2bf" opacity="0.8" />
      </svg>

      {/* Pins */}
      {pins.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -100%)" }}
        >
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="w-px h-2 bg-primary/60 mx-auto" />
        </div>
      ))}

      {/* Overlay card */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/60">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Lifetime stats</p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">42</p>
            <p className="text-[10px] text-muted-foreground">countries</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">180</p>
            <p className="text-[10px] text-muted-foreground">cities</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">12</p>
            <p className="text-[10px] text-muted-foreground">years</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function YearCard({ year, countries, cities, hasLink }: { year: number; countries: number; cities: number; hasLink?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <span className="text-sm font-bold text-foreground w-12">{year}</span>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          <Globe className="w-3 h-3" />{countries}
        </span>
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" />{cities}
        </span>
      </div>
      {hasLink && (
        <div className="px-4 py-2 flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-blue-600 bg-blue-50">
            <BookOpen className="w-2.5 h-2.5" />Blog post
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-amber-600 bg-amber-50">
            <Camera className="w-2.5 h-2.5" />Photos
          </span>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">World Log</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Globe className="w-3.5 h-3.5" />
            Your personal travel atlas
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            Every trip.<br />One place.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            World Log is your personal travel map — track every city, remember every moment, and watch your world fill in.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Create your log
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-muted/40 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Map preview */}
        <section className="pb-16">
          <MapMockup />
        </section>

        {/* Features */}
        <section className="pb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Everything your travels deserve</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Built for people who love exploring and remembering.</p>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-6">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Split: mockup + bullets */}
        <section className="pb-16 grid grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-3">Your history, beautifully organised</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Browse your travels year by year, see which countries you explored, and read back your journal entries — all in one clean view.
            </p>
            <ul className="space-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Mini year-cards mockup */}
          <div className="space-y-2">
            <YearCard year={2024} countries={6} cities={14} hasLink />
            <YearCard year={2023} countries={4} cities={9} hasLink />
            <YearCard year={2022} countries={3} cities={7} />
            <YearCard year={2019} countries={8} cities={22} hasLink />
          </div>
        </section>

        {/* CTA banner */}
        <section className="pb-16">
          <div className="bg-primary rounded-3xl px-10 py-12 text-center text-primary-foreground">
            <Globe className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl font-bold mb-2">Start your world log today</h2>
            <p className="text-primary-foreground/70 text-sm mb-8 max-w-sm mx-auto">
              Free to use. Your data stays private. No tracking, no ads.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-primary font-semibold text-sm hover:opacity-90 transition-opacity shadow-xl"
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
