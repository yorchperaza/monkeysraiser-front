"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
function MiniLine({
                      values = [6, 7, 8, 9, 10, 12, 11, 13, 15, 14, 17, 19],
                  }: {
    values?: number[];
}) {
    const w = 360,
        h = 96,
        pad = 10;
    const min = Math.min(...values),
        max = Math.max(...values);
    const y = (v: number) => {
        const t = max === min ? 0.5 : (v - min) / (max - min);
        return pad + (1 - t) * (h - pad * 2);
    };
    const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
    const d = values
        .map((v, i) => `${i ? "L" : "M"} ${pad + i * stepX} ${y(v)}`)
        .join(" ");
    const dArea = `${d} L ${
        pad + (values.length - 1) * stepX
    } ${h - pad} L ${pad} ${h - pad} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={brand.primary} />
                    <stop offset="100%" stopColor={brand.purple} />
                </linearGradient>
                <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={brand.primary} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={brand.primary} stopOpacity="0" />
                </linearGradient>
            </defs>
            <g opacity="0.12">
                {Array.from({ length: 4 }).map((_, i) => (
                    <line
                        key={i}
                        x1={pad}
                        x2={w - pad}
                        y1={pad + ((h - pad * 2) / 3) * i}
                        y2={pad + ((h - pad * 2) / 3) * i}
                        stroke="currentColor"
                        className="text-blue-400"
                    />
                ))}
            </g>
            <path d={dArea} fill="url(#ga)" />
            <path
                d={d}
                fill="none"
                stroke="url(#g)"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ========= INNER COMPONENT: uses useSearchParams ========= */

function BillingReturnInner() {
    const search = useSearchParams();
    const redirectStatus = (search.get("redirect_status") || "").toLowerCase();

    const isSuccess = redirectStatus === "succeeded" || redirectStatus === "success";
    const isFailed =
        redirectStatus === "failed" ||
        redirectStatus === "canceled" ||
        redirectStatus === "cancelled";

    const statusLabel = useMemo(() => {
        if (isSuccess) return "Your payment was successful 🎉";
        if (isFailed) return "Your payment was not completed";
        return "We’re not sure about this payment";
    }, [isSuccess, isFailed]);

    const statusDescription = useMemo(() => {
        if (isSuccess)
            return "Your billing has been updated and your MonkeysRaiser plan is now active.";
        if (isFailed)
            return "It looks like the payment was canceled or failed. You haven’t been charged.";
        return "We couldn’t determine the payment result from this URL. If you’re unsure, check the Billing page.";
    }, [isSuccess, isFailed]);

    const badgeColor = isSuccess
        ? "bg-green-500"
        : isFailed
            ? "bg-red-500"
            : "bg-amber-400";

    const badgeText =
        isSuccess ? "Success" : isFailed ? "Not completed" : "Unknown status";

    return (
        <section
            className="relative min-h-screen overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${brand.white}, ${brand.lightBlue})` }}
        >
            {/* bg orbs */}
            <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
                {/* Header */}
                <div className="mx-auto w-full max-w-2xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow">
                        <span className={`h-2 w-2 rounded-full ${badgeColor}`} />
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
              Billing status · {badgeText}
            </span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                        {statusLabel}
                    </h1>
                    <p className="mt-3 text-base text-gray-600">{statusDescription}</p>
                </div>

                {/* Content */}
                <div className="mx-auto mt-10 grid w-full max-w-4xl gap-6 md:grid-cols-[1.6fr,1.2fr]">
                    {/* Left: actions */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                            Next steps
                        </div>

                        {isSuccess && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <p>
                                    You can now review your subscription, invoices, and payment methods in the{" "}
                                    <Link
                                        href="/dashboard/plans"
                                        className="font-semibold"
                                        style={{ color: brand.primary }}
                                    >
                                        Plans
                                    </Link>{" "}
                                    page.
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-gray-600">
                                    <li>Your subscription will renew automatically.</li>
                                    <li>You may upgrade or cancel at any time.</li>
                                    <li>We’ll email you a receipt for this payment.</li>
                                </ul>
                            </div>
                        )}

                        {isFailed && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <p>
                                    The payment wasn’t completed. You can try again from the Billing section
                                    whenever you’re ready.
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-gray-600">
                                    <li>Check your card details or bank authorization.</li>
                                    <li>Start a new checkout from the Billing page.</li>
                                </ul>
                            </div>
                        )}

                        {!isSuccess && !isFailed && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <p>
                                    We couldn’t read a clear payment status from this URL. If you just paid,
                                    please check the Billing section below.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/dashboard/plans"
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                }}
                            >
                                Go to Plans
                            </Link>
                            <Link
                                href="/projects"
                                className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:bg-gray-50"
                                style={{ borderColor: brand.primary, color: brand.primary }}
                            >
                                Back to Projects
                            </Link>
                        </div>
                    </div>

                    {/* Right: decorative mini chart + help */}
                    <div className="grid gap-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Activity
                                </div>
                            </div>
                            <MiniLine />
                            <div className="mt-3 text-xs text-gray-500">
                                This chart is just decorative—your real billing details live in the Billing
                                page.
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                Need help?
                            </div>
                            <p>
                                If you’re unsure about the status of your payment, take a screenshot of this
                                page and contact support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ========= OUTER PAGE: Suspense wrapper ========= */

export default function BillingReturnPage() {
    return (
        <Suspense
            fallback={
                <section
                    className="relative flex min-h-screen items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${brand.white}, ${brand.lightBlue})` }}
                >
                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm text-center">
                        <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                            Loading billing result…
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            We’re reading the result from Stripe.
                        </div>
                    </div>
                </section>
            }
        >
            <BillingReturnInner />
        </Suspense>
    );
}
