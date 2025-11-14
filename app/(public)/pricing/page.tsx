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
    features: string[];
    ctaHref: string;
    ctaLabel: string;
    ribbon?: string;
};

const PLANS: Plan[] = [
    {
        name: "Community Listing",
        price: "$0",
        period: "",
        features: [
            "Free public listing in the MonkeysRaiser directory",
            "Full project profile: deck, overview, team, traction",
            "Discoverable by browsing investors",
            "Edit & update anytime",
            "No time limits, no hidden fees",
        ],
        ctaHref: "/register",
        ctaLabel: "Submit Your Project",
    },
    {
        name: "Spotlight Boost",
        price: "$400",
        period: "2 months",
        highlight: true,
        features: [
            "Priority placement in Featured Projects",
            "“Spotlight” badge across site",
            "Included in weekly investor newsletter",
            "2×–3× more visibility vs. standard listings",
            "Custom analytics report at campaign end",
        ],
        ctaHref: "/register",
        ctaLabel: "Upgrade to Spotlight",
        ribbon: "Most Popular",
    },
    {
        name: "Investor Accelerator",
        price: "$8,000",
        period: "One-time • 2 months",
        features: [
            "7-day Premier Showcase on homepage top",
            "Custom feature story with media partner (200K+ readers)",
            "2 rounds: deck & business plan expert review",
            "2 live mock pitches with seasoned investors",
            "4–5 curated 1:1 investor introductions",
            "Investor-ready asset pack (one-pager + updated deck)",
            "Personal campaign manager throughout",
        ],
        ctaHref: "/register?type=investor",
        ctaLabel: "Apply for Accelerator",
    },
];

/* ---------------- PRICING CARD ---------------- */
function PricingCard({ plan }: { plan: Plan }) {
    return (
        <div className={`relative rounded-2xl border p-6 shadow-sm ${plan.highlight ? "border-blue-300 shadow-blue-100" : "border-gray-200"}`}>
            {plan.ribbon && (
                <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow">
                    {plan.ribbon}
                </div>
            )}
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">{plan.name}</div>
            <div className="mb-4 flex items-baseline gap-2">
                <div className="text-4xl font-black text-gray-900">{plan.price}</div>
                {plan.period ? <div className="text-sm text-gray-500">{plan.period}</div> : null}
            </div>
            <ul className="mb-6 space-y-2 text-sm text-gray-700">
                {plan.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                        <Check />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Link
                href={plan.ctaHref}
                className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${
                    plan.highlight
                        ? "text-white shadow-lg hover:-translate-y-0.5"
                        : "border-2 bg-white hover:bg-gray-50"
                }`}
                style={
                    plan.highlight
                        ? { background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }
                        : { borderColor: brand.primary, color: brand.primary }
                }
            >
                {plan.ctaLabel}
            </Link>
        </div>
    );
}

/* ---------------- COMPARISON TABLE ---------------- */
function ComparisonTable() {
    const rows = [
        ["Public project profile", true, true, true],
        ["Appear in Featured Projects", false, true, true],
        ["Included in investor newsletter", false, true, true],
        ["Homepage Premier Showcase", false, false, true],
        ["Pitch deck & business plan review", false, false, true],
        ["Investor meetings & introductions", false, false, true],
        ["Custom media feature", false, false, true],
    ];
    const priceRow = ["Price", "$0", "$400 (2 months)", "$8,000 (one-time)"];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                    <tr className="bg-gray-50 text-left text-sm">
                        <th className="p-4 font-semibold text-gray-700">Feature</th>
                        <th className="p-4 font-semibold text-gray-700">Community Listing</th>
                        <th className="p-4 font-semibold text-gray-700">Spotlight Boost</th>
                        <th className="p-4 font-semibold text-gray-700">Investor Accelerator</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {rows.map(([label, a, b, c], i) => (
                        <tr key={i} className="border-t">
                            <td className="p-4 text-gray-700">{label as string}</td>
                            <td className="p-4"><Check on={a as boolean} /></td>
                            <td className="p-4"><Check on={b as boolean} /></td>
                            <td className="p-4"><Check on={c as boolean} /></td>
                        </tr>
                    ))}
                    <tr className="border-t bg-gray-50 font-bold">
                        <td className="p-4">{priceRow[0]}</td>
                        <td className="p-4">{priceRow[1]}</td>
                        <td className="p-4">{priceRow[2]}</td>
                        <td className="p-4">{priceRow[3]}</td>
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
                            <h1 className="mb-2 text-5xl font-black leading-tight text-gray-900">Pricing Plans for Founders</h1>
                            <div className="mb-6 text-lg text-gray-600">
                                <p>At MonkeysRaiser, every startup deserves a chance to be seen.</p>
                                <p>Choose the plan that fits your goals—whether you’re just starting or ready to accelerate fundraising.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/register"
                                    className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                >
                                    Get Started (It’s Free)
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
                        <h2 className="text-2xl font-black text-gray-900">Find the Right Launchpad for Your Startup</h2>
                        <p className="mt-2 text-gray-600">
                            From first exposure to full investor acceleration, our plans match your ambition and stage.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {PLANS.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} />
                        ))}
                    </div>

                    {/* Comparison */}
                    <div className="mt-16">
                        <h3 className="mb-6 text-center text-2xl font-black text-gray-900">Which Plan Is Right for You?</h3>
                        <ComparisonTable />
                    </div>

                    {/* FAQ / Notes */}
                    <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">Good to know</div>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>Community Listing remains free with no time limit.</li>
                                <li>Spotlight Boost runs for 2 months; renew anytime.</li>
                                <li>Investor Accelerator is a one-time, application-based program.</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">Investors</div>
                            <p className="text-sm text-gray-700">
                                MonkeysRaiser is free for investors—browse full profiles and contact founders directly.
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
                                        <span className="text-xs font-bold uppercase tracking-wide text-blue-700">For Founders</span>
                                    </div>
                                    <h4 className="text-3xl font-black text-gray-900">Launch your fundraising journey</h4>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Start free, then boost visibility or go all-in with the Accelerator—on your timeline.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                    <Link
                                        href="/register/founder"
                                        className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
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
