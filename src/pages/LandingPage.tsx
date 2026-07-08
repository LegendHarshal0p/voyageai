import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, Wallet, MapPin, Star, Check, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const testimonials = [
  {
    quote:
      "I planned a two-week trip to Japan in an afternoon instead of a weekend. The AI itinerary needed maybe three tweaks.",
    name: "Maya R.",
    role: "Product designer",
  },
  {
    quote:
      "The expense tracker alone paid for itself — we came in under budget on a trip for the first time in years.",
    name: "Daniel K.",
    role: "Frequent traveler",
  },
  {
    quote:
      "Uploading our hotel confirmations and having them auto-organized was such a small thing that saved so much stress at check-in.",
    name: "Priya S.",
    role: "Family trip planner",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 active trips", "AI itinerary generation", "Expense tracking", "Packing lists"],
    cta: "Start free",
  },
  {
    name: "Traveler",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited trips",
      "Everything in Free",
      "Document OCR & auto-fill",
      "Priority AI responses",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Family",
    price: "$19",
    period: "/month",
    features: ["Everything in Traveler", "Shared trips (up to 6 people)", "Combined budget view"],
    cta: "Start free trial",
  },
];

const faqs = [
  {
    q: "How accurate are the AI-generated itineraries?",
    a: "The AI drafts a realistic day-by-day plan based on your destination, dates, interests, and budget level. Most people make a few edits — swapping a restaurant, moving an activity — rather than starting over.",
  },
  {
    q: "Can I use VoyageAI for a trip I'm planning with other people?",
    a: "Yes. Trips can be shared with travel companions on the Family plan, and everyone sees the same itinerary, budget, and packing list.",
  },
  {
    q: "What happens to my documents after I upload them?",
    a: "Passports, tickets, and bookings are stored in encrypted storage tied to your account only. Image uploads are analyzed once to extract text and details, then the extracted data is saved alongside the file.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, paid plans are month-to-month with no lock-in. Your trip data stays available on the Free plan after downgrading.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI itinerary planning",
    description: "Describe your trip and get a full day-by-day plan in seconds, tuned to your budget and interests.",
  },
  {
    icon: Wallet,
    title: "Budget tracking",
    description: "Log expenses as you go and see exactly where your trip budget stands, in real time.",
  },
  {
    icon: MapPin,
    title: "Everything in one place",
    description: "Hotels, restaurants, activities, documents, and packing lists — organized per trip.",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <nav className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <Compass className="h-6 w-6 text-accent" />
          VoyageAI
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="accent">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="container flex flex-col items-center py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display max-w-3xl text-5xl font-semibold leading-tight md:text-6xl"
        >
          Plan less. Travel more.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          VoyageAI turns a rough idea into a complete trip — itinerary, budget, and packing list —
          so you spend your time deciding where to eat, not building spreadsheets.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <Link to="/signup">
            <Button variant="accent" size="lg">
              Start planning free
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-card p-6">
            <f.icon className="h-8 w-8 text-accent" />
            <h3 className="font-display mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-semibold">
            Loved by people who'd rather be traveling than planning
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-lg border border-border bg-background p-6"
              >
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-foreground">"{t.quote}"</p>
                <p className="mt-4 text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-semibold">Simple pricing</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Start free. Upgrade when you're planning trips every month.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg border p-6 ${
                  tier.highlighted ? "border-accent bg-card shadow-lg" : "border-border bg-card"
                }`}
              >
                {tier.highlighted && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display mt-3 text-xl font-semibold">{tier.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-semibold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground"> {tier.period}</span>
                </p>
                <ul className="mt-6 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant={tier.highlighted ? "accent" : "outline"} className="mt-6 w-full">
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-24">
        <div className="container max-w-2xl">
          <h2 className="font-display text-center text-3xl font-semibold">Frequently asked questions</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            VoyageAI
          </div>
          <p className="text-sm text-muted-foreground">Plan less. Travel more.</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VoyageAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-muted-foreground">{answer}</p>}
    </div>
  );
}
