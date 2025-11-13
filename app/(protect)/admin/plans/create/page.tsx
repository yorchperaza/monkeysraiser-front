"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

/* ========== Inner component that uses useSearchParams ========== */
function AdminPlanCreateInner() {
    const router = useRouter();
    const qs = useSearchParams();

    // URL-configurable options
    const redirectTo = qs.get("redirectTo") || "/admin/plans";
    const slugPrefix = qs.get("slugPrefix") || "";
    const compact = qs.get("compact") === "1" || qs.get("compact") === "true";

    // --- form state ---
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    // One-time pricing (optional)
    const [amount, setAmount] = useState<string>("");     // smallest unit (e.g., 9900 = $99.00)
    const [currency, setCurrency] = useState<string>(""); // e.g., usd, eur, crc
    const [productName, setProductName] = useState<string>("");

    // --- UX state ---
    const [autoSlug, setAutoSlug] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // hydrate from query for convenience
    useEffect(() => {
        const presetName = qs.get("name");
        const presetSlug = qs.get("slug");
        const qAmount = qs.get("amount");
        const qCurrency = qs.get("currency");
        const qProductName = qs.get("product_name");

        if (presetName) setName(presetName);
        if (presetSlug) {
            setSlug(presetSlug);
            setAutoSlug(false);
        }
        if (qAmount) setAmount(qAmount);
        if (qCurrency) setCurrency(qCurrency);
        if (qProductName) setProductName(qProductName);
    }, [qs]);

    // slugify helper
    const toSlug = (v: string) =>
        v
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/--+/g, "-");

    // auto-slug
    useEffect(() => {
        if (!autoSlug) return;
        const base = toSlug(name);
        setSlug((slugPrefix + base).replace(/--+/g, "-").replace(/^-+|-+$/g, ""));
    }, [name, slugPrefix, autoSlug]);

    // basic allow-submit rule
    const canSubmit = useMemo(() => !!name.trim(), [name]);

    const slugLooksValid =
        slug.trim() === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());

    const willCreateStripeFromPricing =
        amount.trim() !== "" || currency.trim() !== "" || productName.trim() !== "";

    const pricingInputsCoherent = useMemo(() => {
        if (!willCreateStripeFromPricing) return true; // not creating => ok
        if (!/^\d+$/.test(amount.trim() || "")) return false;
        if (!(currency.trim().length >= 3 && currency.trim().length <= 10)) return false;
        return true;
    }, [willCreateStripeFromPricing, amount, currency]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const payload: any = {
            name: name.trim() || null,
            slug: slug.trim() || null,
        };

        if (willCreateStripeFromPricing) {
            payload.amount = amount.trim() !== "" ? parseInt(amount.trim(), 10) : null;
            payload.currency = currency.trim().toLowerCase() || null;
            payload.product_name = (productName || name).trim();
        }

        // client-side checks
        if (!payload.name) {
            setErrorMsg("Please enter a plan name.");
            return;
        }
        if (!slugLooksValid) {
            setErrorMsg(
                "Slug can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)."
            );
            return;
        }
        if (willCreateStripeFromPricing && !pricingInputsCoherent) {
            setErrorMsg(
                "To create Stripe IDs, provide a valid amount (integer, smallest unit) and currency."
            );
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("auth_token") || "";
        try {
            const res = await fetch(`${BE}/plans`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {}

            if (res.status === 201) {
                setSuccessMsg("Plan created successfully.");
                setTimeout(() => router.push(redirectTo), 300);
                return;
            }

            const msg =
                (typeof data?.message === "string" && data.message) ||
                (Array.isArray(data?.errors) && data.errors.join(", ")) ||
                "Could not create plan. Please try again.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
            {/* Top bar / breadcrumb */}
            <div className="mb-4 flex items-center justify-between">
                <nav className="text-xs text-gray-500">
                    <ol className="flex items-center gap-2">
                        <li>
                            <a href="/admin" className="hover:text-gray-700 hover:underline">
                                Admin
                            </a>
                        </li>
                        <li>›</li>
                        <li>
                            <a href="/admin/plans" className="hover:text-gray-700 hover:underline">
                                Plans
                            </a>
                        </li>
                        <li>›</li>
                        <li className="text-gray-800">Create</li>
                    </ol>
                </nav>

                <a
                    href="/admin/plans"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Back to list
                </a>
            </div>

            {/* Page header */}
            <div
                className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                style={{
                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                    padding: compact ? "16px" : "24px",
                }}
            >
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                            backgroundSize: "36px 36px",
                        }}
                    />
                </div>
                <div className="relative">
                    <h1 className="text-xl font-extrabold md:text-2xl">Create Plan</h1>
                    <p className="mt-1 text-sm text-blue-100">
                        Define a plan. If you provide one-time price info, the server creates
                        the Stripe Product & Price and returns their IDs.
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {errorMsg && (
                <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-2">
                        <svg className="h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-xs font-medium text-red-800">{errorMsg}</p>
                    </div>
                </div>
            )}
            {successMsg && (
                <div className="mb-4 rounded-xl border-2 border-green-200 bg-green-50 p-3">
                    <div className="flex items-start gap-2">
                        <svg className="h-4 w-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a1 1 0 00-1.414-1.414L9 10.828 7.557 9.385a1 1 0 00-1.414 1.414L9 13.657l4.857-4.466z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-xs font-medium text-green-800">{successMsg}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Left: main sections */}
                    <div className="space-y-5 md:col-span-2">
                        {/* Basics */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-sm font-extrabold text-gray-800">Basics</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="mb-1 block text-xs font-bold text-gray-700">
                                        Name *
                                    </label>
                                    <input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="Pro / Business / Enterprise"
                                        autoFocus
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500">Shown in admin and pricing UI.</p>
                                </div>

                                <div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <label htmlFor="slug" className="block text-xs font-bold text-gray-700">
                                            Slug (optional)
                                        </label>
                                        <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-gray-600">
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={autoSlug}
                                                onChange={(e) => setAutoSlug(e.target.checked)}
                                            />
                                            Auto from name
                                        </label>
                                    </div>
                                    <input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(toSlug(e.target.value));
                                            setAutoSlug(false);
                                        }}
                                        className={`w-full rounded-xl border-2 px-3 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-4 ${
                                            slugLooksValid
                                                ? "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                                : "border-red-300 focus:border-red-500 focus:ring-red-100"
                                        }`}
                                        placeholder="pro, business, enterprise"
                                    />
                                    <div className="mt-1 flex items-center justify-between text-[11px]">
                                        <p className="text-gray-500">Lowercase, numbers and hyphens only.</p>
                                        <p className="text-gray-400">
                                            Preview:{" "}
                                            <span className="font-semibold text-gray-600">
                                                /pricing/{slug || "your-slug"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* One-time Pricing */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-extrabold text-gray-800">One-time Price (optional)</h2>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        willCreateStripeFromPricing
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                    {willCreateStripeFromPricing ? "Stripe IDs will be created" : "No Stripe linkage"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label htmlFor="amount" className="mb-1 block text-[11px] font-bold text-gray-700">
                                        Amount (smallest unit)
                                    </label>
                                    <input
                                        id="amount"
                                        inputMode="numeric"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="e.g., 9900 (for $99.00)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="currency" className="mb-1 block text-[11px] font-bold text-gray-700">
                                        Currency (ISO)
                                    </label>
                                    <input
                                        id="currency"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value.trim())}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="usd, eur, crc"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="productName" className="mb-1 block text-[11px] font-bold text-gray-700">
                                        Product Name (optional)
                                    </label>
                                    <input
                                        id="productName"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="Defaults to plan name"
                                    />
                                </div>
                            </div>

                            <p className="mt-3 text-[11px] text-gray-600">
                                Leave these blank to create the plan without Stripe linkage. Provide amount & currency
                                to have the server create a one-time Product & Price and return their IDs.
                            </p>
                        </section>
                    </div>

                    {/* Right: helper panel */}
                    <aside className="space-y-5">
                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-extrabold text-gray-800">Tips</h3>
                            <ul className="mt-3 list-disc space-y-2 pl-4 text-[12px] text-gray-600">
                                <li>Keep names short and clear (e.g., “Pro”, “Business”).</li>
                                <li>Slugs should be stable; avoid changing them after launch.</li>
                                <li>Stripe IDs are generated by the server from pricing; no manual entry.</li>
                            </ul>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-extrabold text-gray-800">Status</h3>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-gray-500">Slug</div>
                                    <div className="truncate font-semibold text-gray-800">
                                        {slug || "—"}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-gray-500">Auto-slug</div>
                                    <div className="font-semibold text-gray-800">
                                        {autoSlug ? "On" : "Off"}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="text-gray-500">Stripe Linkage</div>
                                    <div className="font-semibold text-gray-800">
                                        {willCreateStripeFromPricing ? "Will be created" : "None"}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                {/* Sticky action bar */}
                <div className="pointer-events-none sticky bottom-3 mt-6">
                    <div className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white/90 p-3 backdrop-blur shadow-lg">
                        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
                            <div className="text-[12px] text-gray-600">
                                {name ? (
                                    <>
                                        Creating plan{" "}
                                        <span className="font-semibold text-gray-800">“{name}”</span>
                                        {willCreateStripeFromPricing && pricingInputsCoherent ? (
                                            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                + Stripe IDs
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    "Fill the basics to create a plan."
                                )}
                            </div>
                            <div className="flex w-full gap-2 md:w-auto">
                                <a
                                    href="/admin/plans"
                                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 md:flex-none"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={!canSubmit || loading}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
                                    style={{
                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 animate-spin text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a 8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                                                />
                                            </svg>
                                            <span>Creating…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Plan</span>
                                            <span className="transition-transform">✨</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* ========== Default export: wrap in Suspense ========== */
export default function AdminPlanCreate() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                    Loading plan creator…
                </div>
            }
        >
            <AdminPlanCreateInner />
        </Suspense>
    );
}
