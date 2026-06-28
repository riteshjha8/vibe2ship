"use client";
import Link from "next/link";
import CountdownRing from "@/components/CountdownRing";
import Logo from "@/components/Logo";

const FEATURE_SECTIONS = [
  {
    title: "AI Intelligence",
    items: [
      "Autonomous Multi-Agent AI: Planner, Researcher, Developer, Reviewer, Scheduler",
      "Missed-deadline predictions and project risk alerts",
      "Dynamic task prioritization with live urgency scoring",
      "Goal-to-microtask generation and actionable checklists",
      "AI scheduling with automatic replanning and conflict resolution",
      "Personalized productivity nudges and behavior-aware recommendations",
      "Context-aware reminders tuned to urgency and energy",
      "Personal Knowledge Graph (Second Brain) with long-term memory",
      "Semantic search across tasks, notes, emails, files, voice, and images",
    ],
  },
  {
    title: "Last-Minute Life Saver",
    items: [
      "One-click Save My Day emergency rescue mode",
      "Deadline recovery planner with urgent action items",
      "AI-generated study/project crash plans",
      "Time compression strategy and urgent task triage",
      "Project completion probability and readiness checklist",
      "Smart task elimination when every minute counts",
    ],
  },
  {
    title: "Smart Productivity",
    items: [
      "AI calendar with auto meeting scheduling",
      "Focus time optimization and adaptive Pomodoro",
      "Habit, goal, energy, and burnout tracking",
      "Deep work analytics and weekly progress reports",
      "Personalized focus predictions and daily planning",
    ],
  },
  {
    title: "Autonomous Automation",
    items: [
      "Auto email drafting, replies, and summary generation",
      "AI meeting summaries and next-step assignments",
      "Automatic task extraction from emails and chats",
      "Report, presentation, and documentation automation",
      "Browser workflow automation and smart notifications",
      "Voice assistant and natural language commands",
    ],
  },
  {
    title: "Student, Professional & Entrepreneur Tools",
    items: [
      "Assignment planner, exam prep, and interview readiness tools",
      "Mock interview assistant and job/internship tracker",
      "Bill payment reminders, expense tracking, and cashflow planning",
      "Client follow-ups, proposal deadlines, and business task pipelines",
      "Research paper summarizer, citation helper, and productivity workflows",
    ],
  },
  {
    title: "Career & Finance",
    items: [
      "Resume analyzer and ATS score checker",
      "Mock interview assistant and job/internship tracker",
      "Skill gap analysis and opportunity discovery",
      "Expense tracking, subscription manager, and budget planner",
    ],
  },
  {
    title: "Daily Life",
    items: [
      "Weather-aware planning and traffic-aware reminders",
      "Medicine, water, sleep, fitness, and travel planning",
      "Grocery planning, package tracking, and local logistics",
      "Everyday routine automation with smart reminders",
    ],
  },
  {
    title: "Integrations",
    items: [
      "GitHub, GitLab, Slack, Discord, Google Drive, OneDrive",
      "Notion, Trello, Jira, Google Drive, Dropbox, OneDrive",
      "Zoom, Microsoft Teams, WhatsApp, SMS APIs, Google Maps",
      "Stripe, PayPal, and extensible workflow plugins",
    ],
  },
  {
    title: "Security",
    items: [
      "End-to-end encryption and secure cloud sync",
      "Passkey authentication and multi-device sync",
      "Local AI mode, offline support, and privacy-first design",
    ],
  },
  {
    title: "Future-Ready",
    items: [
      "AI Digital Twin and predictive life planning",
      "Multi-agent collaboration and explainable AI decisions",
      "Vision AI for OCR and screenshot understanding",
      "Voice-to-action workflows and opportunity detection",
      "Plugin marketplace and cross-platform desktop/mobile readiness",
    ],
  },
];

const STEPS = [
  { n: "01", title: "Log the deadline", body: "Add a task once, in your own local time — Kathmandu, Mumbai, or New York, it doesn't matter." },
  { n: "02", title: "It watches the clock", body: "A scheduler checks every minute, correctly converted to UTC, so nothing drifts across timezones." },
  { n: "03", title: "It actually rings", body: "At 24 hours, 1 hour, and the final 20-minute mark, you get a voice alert, a sound, and an email — not just a silent badge." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-7xl mx-auto">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-slate-300 hover:text-white transition">Sign in</Link>
          <Link href="/register" className="bg-gold-500 hover:bg-gold-400 text-ink px-4 py-2 rounded-lg font-medium transition">
            Get started
          </Link>
        </div>
      </header>

      <section className="px-6 sm:px-10 max-w-7xl mx-auto pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold-300 mb-4">The last-minute life saver</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.1] mb-5">
            Deadlines don't wait.
            <br />
              Neither should your <span className="text-gold-300">reminders</span>.
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-md mb-8">
            Students, professionals, and entrepreneurs stay on top of assignments, deadlines, bill payments, interviews, and every important commitment. An AI productivity companion that prioritizes your work, plans your day, and rings — out loud — at 24 hours, 1 hour, and 20 minutes before anything is due.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="bg-gold-500 hover:bg-gold-400 text-ink px-6 py-3 rounded-lg font-medium transition">
              Start for free
            </Link>
            <Link href="/login" className="border border-white/15 hover:bg-white/5 px-6 py-3 rounded-lg font-medium transition">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="glass-card rounded-2xl p-8 w-full max-w-sm">
            <p className="text-xs text-slate-400 mb-4 font-mono">Live example — a task 18 minutes from due</p>
            <div className="flex items-center gap-4">
              <CountdownRing deadline={new Date(Date.now() + 18 * 60 * 1000).toISOString()} createdAt={new Date(Date.now() - 23.5 * 3600 * 1000).toISOString()} size={88} />
              <div>
                <p className="font-display font-medium">Submit visa application</p>
                <p className="text-xs text-alarm-500 mt-1">Last-minute call incoming</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-6 leading-relaxed">
              The ring is literal: it depletes and shifts from teal to amber to red on the same schedule that triggers your voice alert.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 max-w-7xl mx-auto py-16 border-t border-white/8">
        <h2 className="font-display text-2xl font-semibold mb-2">How it ships</h2>
        <p className="text-slate-400 mb-10 max-w-md">Three steps, always in this order — because the order is the point.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card rounded-xl p-6">
                <span className="font-mono text-gold-300 text-sm">{s.n}</span>
              <h3 className="font-display font-medium mt-2 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 sm:px-10 max-w-7xl mx-auto py-16 border-t border-white/8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl font-semibold">Everything in one companion</h2>
            <p className="text-slate-400 max-w-xl mt-2">Built as an autonomous AI operating system for last-minute deadlines, student life, developer productivity, and daily routines.</p>
          </div>
          <Link href="/login" className="rounded-full bg-gold-500 px-5 py-2.5 text-sm text-ink font-medium hover:bg-gold-400 transition">
            Open your AI dashboard
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {FEATURE_SECTIONS.map((section) => (
            <div key={section.title} className="glass-card rounded-2xl p-6">
                <h3 className="font-display font-semibold text-sm text-gold-300 mb-4">{section.title}</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                      <span className="mt-1 text-gold-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 sm:px-10 max-w-7xl mx-auto py-10 border-t border-white/8 text-xs text-slate-500">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Logo withText={false} />
            <span className="font-semibold text-slate-200">FinalPing AI</span>
          </div>
          <span>FinalPing AI — built for FinalPing AI: The Last-Minute Life Saver.</span>
        </div>
      </footer>
    </main>
  );
}
