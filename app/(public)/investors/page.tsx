"use client";

import React from "react";
import Link from "next/link";

/** Brand shared */
const brand = {
    lightBlue: "#EBF5FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

/** Minimal decorative line chart (inline SVG, no deps) */
function MiniLine({ values = [6, 7, 8, 9, 10, 12, 11, 13, 15, 14, 17, 19] }: { values?: number[] }) {
    const w = 360, h = 96, pad = 10;
    const min = Math.min(...values), max = Math.max(...values);
    const y = (v: number) => {
        const t = max === min ? 0.5 : (v - min) / (max - min);
        return pad + (1 - t) * (h - pad * 2);
    };
    const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
    const d = values.map((v, i) => `${i ? "L" : "M"} ${pad + i * stepX} ${y(v)}`).join(" ");
    const dArea = `${d} L ${pad + (values.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={brand.primary} />
                    <stop offset="100%" stopColor={brand.purple} />
                </linearGradient>
                <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={brand.primary} stopOpacity="0.30" />
                    <stop offset="100%" stopColor={brand.primary} stopOpacity="0" />
                </linearGradient>
            </defs>
            <g opacity="0.12">
                {Array.from({ length: 4 }).map((_, i) => (
                    <line key={i} x1={pad} x2={w - pad} y1={pad + ((h - pad * 2) / 3) * i} y2={pad + ((h - pad * 2) / 3) * i} stroke="currentColor" className="text-blue-400" />
                ))}
            </g>
            <path d={dArea} fill="url(#ga)" />
            <path d={d} fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

export default function InvestorsRegisterSection() {
    return (
        <section
            className="relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${brand.white}, ${brand.lightBlue})` }}
        >
            {/* bg orbs */}
            <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6 py-20">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 shadow">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="text-sm font-bold text-gray-700">Investor Access • Free</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 sm:text-5xl">
                        Register to Unlock <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Curated Dealflow</span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Investors use MonkeysRaiser free—browse full project profiles and contact founders directly with context.
                        No fees, no paywalls, no commissions.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/register?type=investor"
                            className="rounded-xl px-7 py-3 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                        >
                            Create Investor Account (Free)
                        </Link>
                        <Link
                            href="/projects"
                            className="rounded-xl border-2 bg-white px-7 py-3 text-base font-bold transition-all duration-300 hover:bg-gray-50"
                            style={{ borderColor: brand.primary, color: brand.primary }}
                        >
                            Browse Projects
                        </Link>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">Instant access to categories, stages, traction, and founder contacts.</div>
                </div>

                {/* KPI + line graphic card */}
                <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-[2fr,1fr]">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-bold uppercase tracking-wider text-gray-600">Platform Momentum</div>
                            <div className="text-xs text-gray-500">Trailing 12 weeks</div>
                        </div>
                        <MiniLine />
                        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-2xl font-black text-gray-900">↑</div>
                                <div className="text-xs text-gray-500">New Listings</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black" style={{ color: brand.accent }}>85%</div>
                                <div className="text-xs text-gray-500">Reply Rate</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900">24h</div>
                                <div className="text-xs text-gray-500">Median Response</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="text-xs font-semibold text-gray-500">Full Access</div>
                            <div className="mt-1 text-sm text-gray-600">See complete project profiles: stage, asks, traction, and team.</div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="text-xs font-semibold text-gray-500">Direct Contact</div>
                            <div className="mt-1 text-sm text-gray-600">Message founders in-platform with clear, structured context.</div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mx-auto mt-14 max-w-6xl">
                    <h3 className="mb-6 text-center text-2xl font-black text-gray-900">Why register as an investor?</h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            ["Curated Dealflow", "High-traction projects surfaced early with transparent signals."],
                            ["Precision Filters", "Stage, sector, geography, ticket size—find fit fast."],
                            ["Founder Context", "Taglines, milestones, and funding progress at a glance."],
                            ["Warm Intros", "Reach out with structured messages founders actually answer."],
                            ["Save & Track", "Bookmark, add notes, and manage follow-ups in one place."],
                            ["Always Free", "No fees, no commissions—just quality conversations."],
                        ].map(([title, desc], i) => (
                            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                        </svg>
                                    </div>
                                    <div className="font-bold text-gray-900">{title}</div>
                                </div>
                                <div className="text-sm text-gray-600">{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div className="mx-auto mt-14 max-w-5xl">
                    <h3 className="mb-6 text-center text-2xl font-black text-gray-900">How it works</h3>
                    <ol className="mx-auto max-w-3xl space-y-4">
                        {[
                            ["Create your investor profile", "Pick your stages, sectors, and ticket size (2 minutes)."],
                            ["Browse & filter", "Use category and stage chips to narrow results instantly."],
                            ["Contact founders", "Send direct messages with your thesis and availability."],
                            ["Track outcomes", "Bookmark, note, and follow up—no spreadsheets required."],
                        ].map(([t, s], i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: brand.primary }}>
                                    <span className="text-sm font-bold text-white">{i + 1}</span>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{t}</div>
                                    <div className="text-sm text-gray-600">{s}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* CTA strip */}
                <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-1 shadow-2xl">
                    <div className="rounded-[22px] bg-white p-8 md:p-10">
                        <div className="grid items-center gap-8 md:grid-cols-2">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                                    <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Free for investors</span>
                                </div>
                                <h4 className="text-3xl font-black text-gray-900">Join the investor network</h4>
                                <p className="mt-2 text-sm text-gray-600">
                                    Access complete profiles and message founders directly—no fees, ever.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                <Link
                                    href="/register?type=investor"
                                    className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                >
                                    Create Investor Account
                                </Link>
                                <Link
                                    href="/projects"
                                    className="rounded-xl border-2 bg-white px-6 py-3 text-sm font-bold transition-all duration-300 hover:bg-gray-50"
                                    style={{ borderColor: brand.primary, color: brand.primary }}
                                >
                                    Explore Projects
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ + Privacy */}
                <div className="mx-auto mt-12 max-w-5xl">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">FAQ</div>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="font-semibold text-gray-900">Is it really free for investors?</div>
                                    <div className="text-gray-600">Yes. Full access to projects and direct messaging at no cost.</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">What do founders see?</div>
                                    <div className="text-gray-600">Your investor profile and message. We never expose private emails without consent.</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Do you charge success fees?</div>
                                    <div className="text-gray-600">No success fees or commissions. We focus on quality connections.</div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">Privacy</div>
                            <p className="text-sm text-gray-600">
                                You control your visibility and can delete your account anytime. We don’t sell data—ever.
                            </p>
                            <Link
                                href="/privacy"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-bold"
                                style={{ color: brand.primary }}
                            >
                                Read our Privacy Policy
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom CTAs */}
                <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-4">
                    <Link
                        href="/register?type=investor"
                        className="rounded-xl px-7 py-3 text-base font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                    >
                        Create Investor Account (Free)
                    </Link>
                    <Link
                        href="/projects"
                        className="rounded-xl border-2 bg-white px-7 py-3 text-base font-bold transition-all duration-300 hover:bg-gray-50"
                        style={{ borderColor: brand.primary, color: brand.primary }}
                    >
                        Browse Projects First
                    </Link>
                </div>
            </div>
        </section>
    );
}
