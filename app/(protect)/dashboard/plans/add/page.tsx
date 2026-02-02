"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PK || "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// ===== Packages marketing copy (fallbacks & extras) =====
const PACKAGE_COPY: Record<
    string,
    {
        label: string;
        priceCents?: number;
        duration?: string;
        features: string[];
        tagline?: string;
    }
> = {
    "spotlight-boost": {
        label: "Spotlight Boost",
        priceCents: 40000,
        duration: "2 months",
        features: [
            "Priority placement in the Featured Projects section",
            "“Spotlight” badge on your project card across the site",
            "Inclusion in the MonkeysRaiser weekly investor newsletter",
            "2×–3× more visibility than standard listings",
            "Custom analytics report at the end of the campaign",
        ],
        tagline: "Get seen by more investors when it matters most.",
    },
    "growth-visibility-pack": {
        label: "Growth Visibility Pack",
        priceCents: 120000,
        duration: "1 month",
        features: [
            "Spotlight Boost included",
            "Founder or startup article (SEO-optimized)",
            "Featured placement for 30 days",
            "Investor newsletter inclusion (2 sends)",
            "Basic performance report (views, clicks, saves)",
        ],
        tagline: "Make your startup look active, credible, and worth a conversation.",
    },
    "traction-builder": {
        label: "Traction Builder",
        priceCents: 250000,
        duration: "6 weeks",
        features: [
            "Everything in Growth Visibility Pack",
            "Deck structure review (1 round)",
            "One-pager creation or refinement",
            "LinkedIn amplification (MonkeysRaiser + founder)",
            "Investor feedback summary (anonymous signals)",
            "Accelerator readiness score (internal)",
        ],
        tagline: "Turn visibility into real investor interest.",
    },
    "fundraising-prep-sprint": {
        label: "Fundraising Prep Sprint",
        priceCents: 400000,
        duration: "6-8 weeks",
        features: [
            "Everything in Traction Builder",
            "Full deck review (2 rounds)",
            "Narrative & positioning session",
            "Fundraising strategy outline",
            "Data room checklist",
            "Priority consideration for Accelerator",
        ],
        tagline: "Get investor-ready before you ask for money.",
    },
    "investor-accelerator": {
        label: "Investor Accelerator",
        priceCents: 800000,
        duration: "2 months — One Time",
        features: [
            "Premier Showcase listing at the top of the site for 7 days",
            "Custom feature story on a major media partner site (200K+ monthly readers)",
            "2 rounds of expert pitch deck and business plan review",
            "2 live mock pitch sessions with seasoned investors",
            "4–5 curated 1:1 introductions with targeted investors",
            "Final investor-ready asset package (one-pager, updated deck)",
            "Personal campaign manager support throughout the process",
        ],
        tagline: "Launch your startup to the right investors — and the right opportunities.",
    },
};

// ===== Types =====
type Plan = {
    id: number;
    name: string | null;
    slug: string | null;
    stripe_price_id: string | null;
    stripe_product_id: string | null;
    price: number | null;
    projects?: number[];
};

type PlansResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: Plan[];
};

type ProjectKey = { name: string | null; hash: string };

type ApiOk<T> = { ok: true; status: number; data: T };
type ApiErr = { ok: false; status: number; message: string; data: unknown };
type ApiResponse<T> = ApiOk<T> | ApiErr;

// ===== Utils =====
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
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
const norm = (s?: string | null) => (s || "").trim().toLowerCase();

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

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">{children}</span>;
}

// ===== Payment Form (Stripe Payment Element) =====
function PaymentForm({
                         onSuccess,
                         onCancel,
                     }: {
    onSuccess: (paymentIntentId?: string) => void;
    onCancel: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const RETURN_URL =
        process.env.NEXT_PUBLIC_STRIPE_RETURN_URL ||
        "https://monkeysraiser.com/billing/return";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setError(null);
        setSubmitting(true);

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: RETURN_URL, // ✅ required for Affirm/Klarna redirects
            },
            redirect: "if_required",
        });

        if (confirmError) {
            setError(confirmError.message || "Payment failed.");
            setSubmitting(false);
            return;
        }

        if (
            paymentIntent?.status === "succeeded" ||
            paymentIntent?.status === "processing" ||
            paymentIntent?.status === "requires_capture"
        ) {
            // >>> call parent with the PaymentIntent id
            onSuccess(paymentIntent.id);
        } else {
            setError(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <PaymentElement options={{ layout: "tabs" }} />
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || submitting}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-5 py-2 text-sm font-black text-white shadow-lg disabled:opacity-50"
                >
                    {submitting ? "Processing…" : "Pay now"}
                </button>
            </div>
        </form>
    );
}

// ===== Page =====
export default function PlansAndProjectsPage() {
    // Auth token in state (null = unresolved)
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") setToken(localStorage.getItem("auth_token") || "");
    }, []);

    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "info" | "success" | "error"; message: string } | null>(null);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [projects, setProjects] = useState<ProjectKey[]>([]);

    // Attach modal state
    const [attachOpen, setAttachOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedProjectHash, setSelectedProjectHash] = useState<string>("");

    // Payment state inside modal
    const [step, setStep] = useState<"select" | "pay">("select");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [creatingIntent, setCreatingIntent] = useState(false);

    // Load plans + project keys
    useEffect(() => {
        let mounted = true;
        if (token === null) return;

        (async () => {
            if (!token) {
                if (mounted) setLoading(false);
                return;
            }

            const authHeaders = { Authorization: `Bearer ${token}` };

            const [plansRes, projRes] = await Promise.all([
                safeJson<PlansResponse>(`${BE}/plans`, { headers: authHeaders, cache: "no-store" }),
                safeJson<ProjectKey[]>(`${BE}/me/projects/keys?includeUnpublished=1`, { headers: authHeaders, cache: "no-store" }),
            ]);

            if (!mounted) return;

            if (plansRes.ok) setPlans(Array.isArray(plansRes.data?.items) ? plansRes.data.items : []);
            else if (plansRes.status !== 401) setToast({ kind: "error", message: plansRes.message });

            if (projRes.ok) setProjects(Array.isArray(projRes.data) ? projRes.data : []);
            else if (projRes.status !== 401) setToast({ kind: "error", message: projRes.message });

            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [token]);

    // --- helper to create payment intent (with or without projectHash) ---
    const createIntent = async (planId: number, projectHash?: string) => {
        if (!token) {
            setToast({ kind: "error", message: "Sign in required." });
            return;
        }
        if (!STRIPE_PK || !stripePromise) {
            setToast({ kind: "error", message: "Stripe is not configured (missing NEXT_PUBLIC_STRIPE_PK)." });
            return;
        }

        setCreatingIntent(true);
        setClientSecret(null);

        const body: Record<string, unknown> = { mode: "intent" };
        if (projectHash) body.projectHash = projectHash;

        const endpoints = [
            `${BE}/plans/${encodeURIComponent(String(planId))}/purchase-intent`,
            `${BE}/plans/${encodeURIComponent(String(planId))}/purchase`,
        ];

        for (const endpoint of endpoints) {
            const res = await safeJson<any>(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const cs = (res.data as any)?.clientSecret || (res.data as any)?.client_secret;
                const checkoutUrl = (res.data as any)?.checkoutUrl;
                if (checkoutUrl) {
                    window.location.href = checkoutUrl as string;
                    return;
                }
                if (cs) {
                    setClientSecret(cs);
                    setStep("pay");
                    setCreatingIntent(false);
                    return;
                }
            }

            if (endpoint === endpoints[endpoints.length - 1]) {
                setToast({ kind: "error", message: (res as ApiErr).message || "Unable to start payment." });
                setCreatingIntent(false);
            }
        }
    };

    // Create PaymentIntent and move to payment step (attach flow)
    const continueToPayment = async () => {
        if (!selectedPlan?.id || !selectedProjectHash) {
            setToast({ kind: "error", message: "Select a project first." });
            return;
        }
        await createIntent(selectedPlan.id, selectedProjectHash);
    };

    // “Buy now” — open modal and go straight to payment (no project)
    const buyNow = async (plan: Plan) => {
        setSelectedPlan(plan);
        setAttachOpen(true);
        setStep("pay");
        await createIntent(plan.id); // no projectHash
    };

    // Finalize after payment: call /finalize-intent to attach the buyer (and optional project)
    const onPaymentSuccess = async (paymentIntentId?: string) => {
        if (!selectedPlan) {
            setToast({ kind: "success", message: "Payment successful." });
            // cleanup anyway
            setAttachOpen(false);
            setSelectedPlan(null);
            setSelectedProjectHash("");
            setClientSecret(null);
            setStep("select");
            return;
        }

        try {
            if (!token) throw new Error("Sign in required.");
            // ---- APPLYING YOUR SNIPPET HERE ----
            const res = await safeJson<any>(`${BE}/plans/${selectedPlan.id}/finalize-intent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    paymentIntentId,
                    projectHash: selectedProjectHash || undefined,
                }),
            });

            if (res.ok) {
                const attached = Boolean(selectedProjectHash);
                setToast({
                    kind: "success",
                    message: attached ? "Payment successful. Plan attached to your project!" : "Payment successful. Plan added to your account.",
                });
            } else {
                setToast({
                    kind: "error",
                    message: res.message || "Payment completed, but we couldn't finalize the plan. Please contact support.",
                });
            }
        } catch (e: any) {
            setToast({ kind: "error", message: e?.message || "Could not finalize the purchase." });
        } finally {
            // Reset UI state
            setAttachOpen(false);
            setSelectedPlan(null);
            setSelectedProjectHash("");
            setClientSecret(null);
            setStep("select");
        }
    };

    // ===== Plan card with package mapping =====
    const PlanCard = ({ plan }: { plan: Plan }) => {
        const slugKey = norm(plan.slug) || norm(plan.name);
        const pkg = PACKAGE_COPY[slugKey];

        const displayName = pkg?.label ?? plan.name ?? "Plan";
        const priceCents = (typeof plan.price === "number" ? plan.price : pkg?.priceCents) ?? null;
        const displayPrice = currency(priceCents);
        const duration = pkg?.duration || (plan.slug ? "—" : undefined);
        const features = pkg?.features?.length
            ? pkg.features
            : ["All-in-one DevOps + hosting", "Task manager + Git versions", "Automated backups & monitoring"];
        const tagline = pkg?.tagline;

        return (
            <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-white p-6 shadow-md">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900">{displayName}</h3>
                        <Pill>{plan.slug || "package"}</Pill>
                    </div>

                    <div className="text-3xl font-extrabold text-gray-900">
                        {displayPrice} {duration && <span className="text-sm font-semibold text-gray-500">/ {duration}</span>}
                    </div>

                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <svg className="mt-0.5 h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414L8.5 14.914l-3.207-3.207a1 1 0 111.414-1.414L8.5 12.086l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {f}
                            </li>
                        ))}
                    </ul>

                    {tagline && <p className="pt-1 text-sm font-medium text-gray-800">{tagline}</p>}
                </div>

                <div className="mt-6 grid gap-2">
                    <button
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                        onClick={() => {
                            setSelectedPlan(plan);
                            setAttachOpen(true);
                            setStep("select");
                            setClientSecret(null);
                        }}
                    >
                        Attach to a project
                    </button>
                    <button
                        className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-800 hover:border-blue-300 hover:text-blue-700"
                        onClick={() => buyNow(plan)}
                    >
                        Buy now (no project yet)
                    </button>
                </div>
            </div>
        );
    };

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
                        to view plans and your projects.
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Toast */}
            <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">{toast && <Toast kind={toast.kind} message={toast.message} />}</div>

            {/* Hero */}
            <section
                className="relative overflow-hidden border-b py-20"
                style={{ background: `linear-gradient(135deg, ${BRAND.darkBlue}, ${BRAND.primary})` }}
            >
                <div className="absolute inset-0 z-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)", backgroundSize: "40px 40px" }}
                    />
                </div>
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="text-4xl font-black text-white md:text-5xl">Choose Your Plan</h1>
                    <p className="mt-3 text-lg" style={{ color: "#CFE6FF" }}>
                        Attach a plan to an existing project — or buy now and attach later.
                    </p>
                </div>
            </section>

            {/* Body */}
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left: Plans */}
                    <div className="lg:col-span-2 space-y-8">
                        <SectionCard title="Available Plans">
                            {loading ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                                    <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                                </div>
                            ) : plans.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2">{plans.map((p) => <PlanCard key={p.id} plan={p} />)}</div>
                            ) : (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">No plans available right now.</div>
                            )}
                        </SectionCard>

                        <SectionCard title="Don’t see your project?">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-gray-600">You can create a new project first, then attach a plan during checkout.</p>
                                <Link
                                    href="/projects/new"
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    Create Project
                                </Link>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right: Your Projects */}
                    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                        <SectionCard title="Your Projects">
                            {loading ? (
                                <div className="space-y-3">
                                    <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                                    <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                                    <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                                </div>
                            ) : projects.length > 0 ? (
                                <ul className="space-y-2">
                                    {projects.map((p) => (
                                        <li key={p.hash} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-bold text-gray-900">{p.name || "Untitled project"}</div>
                                                <div className="truncate text-xs text-gray-500">{p.hash}</div>
                                            </div>
                                            <Link
                                                href={`/projects/${encodeURIComponent(p.hash)}`}
                                                className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700"
                                            >
                                                Open
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">You have no projects yet. Create one to attach a plan.</div>
                            )}
                        </SectionCard>

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
                            <div className="mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold uppercase tracking-wide">Tip</span>
                            </div>
                            You can always buy a plan without selecting a project now, and attach it later from the project page.
                        </div>
                    </aside>
                </div>
            </section>

            {/* Modal (Attach + Payment) */}
            {attachOpen && selectedPlan && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
                        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                            <h3 className="text-lg font-black text-gray-900">
                                {step === "select" ? `Attach “${selectedPlan.name ?? "Plan"}” to a project` : "Payment"}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {step === "select" && (
                                <>
                                    {projects.length > 0 ? (
                                        <>
                                            <label className="block">
                                                <span className="mb-1 block text-sm font-bold text-gray-700">Your projects</span>
                                                <select
                                                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    value={selectedProjectHash}
                                                    onChange={(e) => setSelectedProjectHash(e.target.value)}
                                                >
                                                    <option value="">Select a project…</option>
                                                    {projects.map((p) => (
                                                        <option key={p.hash} value={p.hash}>
                                                            {p.name || p.hash}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-1 text-xs text-gray-500">Only projects you own or contribute to are listed.</p>
                                            </label>

                                            <div className="flex items-center justify-end gap-2 pt-2">
                                                <button
                                                    className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                                                    onClick={() => {
                                                        setAttachOpen(false);
                                                        setSelectedPlan(null);
                                                        setSelectedProjectHash("");
                                                        setStep("select");
                                                        setClientSecret(null);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-5 py-2 text-sm font-black text-white shadow-lg disabled:opacity-50"
                                                    disabled={!selectedProjectHash || creatingIntent}
                                                    onClick={continueToPayment}
                                                >
                                                    {creatingIntent ? "Preparing…" : "Continue to payment"}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                            You don’t have any projects yet. Create one first.
                                        </div>
                                    )}
                                </>
                            )}

                            {step === "pay" && (
                                <>
                                    {!clientSecret || !stripePromise ? (
                                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                            Preparing payment…
                                        </div>
                                    ) : (
                                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                                            <PaymentForm
                                                onSuccess={onPaymentSuccess}
                                                onCancel={() => {
                                                    setStep("select");
                                                    setClientSecret(null);
                                                }}
                                            />
                                        </Elements>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
