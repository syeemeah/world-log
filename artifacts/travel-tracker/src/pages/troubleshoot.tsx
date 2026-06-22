import { useState } from "react";
import { LifeBuoy, ChevronDown, MessageSquare } from "lucide-react";
import { Link } from "wouter";

interface QA {
  q: string;
  a: React.ReactNode;
}

const FAQS: { section: string; items: QA[] }[] = [
  {
    section: "Account & sign in",
    items: [
      {
        q: "I can't sign in even though my password is correct.",
        a: (
          <>
            First, double-check the username — it's case-sensitive. If it still fails, use the
            same device/browser where you registered. If you recently changed your password, any
            old sign-in is automatically logged out; just sign in again with the new password.
          </>
        ),
      },
      {
        q: "I was suddenly signed out.",
        a: (
          <>
            Your session is stored in this browser. Clearing browser data, using private/incognito
            mode, or switching devices will sign you out. Just sign in again — your trips, map, and
            journal are saved to your account, not the browser.
          </>
        ),
      },
      {
        q: "Is my data private from other users?",
        a: (
          <>
            Yes. Every account has its own private map, visits, country memories, and journal. Other
            users can never see your data, and you can't see theirs.
          </>
        ),
      },
    ],
  },
  {
    section: "Logging a trip",
    items: [
      {
        q: "The city search shows no suggestions.",
        a: (
          <>
            City suggestions come from a free map service that's occasionally slow or blocked on some
            networks. You don't need it — just type the city name and press <b>Save</b>. The pin will
            use the country's location, and you can still edit it later. No VPN required.
          </>
        ),
      },
      {
        q: "The Save button won't work.",
        a: (
          <>
            Make sure you've picked a <b>country</b>, typed a <b>city</b>, and chosen a <b>date</b> —
            these are required. If a field is missing you'll see a message telling you which one.
          </>
        ),
      },
      {
        q: "My photo won't upload.",
        a: (
          <>
            Photos must be image files (JPG, PNG, etc.) under 5&nbsp;MB. If yours is larger, resize it
            or pick a smaller one and try again.
          </>
        ),
      },
    ],
  },
  {
    section: "Map & display",
    items: [
      {
        q: "The map is blank or not loading.",
        a: (
          <>
            The map needs an internet connection to load its tiles. Check your connection and refresh
            the page. If it's still blank, try a hard refresh (Ctrl/Cmd + Shift + R).
          </>
        ),
      },
      {
        q: "I added a trip but don't see it on the map.",
        a: (
          <>
            Refresh the page. If it still doesn't appear, open <b>All Visits</b> to confirm it saved —
            if it's listed there, the pin is on the map at the country/city location you chose.
          </>
        ),
      },
    ],
  },
];

function Item({ qa }: { qa: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <span className="text-sm font-medium pr-3">{qa.q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{qa.a}</div>}
    </div>
  );
}

export default function Troubleshoot() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <LifeBuoy className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Troubleshooting</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick answers to common issues. Still stuck? Send us a note from the Feedback page.
        </p>
      </header>

      <div className="space-y-8">
        {FAQS.map(({ section, items }) => (
          <section key={section}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {section}
            </h2>
            <div className="space-y-2">
              {items.map((qa) => (
                <Item key={qa.q} qa={qa} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Didn't find your answer?{" "}
          <Link href="/feedback" className="text-primary font-medium underline underline-offset-2 hover:opacity-80">
            Send us feedback
          </Link>{" "}
          and we'll help out.
        </p>
      </div>
    </div>
  );
}
