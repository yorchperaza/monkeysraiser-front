"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type InvestorListItem = {
    id: string;
    fundName: string;
    firmType: string | null;
    checkSizeMin: number | null;
    checkSizeMax: number | null;
    logo: { url: string } | null;
};

function getToken(): string {
    try {
        return localStorage.getItem("auth_token") || "";
    } catch {
        return "";
    }
}

function authHeaders(): HeadersInit {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

const mediaUrl = (u?: string | null) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `${BE}/${String(u).replace(/^\/+/, "")}`;
};

const currency = (n: number | null | undefined) =>
    n == null ? "" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function AdminInvestorsListPage() {
    const [investors, setInvestors] = useState<InvestorListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const limit = 20;

    useEffect(() => {
        const ctrl = new AbortController();

        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(limit));
                if (search) params.set("name", search);

                const res = await fetch(`${BE}/open-vc-investors?${params}`, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                setInvestors(data.data || []);
                setTotal(data.total || 0);
            } catch (e: any) {
                if (e.name !== "AbortError") {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => ctrl.abort();
    }, [page, search]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Investors</h1>
                        <p className="text-gray-500">
                            {total.toLocaleString()} investors in database
                        </p>
                    </div>
                    <Link
                        href="/admin/investors/new"
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition"
                    >
                        + Add Investor
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search investors..."
                        className="w-full max-w-md rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 transition"
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                )}

                {/* List */}
                {!loading && investors.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Investor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Firm Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Check Size
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {investors.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {inv.logo?.url ? (
                                                    <img
                                                        src={mediaUrl(inv.logo.url)}
                                                        alt=""
                                                        className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        🏢
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-900">{inv.fundName}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{inv.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {inv.firmType || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {inv.checkSizeMin || inv.checkSizeMax
                                                ? `${currency(inv.checkSizeMin)} - ${currency(inv.checkSizeMax)}`
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/investors/${inv.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                                            >
                                                Edit →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty */}
                {!loading && investors.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                        <p className="text-lg font-bold text-gray-700">No investors found</p>
                        <p className="text-gray-500">Try a different search term</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Prev
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
