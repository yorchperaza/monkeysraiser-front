"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

// ===== Types =====
type MyPlanProjectSummary = {
    id: number | null;
    hash: string | null;
    name: string | null;
    status: string | null;
};

export type MyPlan = {
    id: number;
    name: string | null;
    slug: string | null;
    price: number | null; // cents
    projects?: number[]; // fallback ids if summaries not present
    projectSummaries?: MyPlanProjectSummary[];
};

type MyPlansResponse = {
    items: MyPlan[];
};

type ApiOk<T> = { ok: true; status: number; data: T };
type ApiErr = { ok: false; status: number; message: string; data: unknown };
type ApiResponse<T> = ApiOk<T> | ApiErr;

// ===== Utils =====
const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const currency = (cents?: number | null) => {
    if (typeof cents !== "number") return "—";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(cents / 100);
    } catch {
        return String(cents / 100);
    }
};

async function safeJson<T = unknown>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(url, init);
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson ? await res.json().catch(() => ({})) : null;
        if (!res.ok) {
            const msg =
                res.status === 401
                    ? "Please sign in to continue."
                    : res.status >= 500
                        ? "We’re having trouble right now. Please try again."
                        : (data as any)?.message ?? "Something went wrong.";
            return { ok: false, status: res.status, message: msg, data };
        }
        return { ok: true, status: res.status, data: data as T };
    } catch {
        return { ok: false, status: 0, message: "Network error. Check your connection and try again.", data: null };
    }
}

function PlansIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.25 7.5L12 12 3.75 7.5M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0v9a2.25 2.25 0 01-1.125 1.944l-7.5 4.2a2.25 2.25 0 01-2.25 0l-7.5-4.2A2.25 2.25 0 013 16.5v-9M12 12v9" />
        </svg>
    );
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "gray" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    } as const;
    return <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold border", tones[tone])}>{children}</span>;
}

// ===== Widget =====
export default function DashboardPlansWidget({ limit = 4, plans: initialPlans }: { limit?: number; plans?: MyPlan[] }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(!initialPlans);
    const [plans, setPlans] = useState<MyPlan[]>(initialPlans || []);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") setToken(localStorage.getItem("auth_token") || "");
    }, []);

    useEffect(() => {
        if (initialPlans) {
             setLoading(false);
             return;
        }

        let alive = true;
        (async () => {
            if (token === null) return;
            if (!token) {
                setLoading(false);
                return;
            }
            setErr(null);
            setLoading(true);
            const res = await safeJson<MyPlansResponse>(`${BE}/me/plans?perPage=${encodeURIComponent(
                String(Math.max(1, limit * 2))
            )}&includeStripe=0`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            if (!alive) return;
            if (res.ok) {
                setPlans(Array.isArray(res.data?.items) ? res.data.items : []);
            } else {
                setErr(res.message || "Unable to load plans.");
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, [token, limit, initialPlans]);

    const hasPlans = plans.length > 0;
    const visible = useMemo(() => plans.slice(0, limit), [plans, limit]);

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <PlansIcon className="h-5 w-5 text-blue-600" />
                    <h2 className="text-sm font-extrabold text-gray-900">Plans</h2>
                </div>
                <Link href="/dashboard/plans" className="text-xs font-bold text-blue-700 underline">
                    Manage
                </Link>
            </div>

            <div className="p-4">
                {/* Loading */}
                {loading && (
                    <div className="space-y-2">
                        <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                        <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                        <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                    </div>
                )}

                {/* Error */}
                {!loading && err && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
                )}

                {/* Empty state → promo */}
                {!loading && !err && !hasPlans && (
                    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <PlansIcon className="h-6 w-6 text-emerald-700" />
                            <div>
                                <div className="font-extrabold text-emerald-900">Boost visibility with a plan</div>
                                <div className="text-sm text-emerald-800">Feature your project, get investor reach, and unlock tools.</div>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/plans/add"
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            Buy a plan
                        </Link>
                    </div>
                )}

                {/* List */}
                {!loading && !err && hasPlans && (
                    <ul className="space-y-3">
                        {visible.map((p) => {
                            const summaries = Array.isArray(p.projectSummaries)
                                ? p.projectSummaries.filter((s) => s && (s.hash || s.name))
                                : [];
                            const attachedCount =
                                summaries.length > 0
                                    ? summaries.length
                                    : Array.isArray(p.projects)
                                        ? p.projects.length
                                        : 0;
                            const attached = attachedCount > 0;

                            return (
                                <li key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="truncate text-sm font-black text-gray-900">{p.name || "Plan"}</div>
                                            <Pill tone={attached ? "green" : "gray"}>
                                                {attached ? `Attached • ${attachedCount}` : "Unattached"}
                                            </Pill>
                                            <Pill tone="blue">{currency(p.price)}</Pill>
                                        </div>
                                        {attached && summaries.length > 0 && (
                                            <div className="mt-1 truncate text-xs text-gray-600">
                                                {summaries.slice(0, 2).map((s, i) => (
                                                    <span key={`${p.id}-${s.hash || s.id || i}`}>
                            <Link className="text-blue-700 underline" href={`/projects/${encodeURIComponent(s.hash || "")}`}>
                              {s.name || s.hash || `Project #${s.id}`}
                            </Link>
                                                        {i < Math.min(1, summaries.length - 1) && <span>, </span>}
                          </span>
                                                ))}
                                                {summaries.length > 2 && <span> +{summaries.length - 2} more</span>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-3 shrink-0">
                                        <Link
                                            href="/dashboard/plans"
                                            className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-800 hover:border-blue-300 hover:text-blue-700"
                                        >
                                            Details
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Footer link if there are more than shown */}
                {!loading && !err && hasPlans && plans.length > visible.length && (
                    <div className="mt-3 text-right">
                        <Link href="/dashboard/plans" className="text-xs font-bold text-blue-700 underline">
                            View all {plans.length} plans
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
