"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
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

type Plan = {
    id: number;
    name: string | null;
    slug: string | null;
    stripe_price_id: string | null;
    stripe_product_id: string | null;
    price: number | null; // smallest currency unit
    projects: number[];   // ids only
};

type PlansResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: Plan[];
};

/**
 * Inner component that actually uses useSearchParams.
 * This MUST be rendered inside a <Suspense> boundary.
 */
function AdminPlansListInner() {
    const router = useRouter();
    const qs = useSearchParams();

    // query state (from URL)
    const page = Math.max(1, parseInt(qs.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(qs.get("perPage") || "24", 10)));
    const q = (qs.get("q") || "").trim();
    const includeStripe = (qs.get("includeStripe") || "1") === "1";

    // ui state
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [searchText, setSearchText] = useState(q);

    const token =
        typeof window !== "undefined" ? (localStorage.getItem("auth_token") || "") : "";

    // fetcher
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErrorMsg(null);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        if (q) params.set("q", q);
        if (includeStripe) params.set("includeStripe", "1");

        fetch(`${BE}/plans?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r): Promise<PlansResponse> => {
                if (!alive) {
                    // stop the chain – rejected promise is fine, caller will ignore due to `alive` check
                    return Promise.reject(new Error("aborted"));
                }

                if (!r.ok) {
                    let msg = "Failed to load plans.";
                    try {
                        const j = await r.json();
                        if (typeof j?.message === "string") msg = j.message;
                    } catch {
                        // ignore parse error
                    }
                    throw new Error(msg);
                }

                return r.json() as Promise<PlansResponse>;
            })
            .then((data) => {
                if (!alive || !data) return;
                setPlans(Array.isArray(data.items) ? data.items : []);
                setTotal(Number(data.total || 0));
                setPages(Number(data.pages || 1));
            })
            .catch((e: Error) => {
                if (!alive) return;
                // ignore the "aborted" error
                if (e.message === "aborted") return;
                setErrorMsg(e.message || "Failed to load plans.");
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, q, includeStripe, token]);

    // handlers
    function pushWith(params: Record<string, string | number | undefined>) {
        const curr = new URLSearchParams(qs.toString());
        Object.entries(params).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") curr.delete(k);
            else curr.set(k, String(v));
        });
        router.push(`/admin/plans?${curr.toString()}`);
    }

    function submitSearch(e: React.FormEvent) {
        e.preventDefault();
        pushWith({ q: searchText || undefined, page: 1 });
    }

    function clearSearch() {
        setSearchText("");
        pushWith({ q: undefined, page: 1 });
    }

    async function refreshStripe(planId: number) {
        try {
            const r = await fetch(`${BE}/plans/${planId}/stripe`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!r.ok) throw new Error("Refresh failed");

            // re-fetch list
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("perPage", String(perPage));
            if (q) params.set("q", q);
            if (includeStripe) params.set("includeStripe", "1");
            setLoading(true);
            const resp = await fetch(`${BE}/plans?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = (await resp.json()) as PlansResponse;
            setPlans(Array.isArray(data.items) ? data.items : []);
            setTotal(Number(data.total || 0));
            setPages(Number(data.pages || 1));
        } catch (e) {
            console.error(e);
            setErrorMsg("Stripe refresh failed.");
        } finally {
            setLoading(false);
        }
    }

    function copy(val?: string | null) {
        if (!val) return;
        navigator.clipboard?.writeText(val).catch(() => {});
    }

    const startIdx = (page - 1) * perPage + 1;
    const endIdx = Math.min(total, page * perPage);

    const currencyHint = useMemo(() => {
        return "currency";
    }, []);

    function formatSmallestUnit(x?: number | null) {
        if (x === null || x === undefined) return "—";
        const major = (x / 100).toFixed(2);
        return major;
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <nav className="text-xs text-gray-500">
                    <ol className="flex items-center gap-2">
                        <li>
                            <a href="/admin" className="hover:text-gray-700 hover:underline">
                                Admin
                            </a>
                        </li>
                        <li>›</li>
                        <li className="text-gray-800">Plans</li>
                    </ol>
                </nav>

                <Link
                    href="/admin/plans/create"
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-white shadow"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                >
                    + Create Plan
                </Link>
            </div>

            {/* Hero */}
            <div
                className="relative mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
            >
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{
                            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                            backgroundSize: "36px 36px",
                        }}
                    />
                </div>
                <div className="relative">
                    <h1 className="text-xl font-extrabold md:text-2xl">Plans</h1>
                    <p className="mt-1 text-sm text-blue-100">
                        Browse, search, and manage pricing. One-time price is stored in <code>price</code> (smallest unit).
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

            {/* Controls */}
            <form
                onSubmit={submitSearch}
                className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
                {/* Dark search */}
                <div className="flex w-full max-w-lg items-center rounded-xl border-2 border-slate-700 bg-slate-900 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-slate-600">
                    <svg className="mr-2 h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search by name, slug, or Stripe IDs…"
                        className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
                    />
                    {searchText ? (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
                        >
                            Clear
                        </button>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-gray-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={includeStripe}
                            onChange={(e) => pushWith({ includeStripe: e.target.checked ? "1" : "0", page: 1 })}
                        />
                        Include Stripe info
                    </label>

                    {/* Dark per-page select */}
                    <select
                        className="rounded-xl border-2 border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                        value={perPage}
                        onChange={(e) => pushWith({ perPage: e.target.value, page: 1 })}
                    >
                        {[10, 24, 50, 100].map((n) => (
                            <option key={n} value={n} className="bg-slate-900 text-slate-100">
                                {n}/page
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-white shadow"
                        style={{ background: `linear-gradient(135deg, ${brand.darkBlue}, "#0B1220")` }}
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Summary */}
            <div className="mb-3 text-xs text-gray-600">
                {loading ? "Loading…" : total > 0 ? `Showing ${startIdx}–${endIdx} of ${total}` : "No plans yet."}
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {/* Desktop table */}
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Stripe Price</th>
                            <th className="px-4 py-3">Stripe Product</th>
                            <th className="px-4 py-3">Projects</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-24 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-20 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-14 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-28 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-28 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-4 w-10 rounded bg-gray-100" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="h-8 w-28 rounded bg-gray-100" />
                                    </td>
                                </tr>
                            ))
                        ) : plans.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-6 text-center text-sm text-gray-500"
                                    colSpan={7}
                                >
                                    No plans found.
                                </td>
                            </tr>
                        ) : (
                            plans.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                        {p.name || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{p.slug || "—"}</td>
                                    <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {formatSmallestUnit(p.price)}{" "}
                                                <span className="text-gray-400">({currencyHint})</span>
                                            </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.stripe_price_id ? (
                                            <button
                                                type="button"
                                                onClick={() => copy(p.stripe_price_id)}
                                                title="Copy"
                                                className="group inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                            >
                                                    <span className="truncate max-w-[160px]">
                                                        {p.stripe_price_id}
                                                    </span>
                                                <svg
                                                    className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M9 9h9v12H9z"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                    <path
                                                        d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                </svg>
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.stripe_product_id ? (
                                            <button
                                                type="button"
                                                onClick={() => copy(p.stripe_product_id)}
                                                title="Copy"
                                                className="group inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                            >
                                                    <span className="truncate max-w-[160px]">
                                                        {p.stripe_product_id}
                                                    </span>
                                                <svg
                                                    className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M9 9h9v12H9z"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                    <path
                                                        d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                </svg>
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{p.projects?.length ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/plans/${p.id}`}
                                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                title="Open / edit"
                                            >
                                                Open
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => refreshStripe(p.id)}
                                                className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                title="Refresh Stripe info"
                                            >
                                                Refresh Stripe
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="space-y-3 p-3">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse rounded-xl border border-gray-200 p-3"
                                >
                                    <div className="mb-2 h-4 w-32 rounded bg-gray-100" />
                                    <div className="mb-2 h-3 w-24 rounded bg-gray-100" />
                                    <div className="mb-2 h-3 w-20 rounded bg-gray-100" />
                                    <div className="h-8 w-full rounded bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No plans found.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {plans.map((p) => (
                                <div key={p.id} className="space-y-2 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-gray-900">
                                            {p.name || "—"}
                                        </div>
                                        <Link
                                            href={`/admin/plans/${p.id}`}
                                            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700"
                                        >
                                            Open
                                        </Link>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        /{p.slug || "—"}
                                    </div>
                                    <div className="text-sm">
                                        <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                            {formatSmallestUnit(p.price)}{" "}
                                            <span className="text-gray-400">
                                                ({currencyHint})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Projects:{" "}
                                        <span className="font-semibold text-gray-700">
                                            {p.projects?.length ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {p.stripe_price_id ? (
                                            <button
                                                type="button"
                                                onClick={() => copy(p.stripe_price_id)}
                                                className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                                            >
                                                Copy Price ID
                                            </button>
                                        ) : null}
                                        {p.stripe_product_id ? (
                                            <button
                                                type="button"
                                                onClick={() => copy(p.stripe_product_id)}
                                                className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                                            >
                                                Copy Product ID
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => refreshStripe(p.id)}
                                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                                        >
                                            Refresh Stripe
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
                <div className="text-xs text-gray-600">
                    Page {page} of {pages}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => pushWith({ page: Math.max(1, page - 1) })}
                        disabled={page <= 1}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => pushWith({ page: Math.min(pages, page + 1) })}
                        disabled={page >= pages}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Default export: wraps the search-params-using inner component in Suspense.
 */
export default function AdminPlansListPage() {
    return (
        <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading plans…</div>}>
            <AdminPlansListInner />
        </Suspense>
    );
}
