"use client";

import React from "react";
import Link from "next/link";

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

const CALENDLY_URL = "https://calendly.com/monkeysraiser"; // ← replace with your real link

const features = [
    "30-day Premier Showcase on homepage top",
    "Custom feature story with media partner (200K+ readers)",
    "2 rounds: deck & business plan expert review",
    "2 live mock pitches with seasoned investors",
    "3–4 curated 1:1 investor introductions",
    "Investor-ready asset pack (one-pager + updated deck)",
    "Personal campaign manager throughout",
];

const howItWorks = [
    {
        label: "Week 1–2",
        title: "Deep dive & investor-ready narrative",
        body: "We refine your story, clarify your raise, and align your positioning with investor expectations.",
    },
    {
        label: "Week 3–4",
        title: "Deck & business plan overhaul",
        body: "Two expert review cycles to tighten your deck, metrics, GTM and financial model.",
    },
    {
        label: "Week 5–6",
        title: "Mock pitches & feedback loops",
        body: "Run live investor-style sessions, get hard questions, polish your answers and flow.",
    },
    {
        label: "Week 7–8",
        title: "Exposure & curated intros",
        body: "30-day Premier Showcase, feature story, and 3–4 targeted investor introductions.",
    },
];

const faqs = [
    {
        q: "Who is the Investor Accelerator for?",
        a: "Founders raising Pre-seed, Seed or early Series A with a clear product, initial traction, and a defined funding goal.",
    },
    {
        q: "Do you guarantee funding?",
        a: "No one can guarantee a round. We maximize your odds by improving your assets, story, and investor access.",
    },
    {
        q: "How much time do I need to commit?",
        a: "Expect 2–3 hours per week for working sessions, revisions, and investor prep during the 8-week program.",
    },
    {
        q: "Can my co-founder join?",
        a: "Yes. We encourage all key decision-makers (CEO, CTO, COO, etc.) to participate in live sessions.",
    },
];

const checkIcon = (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
        />
    </svg>
);

/* ---------------- PAGE ---------------- */

export default function InvestorAcceleratorPage() {
    return (
        <main
            className="min-h-screen bg-gradient-to-b from-white to-gray-50"
            style={{ background: `linear-gradient(180deg, ${brand.white}, ${brand.lightBlue})` }}
        >
            {/* HERO */}
            {/* HERO */}
            <section className="relative overflow-hidden py-20"
                     style={{ background: `linear-gradient(180deg, ${brand.white}, ${brand.lightBlue})` }}
            >
                <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between">
                        {/* LEFT: Copy */}
                        <div className="flex-1 lg:max-w-xl flex flex-col justify-center">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 shadow">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  New • Limited Founder Cohort
                </span>
                            </div>

                            <h1 className="max-w-3xl text-4xl font-black leading-tight text-gray-900 sm:text-5xl">
                                Investor Accelerator{" "}
                                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Get your round investor-ready in 8 weeks
                </span>
                            </h1>

                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                                A focused, two-month sprint to sharpen your story, upgrade your assets, and get in front of the right
                                investors—backed by MonkeysRaiser’s Premier visibility and curated introductions.
                            </p>

                            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 uppercase">Investment</div>
                                    <div className="mt-1 text-2xl font-black text-gray-900">$8,000</div>
                                    <div className="text-xs text-gray-500">One-time program fee</div>
                                </div>
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 uppercase">Duration</div>
                                    <div className="mt-1 text-2xl font-black text-gray-900">2 months</div>
                                    <div className="text-xs text-gray-500">Structured, time-boxed sprint</div>
                                </div>
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 uppercase">Focus</div>
                                    <div className="mt-1 text-2xl font-black text-gray-900">Funding</div>
                                    <div className="text-xs text-gray-500">Pre-seed to early Series A</div>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-wrap items-center gap-4">
                                <a
                                    href={CALENDLY_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl px-7 py-3 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                >
                                    Book Intro Call
                                </a>
                                <a
                                    href="#curriculum"
                                    className="rounded-xl border-2 bg-white px-7 py-3 text-base font-bold transition-all duration-300 hover:bg-gray-50"
                                    style={{ borderColor: brand.primary, color: brand.primary }}
                                >
                                    View Program Breakdown
                                </a>
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                No obligation on the intro call. We’ll assess fit, stage, and timeline together.
                            </p>
                        </div>

                        {/* RIGHT: Plan Card */}
                        <div className="w-full max-w-md lg:flex lg:items-stretch lg:justify-end">
                            <div className="w-full lg:self-stretch flex">
                                <div className="flex flex-1 flex-col justify-between rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                                    <div>
                                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Premium founder plan
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900">Investor Accelerator</h2>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Built for founders who want real investor-grade feedback, sharper materials, and focused exposure.
                                        </p>

                                        <div className="mt-5 flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-gray-900">$8,000</span>
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        One-time • 2 months
                      </span>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-xs text-gray-600">
                                            <span className="font-semibold text-gray-800">No success fee.</span> You keep 100% of your raise.
                                            We focus on preparation, positioning, and intros.
                                        </div>

                                        <ul className="mt-5 space-y-3 text-sm text-gray-700">
                                            {features.map((f) => (
                                                <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            {checkIcon}
                          </span>
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-6 grid gap-3">
                                        <a
                                            href={CALENDLY_URL}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                        >
                                            Schedule a Call
                                            <span className="ml-2 text-lg">📅</span>
                                        </a>
                                        <p className="text-xs text-center text-gray-500">
                                            Limited spots per cohort to keep reviews and intros high-quality.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHAT YOU GET */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-center text-3xl font-black text-gray-900">What’s included in the program</h2>
                    <p className="mt-3 text-center text-sm text-gray-600">
                        Every element is designed to move you closer to a clean, compelling raise.
                    </p>

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
                                <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Visibility</span>
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900">Premier exposure on MonkeysRaiser</h3>
                            <p className="text-sm text-gray-600">
                                30-day Premier Showcase at the top of the homepage plus a tailored feature placement to ensure investors
                                actually see your raise.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1">
                                <span className="text-xs font-bold uppercase tracking-wide text-purple-700">Story & Assets</span>
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900">Deck, business plan & one-pager</h3>
                            <p className="text-sm text-gray-600">
                                Two expert review cycles to pressure-test your deck and business plan, plus an investor-ready one-pager
                                and refined narrative.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
                                <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Access</span>
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900">Curated investor introductions</h3>
                            <p className="text-sm text-gray-600">
                                3–4 targeted 1:1 intros to investors aligned with your stage, ticket size, and sector focus.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROGRAM BREAKDOWN */}
            <section id="curriculum" className="py-20" style={{ backgroundColor: brand.lightBlue }}>
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-center text-3xl font-black text-gray-900">How the 2-month sprint works</h2>
                    <p className="mt-3 text-center text-sm text-gray-600">
                        A clear, four-phase structure so you always know what’s next.
                    </p>

                    <div className="mt-10 grid gap-6 md:grid-cols-4">
                        {howItWorks.map((step) => (
                            <div
                                key={step.label}
                                className="relative flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm border border-gray-200"
                            >
                                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{step.label}</div>
                                <div className="text-sm font-bold text-gray-900">{step.title}</div>
                                <p className="text-xs text-gray-600">{step.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <a
                            href={CALENDLY_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                        >
                            Talk through the program
                        </a>
                        <Link
                            href="/pricing"
                            className="rounded-xl border-2 bg-white px-7 py-3 text-sm font-bold transition-all duration-300 hover:bg-gray-50"
                            style={{ borderColor: brand.primary, color: brand.primary }}
                        >
                            Compare with other plans
                        </Link>
                    </div>
                </div>
            </section>

            {/* WHO IT'S FOR */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-center text-3xl font-black text-gray-900">Is this a fit for you?</h2>
                    <p className="mt-3 text-center text-sm text-gray-600">
                        Ideal for founders who already have momentum and want to professionalize their raise.
                    </p>

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</div>
                            <div className="text-sm font-bold text-gray-900">Pre-seed & Seed</div>
                            <p className="mt-2 text-sm text-gray-600">
                                You have an MVP or early product, first users or pilots, and a clear next funding milestone.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Ambition</div>
                            <div className="text-sm font-bold text-gray-900">VC-backable potential</div>
                            <p className="mt-2 text-sm text-gray-600">
                                You’re building for scale, with a defendable advantage and a market that can support a venture-sized outcome.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Mindset</div>
                            <div className="text-sm font-bold text-gray-900">Coachability & speed</div>
                            <p className="mt-2 text-sm text-gray-600">
                                You’re ready for honest feedback, fast iteration, and dedicated work over 8 focused weeks.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20" style={{ background: `linear-gradient(135deg, ${brand.white}, ${brand.lightBlue})` }}>
                <div className="mx-auto max-w-5xl px-6">
                    <h2 className="text-center text-3xl font-black text-gray-900">FAQs</h2>
                    <p className="mt-3 text-center text-sm text-gray-600">
                        Common questions founders ask before joining the Investor Accelerator.
                    </p>

                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-2 text-sm font-semibold text-gray-900">{item.q}</div>
                                <p className="text-sm text-gray-600">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALENDLY EMBED CTA */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-1 shadow-2xl">
                        <div className="rounded-[22px] bg-white p-8 md:p-10">
                            <div className="grid gap-8 md:grid-cols-2 items-center">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                                        <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Next step</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">
                                        Book a 30-minute intro call with our team
                                    </h3>
                                    <p className="mt-3 text-sm text-gray-600">
                                        We’ll review where you are in your raise, walk through the Investor Accelerator structure, and
                                        answer any questions about fit, timing, or expectations.
                                    </p>
                                    <a
                                        href={CALENDLY_URL}
                                        target=" _blank"
                                        rel="noreferrer"
                                        className="mt-6 inline-flex items-center rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                    >
                                        Open Calendly
                                        <svg
                                            className="ml-2 h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 7h6m0 0v6m0-6l-8 8M7 7h3"
                                            />
                                        </svg>
                                    </a>
                                </div>

                                {/* Embedded Calendly iframe */}
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-2">
                                    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-white">
                                        <iframe
                                            src={CALENDLY_URL}
                                            title="Investor Accelerator – Calendly"
                                            className="h-full w-full border-0"
                                            allowTransparency
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] text-center text-gray-400">
                                        If the embed doesn’t load,{" "}
                                        <a
                                            href={CALENDLY_URL}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-semibold text-blue-600 underline"
                                        >
                                            click here to open Calendly in a new tab
                                        </a>
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        Prefer email?{" "}
                        <a href="mailto:support@monkeysraiser.com" className="font-semibold text-blue-600 hover:underline">
                            Contact us to discuss custom arrangements or team pricing.
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}
