"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import FounderRegister from "@/components/auth/FounderRegister";

/* ---------------- BRAND ---------------- */
const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

/* ---------------- SMALL UTILITIES ---------------- */
function Check({ on = true }: { on?: boolean }) {
    return on ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293A1 1 0 003.293 10.7l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
      </svg>
    </span>
    ) : (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">—</span>
    );
}

type Plan = {
    name: string;
    price: string;
    period?: string;
    highlight?: boolean;
    tagline?: string;
    features: string[];
    ctaHref: string;
    ctaLabel: string;
    ribbon?: string;
    bestFor?: string;
    color?: string;
};

const PLANS: Plan[] = [
    {
        name: "Community Listing",
        price: "$0",
        period: "",
        tagline: "Start your journey with visibility.",
        features: [
            "Free public listing in the MonkeysRaiser directory",
            "Full project profile: deck, overview, team, traction",
            "Discoverable by browsing investors",
            "Edit & update anytime",
            "No time limits, no hidden fees",
        ],
        ctaHref: "/register",
        ctaLabel: "Submit Your Project",
        color: "#6B7280",
    },
    {
        name: "Spotlight Boost",
        price: "$400",
        period: "2 months",
        tagline: "Get noticed faster.",
        features: [
            "Priority placement in Featured Projects",
            "\"Spotlight\" badge across site",
            "Included in weekly investor newsletter",
            "2-3x more visibility vs. standard listings",
            "Custom analytics report at campaign end",
        ],
        ctaHref: "/register",
        ctaLabel: "Upgrade to Spotlight",
        color: "#3B82F6",
    },
    {
        name: "Growth Visibility Pack",
        price: "$1,200",
        period: "1 month",
        tagline: "Make your startup look active, credible, and worth a conversation.",
        highlight: true,
        ribbon: "New",
        features: [
            "Spotlight Boost included",
            "Founder or startup article (SEO-optimized)",
            "Featured placement for 30 days",
            "Investor newsletter inclusion (2 sends)",
            "Basic performance report (views, clicks, saves)",
        ],
        ctaHref: "/register",
        ctaLabel: "Get Growth Pack",
        bestFor: "Founders warming up investors or testing market interest.",
        color: "#0066CC",
    },
    {
        name: "Traction Builder",
        price: "$2,500",
        period: "6 weeks",
        tagline: "Turn visibility into real investor interest.",
        features: [
            "Everything in Growth Visibility Pack",
            "Deck structure review (1 round)",
            "One-pager creation or refinement",
            "LinkedIn amplification (MonkeysRaiser + founder)",
            "Investor feedback summary (anonymous signals)",
            "Accelerator readiness score (internal)",
        ],
        ctaHref: "/register",
        ctaLabel: "Build Traction",
        bestFor: "Founders planning to apply to the Accelerator soon.",
        color: "#10B981",
    },
    {
        name: "Fundraising Prep Sprint",
        price: "$4,000",
        period: "6-8 weeks",
        tagline: "Get investor-ready before you ask for money.",
        features: [
            "Everything in Traction Builder",
            "Full deck review (2 rounds)",
            "Narrative & positioning session",
            "Fundraising strategy outline",
            "Data room checklist",
            "Priority consideration for Accelerator",
        ],
        ctaHref: "/register",
        ctaLabel: "Start Prep Sprint",
        bestFor: "Founders who know they need work before paying $8k.",
        color: "#F59E0B",
    },
    {
        name: "Investor Accelerator",
        price: "$8,000",
        period: "2 months",
        tagline: "Full hands-on investor readiness program.",
        ribbon: "Premium",
        features: [
            "30-day Premier Showcase on homepage top",
            "Custom feature story with media partner (200K+ readers)",
            "2 rounds: deck & business plan expert review",
            "2 live mock pitches with seasoned investors",
            "3-4 curated 1:1 investor introductions",
            "Investor-ready asset pack (one-pager + updated deck)",
            "Personal campaign manager throughout",
        ],
        ctaHref: "/investor-accelerator",
        ctaLabel: "Apply for Accelerator",
        bestFor: "Founders ready to go all-in on fundraising.",
        color: "#DC2626",
    },
];

/* ---------------- PRICING CARD ---------------- */
function PricingCard({ plan }: { plan: Plan }) {
    return (
        <div
            className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                plan.highlight
                    ? "border-blue-300 shadow-blue-100 ring-2 ring-blue-200"
                    : "border-gray-200"
            }`}
        >
            {plan.ribbon && (
                <div
                    className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow"
                    style={{
                        background:
                            plan.ribbon === "Premium"
                                ? "linear-gradient(135deg, #DC2626, #991B1B)"
                                : "linear-gradient(135deg, #0066CC, #6B5CE7)",
                    }}
                >
                    {plan.ribbon}
                </div>
            )}
            <div
                className="mb-1 text-sm font-semibold uppercase tracking-wider"
                style={{ color: plan.color || "#6B7280" }}
            >
                {plan.name}
            </div>
            <div className="mb-2 flex items-baseline gap-2">
                <div className="text-4xl font-black text-gray-900">{plan.price}</div>
                {plan.period ? (
                    <div className="text-sm text-gray-500">{plan.period}</div>
                ) : null}
            </div>
            {plan.tagline && (
                <p className="mb-4 text-sm text-gray-600">{plan.tagline}</p>
            )}
            <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-700">
                {plan.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                        <Check />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            {plan.bestFor && (
                <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span className="font-bold">Best for:</span> {plan.bestFor}
                </div>
            )}
            <Link
                href={plan.ctaHref}
                className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${
                    plan.highlight
                        ? "text-white shadow-lg hover:-translate-y-0.5"
                        : "border-2 bg-white hover:bg-gray-50"
                }`}
                style={
                    plan.highlight
                        ? {
                            background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                        }
                        : { borderColor: plan.color || brand.primary, color: plan.color || brand.primary }
                }
            >
                {plan.ctaLabel}
            </Link>
        </div>
    );
}

/* ---------------- COMPARISON TABLE ---------------- */
function ComparisonTable() {
    const headers = [
        "Feature",
        "Community",
        "Spotlight",
        "Growth",
        "Traction",
        "Prep Sprint",
        "Accelerator",
    ];
    const rows = [
        ["Public project profile", true, true, true, true, true, true],
        ["Featured Projects placement", false, true, true, true, true, true],
        ["Investor newsletter", false, true, true, true, true, true],
        ["SEO article", false, false, true, true, true, true],
        ["Deck review", false, false, false, "1 round", "2 rounds", "2 rounds"],
        ["One-pager creation", false, false, false, true, true, true],
        ["LinkedIn amplification", false, false, false, true, true, true],
        ["Investor feedback", false, false, false, true, true, true],
        ["Fundraising strategy", false, false, false, false, true, true],
        ["Data room checklist", false, false, false, false, true, true],
        ["Mock pitches", false, false, false, false, false, "2 sessions"],
        ["Investor introductions", false, false, false, false, false, "3-4"],
        ["Campaign manager", false, false, false, false, false, true],
    ];
    const priceRow = ["Price", "$0", "$400", "$1,200", "$2,500", "$4,000", "$8,000"];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                    <thead>
                    <tr className="bg-gray-50 text-left">
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className={`p-3 font-semibold text-gray-700 ${i === 0 ? "min-w-[180px]" : "min-w-[100px] text-center"}`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map(([label, ...vals], i) => (
                        <tr key={i} className="border-t">
                            <td className="p-3 text-gray-700">{label as string}</td>
                            {vals.map((v, j) => (
                                <td key={j} className="p-3 text-center">
                                    {typeof v === "boolean" ? (
                                        <span className="inline-flex justify-center">
                                            <Check on={v} />
                                        </span>
                                    ) : (
                                        <span className="font-medium text-gray-900">{v}</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="border-t bg-gray-50 font-bold">
                        {priceRow.map((p, i) => (
                            <td key={i} className={`p-3 ${i === 0 ? "" : "text-center"}`}>
                                {p}
                            </td>
                        ))}
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* --------- Optional simple fallback while FounderRegister loads --------- */
function FounderRegisterFallback() {
    return (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
            <div className="mb-2 h-9 w-full rounded-xl bg-gray-200" />
            <div className="mb-2 h-9 w-full rounded-xl bg-gray-200" />
            <div className="h-9 w-28 rounded-xl bg-gray-200" />
        </div>
    );
}

/* ---------------- PAGE ---------------- */
export default function PricingPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero */}
            <section
                className="relative overflow-hidden"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6 py-20">
                    <div className="grid items-start gap-12 md:grid-cols-2">
                        <div>
                            <h1 className="mb-2 text-5xl font-black leading-tight text-gray-900">
                                Pricing Plans for Founders
                            </h1>
                            <div className="mb-6 text-lg text-gray-600">
                                <p>At MonkeysRaiser, every startup deserves a chance to be seen.</p>
                                <p>
                                    Choose the plan that fits your goals—whether you're just starting
                                    or ready to accelerate fundraising.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/register"
                                    className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                    }}
                                >
                                    Get Started (It's Free)
                                </Link>
                                <Link
                                    href="/investors"
                                    className="rounded-xl border-2 bg-white px-6 py-3 text-sm font-bold transition hover:bg-gray-50"
                                    style={{ borderColor: brand.primary, color: brand.primary }}
                                >
                                    Investors register free →
                                </Link>
                            </div>
                        </div>

                        {/* Founder Register wrapped in Suspense */}
                        <div className="flex items-center justify-center">
                            <Suspense fallback={<FounderRegisterFallback />}>
                                <FounderRegister redirectTo="/me?welcome=1" compact />
                            </Suspense>
                        </div>
                    </div>

                    {/* Subheading */}
                    <div className="mx-auto mt-16 max-w-3xl text-center">
                        <h2 className="text-2xl font-black text-gray-900">
                            Find the Right Launchpad for Your Startup
                        </h2>
                        <p className="mt-2 text-gray-600">
                            From first exposure to full investor acceleration, our plans match your
                            ambition and stage.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-6">
                    {/* Funnel visual */}
                    <div className="mb-12 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-gray-500">
                        <span className="rounded-full bg-gray-100 px-3 py-1">Free Listing</span>
                        <span>→</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">$400 Spotlight</span>
                        <span>→</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">$1.2k-$2.5k Growth</span>
                        <span>→</span>
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">$4k Prep</span>
                        <span>→</span>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">$8k Accelerator</span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {PLANS.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} />
                        ))}
                    </div>

                    {/* Comparison */}
                    <div className="mt-16">
                        <h3 className="mb-6 text-center text-2xl font-black text-gray-900">
                            Which Plan Is Right for You?
                        </h3>
                        <ComparisonTable />
                    </div>

                    {/* FAQ / Notes */}
                    <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">
                                Good to know
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>Community Listing remains free with no time limit.</li>
                                <li>Spotlight Boost runs for 2 months; renew anytime.</li>
                                <li>Growth packs can be upgraded to Accelerator with credit applied.</li>
                                <li>Investor Accelerator is application-based with limited spots.</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">
                                Investors
                            </div>
                            <p className="text-sm text-gray-700">
                                MonkeysRaiser is free for investors—browse full profiles and contact
                                founders directly.
                            </p>
                            <Link
                                href="/investors"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-bold"
                                style={{ color: brand.primary }}
                            >
                                Learn more
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-1 shadow-2xl">
                        <div className="rounded-[22px] bg-white p-8 md:p-10">
                            <div className="grid items-center gap-8 md:grid-cols-2">
                                <div>
                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                                        <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                            For Founders
                                        </span>
                                    </div>
                                    <h4 className="text-3xl font-black text-gray-900">
                                        Launch your fundraising journey
                                    </h4>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Start free, then boost visibility or go all-in with the Accelerator—on
                                        your timeline.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                    <Link
                                        href="/register"
                                        className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                        }}
                                    >
                                        Get Started Free
                                    </Link>
                                    <Link
                                        href="/projects"
                                        className="rounded-xl border-2 bg-white px-6 py-3 text-sm font-bold transition hover:bg-gray-50"
                                        style={{ borderColor: brand.primary, color: brand.primary }}
                                    >
                                        Explore Projects
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal */}
                    <p className="mx-auto mt-6 max-w-4xl text-center text-xs text-gray-500">
                        By continuing you agree to our{" "}
                        <a href="/terms" className="font-medium text-blue-600 hover:underline">
                            Terms
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="font-medium text-blue-600 hover:underline">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </section>
        </main>
    );
}
