"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";

// ---------- Types matching /me/projects payload ----------
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;

export type ProjectLite = {
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
    // extras from /me/projects
    isOwner?: boolean;
    isContributor?: boolean;
    status?: "draft" | "pending_review" | "published" | string | null;
};

type MyProjectsResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: ProjectLite[];
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

function shortLocation(loc?: ProjectLite["location"]) {
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

// Stable key
function projectKey(p: ProjectLite, idx: number): string {
    return p.hash ?? (p.image && p.image.hash) ?? (p.title ? `t:${p.title}` : `idx:${idx}`);
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

// Join BACKEND_URL + path safely (keeps absolute URLs as-is)
function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = u.replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}

// ---------- Tiny status helpers ----------
function statusChip(st?: ProjectLite["status"]) {
    const s = (st ?? "").toLowerCase();
    if (s === "published") return { label: "Published", cls: "bg-emerald-100 text-emerald-700" };
    if (s === "pending_review") return { label: "Pending review", cls: "bg-amber-100 text-amber-800" };
    if (s === "draft") return { label: "Draft", cls: "bg-gray-100 text-gray-700" };
    return s ? { label: s, cls: "bg-slate-100 text-slate-700" } : null;
}

// ---------- Fetcher ----------
type FetchMyProjectsOpts = {
    page: number;
    perPage: number;
    includeUnpublished: boolean; // false -> only published, true -> all states
    q?: string;
    sort?: "recent" | "boost";
    signal?: AbortSignal;
};
async function fetchMyProjects(opts: FetchMyProjectsOpts): Promise<MyProjectsResponse> {
    const params = new URLSearchParams();
    params.set("page", String(opts.page));
    params.set("perPage", String(opts.perPage));
    params.set("includeContributed", "1");
    params.set("includeUnpublished", opts.includeUnpublished ? "1" : "0");
    if (opts.q?.trim()) params.set("q", opts.q.trim());
    if (opts.sort) params.set("sort", opts.sort);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me/projects?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json", ...authHeaders() },
        signal: opts.signal,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in to view your projects (401).");
        throw new Error(`Projects fetch failed (${res.status}): ${text || res.statusText}`);
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid projects JSON payload");
    }

    const d = data as Partial<MyProjectsResponse>;
    return {
        page: typeof d.page === "number" ? d.page : 1,
        perPage: typeof d.perPage === "number" ? d.perPage : 24,
        total: typeof d.total === "number" ? d.total : 0,
        pages: typeof d.pages === "number" ? d.pages : 1,
        items: Array.isArray(d.items) ? (d.items as ProjectLite[]) : [],
    };
}

// ---------- Skeleton (list row) ----------
function ListRowSkeleton() {
    return (
        <div className="flex items/stretch gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
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

// ---------- Component (single-column list only) ----------
export default function MyProjectsList({
                                           initialPerPage = 12,
                                           className,
                                           projects,
                                       }: {
    initialPerPage?: number;
    className?: string;
    projects?: ProjectLite[];
}) {
    // ✅ Default to ALL first
    const [tab, setTab] = useState<"published" | "all">("all");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(clamp(initialPerPage, 6, 48));
    const [sort, setSort] = useState<"recent" | "boost">("recent");

    // Track if we're using prop data (dashboard mode) vs self-fetching
    const usingPropData = Boolean(projects);

    // Initialize with prop data if available
    const [data, setData] = useState<MyProjectsResponse | null>(projects ? {
        page: 1,
        perPage: initialPerPage,
        total: projects.length,
        pages: 1,
        items: projects
    } : null);
    
    const [loading, setLoading] = useState(!projects);
    const [err, setErr] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [isPending, startTransition] = useTransition();
    const abortRef = useRef<AbortController | null>(null);

    const includeUnpublished = tab === "all";

    // Client-side filtered items when using prop data
    const filteredItems = useMemo(() => {
        if (!usingPropData || !projects) return data?.items ?? [];
        
        let filtered = [...projects];
        
        // Filter by tab (published vs all)
        if (tab === "published") {
            filtered = filtered.filter(p => (p.status ?? "").toLowerCase() === "published");
        }
        
        // Filter by search query
        if (q.trim()) {
            const query = q.toLowerCase();
            filtered = filtered.filter(p => 
                (p.title ?? "").toLowerCase().includes(query) ||
                (p.tagline ?? "").toLowerCase().includes(query)
            );
        }
        
        // Sort
        if (sort === "boost") {
            filtered.sort((a, b) => {
                if (a.superBoost && !b.superBoost) return -1;
                if (!a.superBoost && b.superBoost) return 1;
                if (a.boost && !b.boost) return -1;
                if (!a.boost && b.boost) return 1;
                return 0;
            });
        }
        // "recent" is default order from backend
        
        return filtered;
    }, [usingPropData, projects, data, tab, q, sort]);

    // Fetcher - only runs when NOT using prop data
    useEffect(() => {
        // Skip fetch entirely if we have projects from props (dashboard mode)
        if (usingPropData) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        // rotate controllers safely
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        (async () => {
            // microtask boundary — avoids synchronous setState in effect body
            await Promise.resolve();

            if (cancelled) return;
            setLoading(true);
            setErr(null);

            try {
                const res = await fetchMyProjects({
                    page,
                    perPage,
                    includeUnpublished,
                    q,
                    sort,
                    signal: ctrl.signal,
                });
                if (!cancelled) setData(res);
            } catch (e) {
                const aborted = e instanceof DOMException && e.name === "AbortError";
                if (!cancelled && !aborted) {
                    setErr(e instanceof Error ? e.message : "Unknown error");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            ctrl.abort();
        };
    }, [page, perPage, includeUnpublished, q, sort, usingPropData]);

    // Use filtered items when using prop data, otherwise use data items
    // In dashboard mode (usingPropData), limit to 12 items but keep total for "View all" button
    const items = useMemo(() => {
        const baseItems = usingPropData ? filteredItems : (data?.items ?? []);
        return usingPropData ? baseItems.slice(0, 12) : baseItems;
    }, [usingPropData, filteredItems, data]);

    const total = usingPropData ? filteredItems.length : (data?.total ?? 0);
    const pages = usingPropData ? 1 : (data?.pages ?? 1);
    const canPrev = page > 1;
    const canNext = page < pages;

    return (
        <section className={classNames("rounded-2xl bg-white p-6 shadow-lg", className)}>
            {/* Header */}
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Title + Tabs grouped together */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Tabs — All first */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
                        <button
                            onClick={() => {
                                setTab("all");
                                setPage(1);
                            }}
                            className={classNames(
                                "rounded-lg px-3.5 py-2 text-sm font-bold outline-none transition",
                                tab === "all" ? "bg-blue-600 text-white shadow" : "text-gray-800 hover:bg-white"
                            )}
                            aria-pressed={tab === "all"}
                        >
                            All states
                        </button>
                        <button
                            onClick={() => {
                                setTab("published");
                                setPage(1);
                            }}
                            className={classNames(
                                "rounded-lg px-3.5 py-2 text-sm font-bold outline-none transition",
                                tab === "published" ? "bg-blue-600 text-white shadow" : "text-gray-800 hover:bg-white"
                            )}
                            aria-pressed={tab === "published"}
                        >
                            Published
                        </button>
                    </div>
                </div>

                {/* Search - only show if NOT in dashboard mode or always show if you prefer */}
                {!usingPropData && (
                    <div className="relative">
                        <input
                            value={q}
                            onChange={(e) => {
                                const v = e.target.value;
                                startTransition(() => {
                                    setQ(v);
                                    setPage(1);
                                });
                            }}
                            placeholder="Search my projects…"
                            className="w-64 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-semibold text-gray-400">
                            ⌘K
                        </span>
                    </div>
                )}

                {/* Sort & Per-page only in standalone mode */}
                {!usingPropData && (
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => {
                                const v = (e.target.value as "recent" | "boost") || "recent";
                                startTransition(() => {
                                    setSort(v);
                                    setPage(1);
                                });
                            }}
                            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            aria-label="Sort"
                        >
                            <option value="recent">Recent</option>
                            <option value="boost">Boosted first</option>
                        </select>

                        <select
                            value={perPage}
                            onChange={(e) => {
                                const v = clamp(parseInt(e.target.value, 10) || 12, 6, 48);
                                startTransition(() => {
                                    setPerPage(v);
                                    setPage(1);
                                });
                            }}
                            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            </div>

            {/* Error banner */}
            {err && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}{" "}
                    <button
                        onClick={() => {
                            // bump state to re-run effect
                            setPage((p) => p);
                        }}
                        className="underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="mt-6">
                {/* Loading */}
                {loading && !data && (
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <ListRowSkeleton key={i} />
                        ))}
                    </>
                )}

                {/* Empty state */}
                {!loading && items.length === 0 && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">📂</div>
                        <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {tab === "published" ? "You don’t have published projects yet." : "You don’t have any projects yet."}
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/dashboard/projects/new"
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                Create a project
                            </Link>
                        </div>
                    </div>
                )}

                {/* LIST (single column) */}
                {!loading && items.length > 0 && (
                    <div className="space-y-4">
                        {items.map((p, idx) => {
                            const img = mediaUrl(p.image?.url || "");
                            const letter = (p.title?.[0] || "P").toUpperCase();
                            const st = statusChip(p.status);
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
                                            {/* Boost badge */}
                                            {(p.superBoost || p.boost) && (
                                                <span className={classNames(
                                                    "absolute left-1 top-1 rounded px-1 py-0.5 text-[8px] font-bold",
                                                    p.superBoost ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
                                                )}>
                                                    {p.superBoost ? "🚀" : "⚡"}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Title + Stage + Status */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <Link
                                                    href={p.hash ? `/projects/${p.hash}` : "#"}
                                                    className="line-clamp-2 text-sm font-bold text-gray-900 hover:underline"
                                                >
                                                    {p.title ?? "Untitled project"}
                                                </Link>
                                                {p.stage && (
                                                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                        {p.stage}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {st && (
                                                    <span className={classNames("rounded-full px-2 py-0.5 text-[10px] font-bold", st.cls)}>
                                                        {st.label}
                                                    </span>
                                                )}
                                                {p.isOwner && (
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Owner</span>
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
                                        <Link
                                            href={p.hash ? `/dashboard/projects/${p.hash}` : "#"}
                                            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer - show "View all" in dashboard mode, or pagination otherwise */}
                {!loading && items.length > 0 && (
                    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                        {usingPropData ? (
                            /* Dashboard mode: show count and View All link */
                            <>
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{Math.min(items.length, 12)}</span> of{" "}
                                    <span className="font-semibold text-gray-900">{total}</span> projects
                                </div>
                                {total > 12 && (
                                    <Link
                                        href="/dashboard/projects"
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                    >
                                        View all projects →
                                    </Link>
                                )}
                            </>
                        ) : (
                            /* Standalone mode: show pagination */
                            <>
                                <div className="text-sm text-gray-600">
                                    Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                                    <span className="font-semibold text-gray-900">{pages}</span> •{" "}
                                    <span className="font-semibold text-gray-900">{total}</span> total
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={!canPrev || isPending}
                                        onClick={() => canPrev && startTransition(() => setPage((p) => Math.max(1, p - 1)))}
                                        className={classNames(
                                            "rounded-xl border px-3 py-2 text-sm",
                                            canPrev ? "border-gray-200 hover:bg-gray-50" : "cursor-not-allowed border-gray-100 text-gray-300"
                                        )}
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        disabled={!canNext || isPending}
                                        onClick={() => canNext && startTransition(() => setPage((p) => p + 1))}
                                        className={classNames(
                                            "rounded-xl border px-3 py-2 text-sm",
                                            canNext ? "border-gray-200 hover:bg-gray-50" : "cursor-not-allowed border-gray-100 text-gray-300"
                                        )}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
