"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";

// ---------- Types ----------
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;

export type FavoriteProject = {
    hash: string | null;
    title: string | null;
    tagline?: string | null;
    categories?: string[] | null;
    founded?: string | null; // 'YYYY-MM-DD'
    stage?: string | null;
    foundingTarget?: number | null;
    capitalSought?: number | null;
    location?: { country?: string; state?: string; city?: string; iso2?: string } | string | null;
    image?: MediaLite;
    boost?: boolean;
    superBoost?: boolean;
    favorited?: boolean;
};

type FavoritesResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: FavoriteProject[];
};

// ---------- Utilities ----------
const brand = {
    primary: "#0066CC",
    darkBlue: "#003D7A",
} as const;

const currency0 = (n?: number | null) =>
    typeof n === "number"
        ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
        : "—";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function shortLocation(loc?: FavoriteProject["location"]) {
    if (!loc) return "—";
    if (typeof loc === "string") return loc;
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    if (parts.length) return parts.join(", ");
    if (loc.iso2) return loc.iso2;
    return "—";
}

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

// ---------- Auth helpers ----------
function getToken(): string {
    try {
        return localStorage.getItem("auth_token") || "";
    } catch {
        return "";
    }
}
function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Join BACKEND_URL + path safely
function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = u.replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}

// Stable key generator
function projectKey(p: FavoriteProject, idx: number): string {
    return p.hash ?? (p.image && p.image.hash) ?? (p.title ? `t:${p.title}` : `idx:${idx}`);
}

// ---------- Fetchers ----------
async function fetchFavorites(opts: {
    page: number;
    perPage: number;
    includeUnpublished?: boolean;
    signal?: AbortSignal;
}): Promise<FavoritesResponse> {
    const params = new URLSearchParams();
    params.set("page", String(opts.page));
    params.set("perPage", String(opts.perPage));
    if (opts.includeUnpublished) params.set("includeUnpublished", "1");

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me/favorites?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json", ...authHeaders() },
        signal: opts.signal,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in to view your favorites (401).");
        throw new Error(`Favorites fetch failed (${res.status}): ${text || res.statusText}`);
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid favorites JSON payload");
    }

    const d = data as Partial<FavoritesResponse>;
    return {
        page: typeof d.page === "number" ? d.page : 1,
        perPage: typeof d.perPage === "number" ? d.perPage : 24,
        total: typeof d.total === "number" ? d.total : 0,
        pages: typeof d.pages === "number" ? d.pages : 1,
        items: Array.isArray(d.items) ? (d.items as FavoriteProject[]) : [],
    };
}

async function unfavoriteByHash(hash: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(hash)}/favorite`, {
        method: "DELETE",
        headers: { Accept: "application/json", ...authHeaders() },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Unfavorite failed (${res.status}): ${text || res.statusText}`);
    }
}

// ---------- Skeleton for list row ----------
function ListRowSkeleton() {
    return (
        <div className="flex items-stretch gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
            <div className="h-24 w-40 shrink-0 rounded-xl bg-gray-200" />
            <div className="min-w-0 flex-1">
                <div className="h-4 w-3/5 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                <div className="mt-3 flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-100" />
                    <div className="h-5 w-20 rounded-full bg-gray-100" />
                </div>
            </div>
            <div className="flex w-36 flex-col items-end justify-between">
                <div className="h-5 w-20 rounded bg-gray-100" />
                <div className="h-9 w-24 rounded-lg bg-gray-100" />
            </div>
        </div>
    );
}

// ---------- Main Component (single-column list only) ----------
export default function FavoritesList({
                                          initialPerPage = 12,
                                          className,
                                          favorites,
                                      }: {
    initialPerPage?: number;
    className?: string;
    favorites?: FavoriteProject[];
}) {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(clamp(initialPerPage, 6, 48));
    
    // Track if we're using prop data (dashboard mode) vs self-fetching
    const usingPropData = Boolean(favorites);

    const [data, setData] = useState<FavoritesResponse | null>(favorites ? {
        page: 1,
        perPage: initialPerPage,
        total: favorites.length,
        pages: 1,
        items: favorites
    } : null);
    const [loading, setLoading] = useState(!favorites);
    const [err, setErr] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [isPending, startTransition] = useTransition();
    const abortRef = useRef<AbortController | null>(null);

    // Fetcher - only when NOT using prop data
    useEffect(() => {
        if (usingPropData) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setErr(null);
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        fetchFavorites({ page, perPage, signal: ctrl.signal })
            .then((res) => setData(res))
            .catch((e) => {
                if ((e as { name?: string })?.name !== "AbortError") setErr(e instanceof Error ? e.message : "Unknown error");
            })
            .finally(() => setLoading(false));

        return () => ctrl.abort();
    }, [page, perPage, usingPropData]);

    // Client-side search filter
    const filtered = useMemo(() => {
        const items = usingPropData ? (favorites ?? []) : (data?.items ?? []);
        const needle = q.trim().toLowerCase();
        if (!needle) return items;
        return items.filter((it) => {
            const hay = [
                it.title ?? "",
                it.tagline ?? "",
                (Array.isArray(it.categories) ? it.categories.join(" ") : "") ?? "",
                typeof it.location === "string" ? it.location : shortLocation(it.location),
                it.stage ?? "",
            ]
                .join(" ")
                .toLowerCase();
            return hay.includes(needle);
        });
    }, [data, favorites, usingPropData, q]);
    
    // Limit to 6 items in dashboard mode
    const displayItems = useMemo(() => {
        return usingPropData ? filtered.slice(0, 6) : filtered;
    }, [filtered, usingPropData]);

    const total = usingPropData ? filtered.length : (data?.total ?? 0);
    const pages = data?.pages ?? 1;

    // Optimistic Unfavorite
    const handleUnfavorite = async (hash?: string | null) => {
        if (!hash) return;
        const prev = data;
        setData((d) => (d ? { ...d, items: d.items.filter((x) => x.hash !== hash), total: Math.max(0, d.total - 1) } : d));
        try {
            await unfavoriteByHash(hash);
        } catch (e) {
            setData(prev ?? null);
            alert(e instanceof Error ? e.message : "Unfavorite failed");
        }
    };

    const canPrev = page > 1;
    const canNext = page < pages;

    // ---------- UI ----------
    return (
        <section className={classNames("rounded-2xl bg-white p-5 shadow-lg", className)}>
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-lg font-black text-gray-900">Favorites</h2>
                <p className="text-xs text-gray-600">Your saved projects</p>
            </div>

            {/* Controls - only show in standalone mode */}
            {!usingPropData && (
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search favorites…"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="pointer-events-none absolute right-3 top-2.5 text-[10px] font-semibold text-gray-400">⌘K</span>
                    </div>

                    <select
                        value={perPage}
                        onChange={(e) => {
                            const v = clamp(parseInt(e.target.value, 10) || 12, 6, 48);
                            startTransition(() => {
                                setPerPage(v);
                                setPage(1);
                            });
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Per page"
                    >
                        {[6, 12, 24, 36, 48].map((n) => (
                            <option key={n} value={n}>
                                {n} / page
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Error banner */}
            {err && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {err}{" "}
                    <button onClick={() => setPage((p) => p)} className="underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="space-y-3">
                {/* Loading */}
                {loading && !data && (
                    <>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <ListRowSkeleton key={i} />
                        ))}
                    </>
                )}

                {/* Empty */}
                {!loading && displayItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">⭐</div>
                        <h3 className="text-sm font-bold text-gray-900">No favorites yet</h3>
                        <p className="mt-1 text-xs text-gray-600">Browse projects and save your picks.</p>
                        <div className="mt-3">
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow transition hover:shadow-md"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                Browse projects
                            </Link>
                        </div>
                    </div>
                )}

                {/* LIST - Mobile-friendly card layout */}
                {!loading && displayItems.length > 0 && (
                    <div className="space-y-3">
                        {displayItems.map((p, idx) => {
                            const img = mediaUrl(p.image?.url || "");
                            const letter = (p.title?.[0] || "P").toUpperCase();
                            const target = currency0(p.foundingTarget ?? p.capitalSought);
                            return (
                                <div
                                    key={projectKey(p, idx)}
                                    className="group rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                                >
                                    {/* Top row: Image + Title + Stage */}
                                    <div className="flex gap-3">
                                        {/* Thumbnail */}
                                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                            {img ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={img}
                                                    alt={p.title ?? "Project"}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xl font-black text-gray-300">
                                                    {letter}
                                                </div>
                                            )}
                                            {(p.superBoost || p.boost) && (
                                                <span className={classNames(
                                                    "absolute left-1 top-1 rounded px-1 py-0.5 text-[8px] font-bold",
                                                    p.superBoost ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
                                                )}>
                                                    {p.superBoost ? "🚀" : "⚡"}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Title + Stage */}
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={p.hash ? `/projects/${p.hash}` : "#"}
                                                className="line-clamp-2 text-sm font-bold text-gray-900 hover:underline"
                                            >
                                                {p.title ?? "Untitled project"}
                                            </Link>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {p.stage && (
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                        {p.stage}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-500">
                                                    📍 {shortLocation(p.location)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Middle: Categories + Target */}
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                        {Array.isArray(p.categories) &&
                                            p.categories.slice(0, 2).map((c) => (
                                                <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                                    {c}
                                                </span>
                                            ))}
                                        {Array.isArray(p.categories) && p.categories.length > 2 && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                                +{p.categories.length - 2}
                                            </span>
                                        )}
                                        <span className="ml-auto text-xs font-bold text-gray-900">{target}</span>
                                    </div>
                                    
                                    {/* Bottom: Actions */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <Link
                                            href={p.hash ? `/projects/${p.hash}` : "#"}
                                            className="flex-1 rounded-lg py-2 text-center text-xs font-bold text-white"
                                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleUnfavorite(p.hash ?? "")}
                                            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer - View all link in dashboard mode, pagination otherwise */}
                {!loading && displayItems.length > 0 && (
                    <div className="mt-4">
                        {usingPropData ? (
                            /* Dashboard mode: show "View all" if more than 6 */
                            total > 6 && (
                                <div className="text-center">
                                    <Link
                                        href="/dashboard/favorites"
                                        className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                                    >
                                        View all {total} favorites →
                                    </Link>
                                </div>
                            )
                        ) : (
                            /* Standalone mode: pagination */
                            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                                <div className="text-xs text-gray-600">
                                    Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                                    <span className="font-semibold text-gray-900">{pages}</span> •{" "}
                                    <span className="font-semibold text-gray-900">{total}</span> total
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={!canPrev || isPending}
                                        onClick={() => canPrev && startTransition(() => setPage((p) => Math.max(1, p - 1)))}
                                        className={classNames(
                                            "rounded-lg border px-3 py-1.5 text-xs",
                                            canPrev ? "border-gray-200 hover:bg-gray-50" : "cursor-not-allowed border-gray-100 text-gray-300"
                                        )}
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        disabled={!canNext || isPending}
                                        onClick={() => canNext && startTransition(() => setPage((p) => p + 1))}
                                        className={classNames(
                                            "rounded-lg border px-3 py-1.5 text-xs",
                                            canNext ? "border-gray-200 hover:bg-gray-50" : "cursor-not-allowed border-gray-100 text-gray-300"
                                        )}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
