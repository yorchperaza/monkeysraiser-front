// app/(admin)/admin/plans/[id]/page.tsx
"use client";

import React, {
    useEffect,
    useMemo,
    useState,
    Suspense,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";

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

type PlanDetail = {
    id: number;
    name: string | null;
    slug: string | null;
    stripe_price_id: string | null;
    stripe_product_id: string | null;
    price: number | null;   // smallest currency unit
    projects: number[];     // ids only
    // stripe?: any;        // available if includeStripe=1, but not required here
};

/* ========== Inner component using params & search params ========== */
function AdminPlanEditInner() {
    const router = useRouter();
    const qs = useSearchParams();
    const params = useParams();

    // from route
    const id = Number(params?.id ?? 0);

    // URL-configurable options
    const redirectTo = qs.get("redirectTo") || "/admin/plans";
    const compact = qs.get("compact") === "1" || qs.get("compact") === "true";

    // plan + form state
    const [plan, setPlan] = useState<PlanDetail | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    // optional one-time pricing (only used if user changes them)
    const [amount, setAmount] = useState<string>("");     // smallest unit
    const [currency, setCurrency] = useState<string>(""); // e.g. usd, eur, crc
    const [productName, setProductName] = useState<string>("");

    // UX state
    const [autoSlug, setAutoSlug] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const token =
        typeof window !== "undefined" ? (localStorage.getItem("auth_token") || "") : "";

    // slugify helper
    const toSlug = (v: string) =>
        v
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/--+/g, "-");

    // load plan
    useEffect(() => {
        if (!id || Number.isNaN(id)) {
            setErrorMsg("Invalid plan id.");
            setLoadingPlan(false);
            return;
        }

        let alive = true;
        setLoadingPlan(true);
        setErrorMsg(null);

        const url = `${BE}/plans/${id}?includeStripe=1`;

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                if (!alive) return Promise.reject(new Error("aborted"));
                if (!r.ok) {
                    let msg = "Failed to load plan.";
                    try {
                        const j = await r.json();
                        if (typeof j?.message === "string") msg = j.message;
                    } catch {
                        // ignore
                    }
                    throw new Error(msg);
                }
                return r.json() as Promise<PlanDetail>;
            })
            .then((data) => {
                if (!alive || !data) return;
                setPlan(data);
                setName(data.name || "");
                setSlug(data.slug || "");
                setAutoSlug(false); // default to manual after load
                // NOTE: we intentionally leave amount / currency empty
                // so editing name/slug DOES NOT force pricing changes.
            })
            .catch((e: Error) => {
                if (!alive || e.message === "aborted") return;
                setErrorMsg(e.message || "Failed to load plan.");
            })
            .finally(() => {
                if (!alive) return;
                setLoadingPlan(false);
            });

        return () => {
            alive = false;
        };
    }, [id, token]);

    // auto-slug from name if enabled
    useEffect(() => {
        if (!autoSlug) return;
        const base = toSlug(name);
        setSlug(base);
    }, [name, autoSlug]);

    // computed stuff
    const canSubmit = useMemo(() => !!name.trim(), [name]);

    const slugLooksValid =
        slug.trim() === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());

    const willUpdatePricing =
        amount.trim() !== "" || currency.trim() !== "" || productName.trim() !== "";

    const pricingInputsCoherent = useMemo(() => {
        if (!willUpdatePricing) return true; // not editing pricing => ok
        if (!/^\d+$/.test(amount.trim() || "")) return false;
        if (!(currency.trim().length >= 3 && currency.trim().length <= 10)) return false;
        return true;
    }, [willUpdatePricing, amount, currency]);

    function formatSmallestUnit(x?: number | null) {
        if (x === null || x === undefined) return "—";
        return (x / 100).toFixed(2);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!plan) return;

        setErrorMsg(null);
        setSuccessMsg(null);

        const payload: any = {
            name: name.trim() || null,
            slug: slug.trim() || null,
        };

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

        if (willUpdatePricing) {
            if (!pricingInputsCoherent) {
                setErrorMsg(
                    "To update pricing, provide a valid amount (integer, smallest unit) and currency."
                );
                return;
            }
            payload.amount = amount.trim() !== "" ? parseInt(amount.trim(), 10) : null;
            payload.currency = currency.trim().toLowerCase() || null;
            payload.product_name = (productName || name).trim();
        }

        setSaving(true);
        try {
            const res = await fetch(`${BE}/plans/${plan.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // ignore
            }

            if (res.status === 200) {
                setSuccessMsg("Plan updated successfully.");
                if (data && typeof data === "object") {
                    setPlan((prev) => ({
                        ...(prev || ({} as PlanDetail)),
                        ...data,
                    }));
                }
                return;
            }

            const msg =
                (typeof data?.message === "string" && data.message) ||
                (Array.isArray(data?.errors) && data.errors.join(", ")) ||
                "Could not update plan. Please try again.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!plan) return;
        if (
            !window.confirm(
                "Are you sure you want to delete this plan?\n\nThis will also disable its Stripe price/product and remove it from the system."
            )
        ) {
            return;
        }
        setErrorMsg(null);
        setSuccessMsg(null);
        setDeleting(true);
        try {
            const res = await fetch(`${BE}/plans/${plan.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // ignore
            }

            if (res.ok) {
                setSuccessMsg("Plan deleted successfully.");
                // small delay so the user sees feedback
                setTimeout(() => {
                    router.push(redirectTo);
                }, 300);
                return;
            }

            const msg =
                (typeof data?.message === "string" && data.message) ||
                "Could not delete plan. Please try again.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
            {/* Breadcumb + back */}
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
                        <li className="text-gray-800">
                            {loadingPlan ? "Loading…" : `Plan #${plan?.id ?? "?"}`}
                        </li>
                    </ol>
                </nav>

                <a
                    href="/admin/plans"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Back to list
                </a>
            </div>

            {/* Header */}
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
                <div className="relative flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold md:text-2xl">
                            {plan?.name || "Edit Plan"}
                        </h1>
                        <p className="mt-1 text-sm text-blue-100">
                            Update name and slug. Optionally update one-time pricing to create a new
                            Stripe Product & Price. Leaving pricing blank keeps current Stripe setup.
                        </p>
                    </div>
                    {plan ? (
                        <div className="mt-3 rounded-xl bg-black/10 px-4 py-2 text-xs md:mt-0">
                            <div>ID: {plan.id}</div>
                            <div>Slug: {plan.slug || "—"}</div>
                            <div>
                                Current price:{" "}
                                <span className="font-semibold">
                                    {formatSmallestUnit(plan.price)} (smallest unit)
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Alerts */}
            {errorMsg && (
                <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-2">
                        <svg
                            className="h-4 w-4 shrink-0 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
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
                        <svg
                            className="h-4 w-4 shrink-0 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
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

            {loadingPlan && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                    Loading plan…
                </div>
            )}

            {!loadingPlan && !plan && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                    Plan not found.
                </div>
            )}

            {plan && (
                <form onSubmit={handleSubmit} className="relative mt-0">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {/* Left: main sections */}
                        <div className="space-y-5 md:col-span-2">
                            {/* Basics */}
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="mb-4 text-sm font-extrabold text-gray-800">
                                    Basics
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-1 block text-xs font-bold text-gray-700"
                                        >
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
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Shown in admin and pricing UI.
                                        </p>
                                    </div>

                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <label
                                                htmlFor="slug"
                                                className="block text-xs font-bold text-gray-700"
                                            >
                                                Slug
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
                                            <p className="text-gray-500">
                                                Lowercase, numbers and hyphens only.
                                            </p>
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

                            {/* One-time Pricing (optional) */}
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-sm font-extrabold text-gray-800">
                                        One-time Price (optional)
                                    </h2>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            willUpdatePricing
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {willUpdatePricing
                                            ? "Will update Stripe price/product"
                                            : "Keep existing Stripe pricing"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label
                                            htmlFor="amount"
                                            className="mb-1 block text-[11px] font-bold text-gray-700"
                                        >
                                            New Amount (smallest unit)
                                        </label>
                                        <input
                                            id="amount"
                                            inputMode="numeric"
                                            value={amount}
                                            onChange={(e) =>
                                                setAmount(e.target.value.replace(/[^0-9]/g, ""))
                                            }
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="Leave blank to keep current price"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="currency"
                                            className="mb-1 block text-[11px] font-bold text-gray-700"
                                        >
                                            New Currency (ISO)
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
                                        <label
                                            htmlFor="productName"
                                            className="mb-1 block text-[11px] font-bold text-gray-700"
                                        >
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
                                    Leave all fields empty to keep the existing Stripe Product & Price.
                                    If you provide a new amount and currency, the server will create a
                                    new one-time Stripe Product & Price and update this plan.
                                </p>
                            </section>
                        </div>

                        {/* Right: helper & danger zone */}
                        <aside className="space-y-5">
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-extrabold text-gray-800">Summary</h3>
                                <div className="mt-3 space-y-2 text-[12px] text-gray-600">
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <div className="text-gray-500">Current price</div>
                                        <div className="font-semibold text-gray-800">
                                            {formatSmallestUnit(plan.price)} (smallest unit)
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <div className="text-gray-500">Stripe Price ID</div>
                                        <div className="truncate text-[11px] text-gray-800">
                                            {plan.stripe_price_id || "—"}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <div className="text-gray-500">Stripe Product ID</div>
                                        <div className="truncate text-[11px] text-gray-800">
                                            {plan.stripe_product_id || "—"}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Danger zone */}
                            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                                <h3 className="text-sm font-extrabold text-red-800">
                                    Danger Zone
                                </h3>
                                <p className="mt-2 text-[12px] text-red-700">
                                    Deleting this plan will mark its Stripe Price & Product as inactive
                                    (best-effort) and remove it from your system.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? "Deleting…" : "Delete Plan"}
                                </button>
                            </section>
                        </aside>
                    </div>

                    {/* Sticky action bar */}
                    <div className="pointer-events-none sticky bottom-3 mt-6">
                        <div className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur">
                            <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
                                <div className="text-[12px] text-gray-600">
                                    {name ? (
                                        <>
                                            Editing plan{" "}
                                            <span className="font-semibold text-gray-800">
                                                “{name}”
                                            </span>
                                            {willUpdatePricing && pricingInputsCoherent ? (
                                                <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                    + Update Stripe price
                                                </span>
                                            ) : null}
                                        </>
                                    ) : (
                                        "Update the basics and optionally pricing."
                                    )}
                                </div>
                                <div className="flex w-full gap-2 md:w-auto">
                                    <Link
                                        href="/admin/plans"
                                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 md:flex-none"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || saving}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
                                        style={{
                                            background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                        }}
                                    >
                                        {saving ? (
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
                                                <span>Saving…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Save Changes</span>
                                                <span className="transition-transform">💾</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}

/* ========== Default export: wrap in Suspense ========== */
export default function AdminPlanEditPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                    Loading plan editor…
                </div>
            }
        >
            <AdminPlanEditInner />
        </Suspense>
    );
}
