"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// =============== Types ===============
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type UserLite = { id: number; fullName?: string | null; email?: string | null; picture?: MediaLite } | null;

type ConversationLite = {
    id: number;
    hash: string;
    subject: string | null;
    project?: { id: number | null; hash: string | null; name: string | null } | null;
    lastMessagePreview?: string | null;
    lastMessage?: {
        id: number;
        subject: string | null;
        message: string | null;
        author: UserLite;
        createdAt?: string | null;
    } | null;
    participants?: UserLite[];
    createdAt?: string | null;
    updatedAt?: string | null;
};

type ConversationsListResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: ConversationLite[];
};

// =============== Brand/Helpers ===============
const brand = {
    lightBlue: "#EBF5FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
} as const;

function getToken(): string {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}
function authHeaders(): HeadersInit {
    const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
}
function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = (u || "").replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}
function cls(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(" "); }
function timeAgo(s?: string | null) {
    if (!s) return "";
    const d = new Date(s); const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    const m = Math.floor(diff / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

// =============== Data ===============
async function fetchConversations(params: {
    projectHash: string;
    page?: number;
    perPage?: number;
    q?: string;
    signal?: AbortSignal;
}): Promise<ConversationsListResponse> {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.perPage) sp.set("perPage", String(params.perPage));
    if (params.q?.trim()) sp.set("q", params.q.trim());

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(params.projectHash)}/conversations?${sp.toString()}`,
        { method: "GET", headers: { Accept: "application/json", ...authHeaders() }, signal: params.signal }
    );
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in to view conversations (401).");
        throw new Error(`Conversations fetch failed (${res.status}): ${t || res.statusText}`);
    }
    const j = (await res.json()) as Partial<ConversationsListResponse>;
    return {
        page: typeof j.page === "number" ? j.page : 1,
        perPage: typeof j.perPage === "number" ? j.perPage : 20,
        total: typeof j.total === "number" ? j.total : 0,
        pages: typeof j.pages === "number" ? j.pages : 1,
        items: Array.isArray(j.items) ? (j.items as ConversationLite[]) : [],
    };
}

// =============== UI ===============
function Avatar({ user }: { user: UserLite }) {
    const url = mediaUrl(user?.picture?.url ?? null);
    return (
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white">
            {url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={user?.fullName || "User"} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
        </div>
    );
}

function ConversationCard({ c }: { c: ConversationLite }) {
    const preview = c.lastMessagePreview || c.lastMessage?.message || c.lastMessage?.subject || "";
    const authoredAt = c.lastMessage?.createdAt || c.updatedAt || c.createdAt || null;

    return (
        <Link
            href={`/dashboard/messages/${c.hash}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start gap-3">
                <div className="flex -space-x-2">
                    {(c.participants || []).slice(0, 3).map((u, i) => <Avatar key={String(u?.id)+":"+i} user={u} />)}
                    {(c.participants || []).length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 ring-2 ring-white">
                            +{(c.participants || []).length - 3}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-black text-gray-900">{c.subject || "Untitled conversation"}</div>
                        <div className="whitespace-nowrap text-xs text-gray-500">{timeAgo(authoredAt)}</div>
                    </div>
                    {preview && <div className="mt-1 line-clamp-2 text-xs text-gray-600">{preview}</div>}
                    {c.project?.name && (
                        <div className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {c.project.name}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// =============== Page ===============
export default function ProjectConversationsPage() {
    const params = useParams();
    const projectHash = String(params?.hash || "");

    const [typedQ, setTypedQ] = useState("");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const perPage = 20;

    const [items, setItems] = useState<ConversationLite[]>([]);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const hasMore = page < pages;

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setQ(typedQ.trim()), 350);
        return () => clearTimeout(t);
    }, [typedQ]);

    // Load first page on hash/q change
    useEffect(() => {
        if (!projectHash) return;
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setInitialLoading(true);
        setErr(null);
        setItems([]);
        setPage(1);
        setPages(1);
        setTotal(0);

        fetchConversations({ projectHash, page: 1, perPage, q, signal: ctrl.signal })
            .then((d) => {
                setItems(d.items || []);
                setPages(d.pages || 1);
                setTotal(d.total || 0);
            })
            .catch((e) => { if ((e as any)?.name !== "AbortError") setErr(e instanceof Error ? e.message : "Unknown error"); })
            .finally(() => setInitialLoading(false));

        return () => ctrl.abort();
    }, [projectHash, q]);

    // Infinite scroll
    useEffect(() => {
        if (!sentinelRef.current) return;
        const el = sentinelRef.current;
        const io = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first?.isIntersecting && !loadingMore && hasMore) {
                setLoadingMore(true);
                const next = page + 1;
                const ctrl = new AbortController();
                abortRef.current = ctrl;

                fetchConversations({ projectHash, page: next, perPage, q, signal: ctrl.signal })
                    .then((d) => {
                        setItems((prev) => {
                            const seen = new Set(prev.map((x) => x.id));
                            const merged = [...prev];
                            for (const it of d.items || []) if (!seen.has(it.id)) merged.push(it);
                            return merged;
                        });
                        setPage(d.page || next);
                        setPages(d.pages || pages);
                    })
                    .catch((e) => { if ((e as any)?.name !== "AbortError") setErr(e instanceof Error ? e.message : "Unknown error"); })
                    .finally(() => setLoadingMore(false));
            }
        }, { rootMargin: "600px 0px 600px 0px" });

        io.observe(el);
        return () => io.disconnect();
    }, [projectHash, page, pages, hasMore, loadingMore, q]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Conversations</h1>
                            <p className="mt-1 text-sm text-gray-600">Project <span className="font-mono text-xs text-gray-900">{projectHash || "—"}</span></p>
                        </div>
                        <Link
                            href={projectHash ? `/projects/${projectHash}` : "/projects"}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                        >
                            ← Back to Project
                        </Link>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                        <div className="relative flex-1">
                            <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={typedQ}
                                onChange={(e) => setTypedQ(e.target.value)}
                                placeholder="Search conversations…"
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                        <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-900 ring-1 ring-blue-100">
                            {total} {total === 1 ? "conversation" : "conversations"}
                        </div>
                    </div>
                </div>

                {/* List */}
                {err && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
                )}
                {initialLoading && items.length === 0 && (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />)}
                    </div>
                )}
                {!initialLoading && items.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">💬</div>
                        <h3 className="text-lg font-black text-gray-900">No conversations yet</h3>
                        <p className="mt-2 text-sm text-gray-600">Create the first one from the project details page.</p>
                    </div>
                )}
                {items.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {items.map((c) => <ConversationCard key={c.id} c={c} />)}
                    </div>
                )}

                <div ref={sentinelRef} className="mt-8 flex items-center justify-center pb-12">
                    {loadingMore && <div className="text-sm text-gray-600">Loading more…</div>}
                    {!loadingMore && !hasMore && items.length > 0 && (
                        <div className="text-xs text-gray-500">All conversations loaded</div>
                    )}
                </div>
            </section>
        </div>
    );
}
