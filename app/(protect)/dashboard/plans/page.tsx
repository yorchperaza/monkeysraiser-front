"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// ===== Brand / BE =====
const BRAND = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
} as const;

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

// ===== Types =====
type Plan = {
    id: number;
    name: string | null;
    slug: string | null;
    stripe_price_id: string | null;
    stripe_product_id: string | null;
    price: number | null;          // cents
    projects?: number[];           // fallback ids if summaries not present
};

type MyPlanProjectSummary = {
    id: number | null;
    hash: string | null;
    name: string | null;
    status: string | null;
};

type MyPlan = Plan & {
    projectSummaries?: MyPlanProjectSummary[];  // preferred
    stripe?: unknown;
};

type MyPlansResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: MyPlan[];
};

type ProjectKey = { name: string | null; hash: string };

type ApiOk<T> = { ok: true; status: number; data: T };
type ApiErr = { ok: false; status: number; message: string; data: unknown };
type ApiResponse<T> = ApiOk<T> | ApiErr;

// ===== Utils =====
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const norm = (s?: string | null) => (s || "").trim().toLowerCase();
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
                    : res.status === 403
                        ? "You don't have permission to do this."
                        : res.status === 404
                            ? "Resource not found."
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

// ===== Small UI =====
function Toast({ kind = "info", message }: { kind?: "info" | "success" | "error"; message: string }) {
    const color = kind === "success" ? "bg-emerald-600" : kind === "error" ? "bg-red-600" : "bg-blue-600";
    return (
        <div className={cn("pointer-events-auto inline-flex max-w-xl items-center gap-2 rounded-xl px-3 py-2 text-white shadow-lg", color)}>
            <span className="text-xs font-bold uppercase tracking-wide">{kind}</span>
            <span className="text-sm">{message}</span>
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h2 className="text-lg font-black text-gray-900">{title}</h2>
            </div>
            <div className="p-6 space-y-6">{children}</div>
        </div>
    );
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "gray" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    } as const;
    return <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold border", tones[tone])}>{children}</span>;
}

// ===== Inline attach control for unattached plans =====
function InlineAttach({
                          planId,
                          projects,
                          token,
                          onAttached,
                          setToast,
                      }: {
    planId: number;
    projects: ProjectKey[];
    token: string;
    onAttached: () => void;
    setToast: (t: { kind: "info" | "success" | "error"; message: string } | null) => void;
}) {
    const [hash, setHash] = useState("");
    const [busy, setBusy] = useState(false);

    const doAttach = async () => {
        if (!hash) return setToast({ kind: "error", message: "Choose a project." });
        setBusy(true);
        const res = await safeJson<any>(`${BE}/plans/${planId}/attach-project`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ projectHash: hash }),
        });
        setBusy(false);
        if (res.ok) {
            setToast({ kind: "success", message: "Plan attached to project." });
            setHash("");
            onAttached();
        } else {
            setToast({ kind: "error", message: (res as ApiErr).message || "Could not attach plan." });
        }
    };

    return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <select
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="w-full sm:w-auto rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
                <option value="">Select a project…</option>
                {projects.map((p) => (
                    <option key={p.hash} value={p.hash}>
                        {p.name || p.hash}
                    </option>
                ))}
            </select>
            <button
                onClick={doAttach}
                disabled={!hash || busy}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-2 text-sm font-black text-white shadow-lg disabled:opacity-50"
            >
                {busy ? "Attaching…" : "Attach"}
            </button>
        </div>
    );
}

// ===== Page =====
export default function MyPlansPage() {
    // Auth token in state (null = unresolved)
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") setToken(localStorage.getItem("auth_token") || "");
    }, []);

    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "info" | "success" | "error"; message: string } | null>(null);

    const [myPlans, setMyPlans] = useState<MyPlan[]>([]);
    const [projects, setProjects] = useState<ProjectKey[]>([]);

    // Load: my plans + my project keys
    async function refresh() {
        if (!token) return;
        const [mp, pr] = await Promise.all([
            safeJson<MyPlansResponse>(`${BE}/me/plans?includeStripe=1`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
            safeJson<ProjectKey[]>(`${BE}/me/projects/keys?includeUnpublished=1`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        ]);
        if (mp.ok) setMyPlans(Array.isArray(mp.data?.items) ? mp.data.items : []);
        else if (mp.status !== 401) setToast({ kind: "error", message: mp.message });

        if (pr.ok) setProjects(Array.isArray(pr.data) ? pr.data : []);
        else if (pr.status !== 401) setToast({ kind: "error", message: pr.message });
    }

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (token === null) return;
            if (!token) {
                setLoading(false);
                return;
            }
            await refresh();
            if (mounted) setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [token]);

    const [attachedPlans, unattachedPlans] = useMemo(() => {
        const attached: MyPlan[] = [];
        const unattached: MyPlan[] = [];
        for (const p of myPlans) {
            const summaries = Array.isArray(p.projectSummaries) ? p.projectSummaries.filter(x => x && (x.hash || x.name)) : [];
            const hasAny =
                summaries.length > 0 ||
                (Array.isArray(p.projects) && p.projects.length > 0);
            (hasAny ? attached : unattached).push(p);
        }
        return [attached, unattached];
    }, [myPlans]);

    // ===== Auth gating =====
    if (token === null) {
        return (
            <div className="min-h-screen bg-white">
                <section className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h1 className="text-3xl font-black text-gray-900">Loading…</h1>
                </section>
            </div>
        );
    }

    if (token === "") {
        return (
            <div className="min-h-screen bg-white">
                <section className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h1 className="text-3xl font-black text-gray-900">Sign in required</h1>
                    <p className="mt-3 text-gray-600">
                        Please <Link className="text-blue-600 underline" href="/login">log in</Link>{" "}
                        to see your plans.
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Toast */}
            <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
                {toast && <Toast kind={toast.kind} message={toast.message} />}
            </div>

            {/* Hero */}
            <section
                className="relative overflow-hidden border-b py-16"
                style={{ background: `linear-gradient(135deg, ${BRAND.darkBlue}, ${BRAND.primary})` }}
            >
                <div className="absolute inset-0 z-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)", backgroundSize: "40px 40px" }}
                    />
                </div>
                <div className="relative z-10 mx-auto max-w-5xl px-6">
                    <h1 className="text-4xl font-black text-white md:text-5xl">My Plans</h1>
                    <p className="mt-3 text-lg" style={{ color: "#CFE6FF" }}>
                        View your purchased plans and see which projects they’re attached to.
                    </p>
                </div>
            </section>

            {/* CTA Banner: Buy a plan */}
            <section className="mx-auto max-w-5xl px-6 pt-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.75 5.5a.75.75 0 00-1.5 0v5.19l-2.72 1.57a.75.75 0 10.75 1.3l3.22-1.86a.75.75 0 00.38-.65V7.5z" />
                        </svg>
                        <div>
                            <div className="font-extrabold text-emerald-900">Need another plan?</div>
                            <div className="text-sm text-emerald-800">Purchase new plans from your dashboard.</div>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/plans/add"
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        Buy a plan
                    </Link>
                </div>
            </section>

            {/* Body */}
            <section className="mx-auto max-w-5xl px-6 py-10 space-y-10">
                {/* Attached */}
                <SectionCard title="Attached to Projects">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                            <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                        </div>
                    ) : attachedPlans.length > 0 ? (
                        <ul className="space-y-4">
                            {attachedPlans.map((plan) => {
                                const summaries = Array.isArray(plan.projectSummaries)
                                    ? plan.projectSummaries.filter(s => s && (s.hash || s.name))
                                    : [];
                                return (
                                    <li key={plan.id} className="rounded-2xl border border-blue-100 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate text-lg font-black text-gray-900">{plan.name || "Plan"}</h3>
                                                    <Pill tone="blue">{plan.slug || "package"}</Pill>
                                                    <Pill tone="green">{currency(plan.price)}</Pill>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-700">
                                                    Attached to:
                                                    {summaries.length > 0 ? (
                                                        <ul className="mt-1 list-disc pl-5 space-y-1">
                                                            {summaries.map((s, i) => (
                                                                <li key={`${plan.id}-${s.hash || s.id || i}`}>
                                                                    {s.hash ? (
                                                                        <Link className="text-blue-700 underline" href={`/projects/${encodeURIComponent(s.hash)}`}>
                                                                            {s.name || s.hash}
                                                                        </Link>
                                                                    ) : (
                                                                        <span>{s.name || `Project #${s.id}`}</span>
                                                                    )}
                                                                    {s.status && <span className="ml-2 text-xs text-gray-500">({s.status})</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="ml-2">multiple projects ({plan.projects?.length ?? 0})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">No attached plans yet.</div>
                    )}
                </SectionCard>

                {/* Unattached */}
                <SectionCard title="Unattached Plans">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                        </div>
                    ) : unattachedPlans.length > 0 ? (
                        <ul className="space-y-4">
                            {unattachedPlans.map((plan) => (
                                <li key={plan.id} className="rounded-2xl border border-gray-200 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-lg font-black text-gray-900">{plan.name || "Plan"}</h3>
                                                <Pill tone="gray">{plan.slug || "package"}</Pill>
                                                <Pill tone="green">{currency(plan.price)}</Pill>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">Status: <span className="font-semibold text-yellow-700">Unattached</span></div>
                                        </div>
                                        <InlineAttach
                                            planId={plan.id}
                                            projects={projects}
                                            token={token}
                                            onAttached={refresh}
                                            setToast={setToast}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                            You don’t have any unattached plans.
                        </div>
                    )}
                </SectionCard>
            </section>
        </div>
    );
}
