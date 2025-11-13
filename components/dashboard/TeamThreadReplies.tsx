"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ================== Config & helpers ================== */
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

function getToken(): string {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}
function authHeaders(): HeadersInit {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}
function isAbortError(err: unknown): boolean {
    if (err instanceof DOMException) return err.name === "AbortError";
    return !!(typeof err === "object" && err && "name" in err && (err as any).name === "AbortError");
}
const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
};

const uniqBy = <T, K extends string | number>(arr: T[], key: (x: T) => K) => {
    const seen = new Set<K>(); const out: T[] = [];
    for (const it of arr) { const k = key(it); if (!seen.has(k)) { seen.add(k); out.push(it); } }
    return out;
};

const INPUT = "rounded-xl border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-600 bg-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20";
const INPUT_AREA = "rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-600 bg-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20";

// preview helpers
const isImageHref = (href: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(href);
const isVideoHref = (href: string) => /\.(mp4|webm|ogg)(\?|#|$)/i.test(href);
const isPdfHref   = (href: string) => /\.pdf(\?|#|$)/i.test(href);
const isImageType = (t?: string | null) => !!t && t.startsWith("image/");
const isVideoType = (t?: string | null) => !!t && t.startsWith("video/");
const isPdfType   = (t?: string | null) => t === "application/pdf";
const fileNameFromUrl = (u: string) => {
    try { return decodeURIComponent(new URL(u).pathname.split("/").pop() || "file"); }
    catch { return u.split("/").pop() || "file"; }
};

/* ================== Types ================== */
type GroupLite = {
    id: number;
    hash: string;
    createdAt: string | null;
    updatedAt: string | null;
    lastMessageAt: string | null;
    recipients?: { id: number; fullName?: string | null; email?: string | null }[];
    lastComment?: {
        id: number;
        subject?: string | null;
        message?: string | null;
        date?: string | null;
        author?: { id: number; fullName?: string | null; email?: string | null } | null;
    } | null;
};

type CommentItem = {
    id: number;
    slug: string;
    subject?: string | null;
    message?: string | null;
    date?: string | null;
    author?: { id: number; fullName?: string | null; email?: string | null } | null;
    attachments?: { id: number | null; url?: string | null; type?: string | null; hash?: string | null }[];
};

export type TeamThreadRepliesProps = {
    projectHash: string;
    onSent?: () => void;
    baseUrlOverride?: string;
};

/* ================== Component ================== */
export default function TeamThreadReplies(props: TeamThreadRepliesProps) {
    const base = (props.baseUrlOverride || BE).replace(/\/+$/, "");
    const absUrl = (u?: string | null) => {
        if (!u) return null;
        if (/^https?:\/\//i.test(u)) return u;
        const path = u.startsWith("/") ? u : `/${u}`;
        return `${base}${path}`;
    };

    // banner presence (project-level)
    const [hasBanner, setHasBanner] = useState<boolean | null>(null);

    // lists & selection
    const [groups, setGroups] = useState<GroupLite[]>([]);
    const [groupsPage, setGroupsPage] = useState(1);
    const [groupsTotalPages, setGroupsTotalPages] = useState(1);
    const [selectedGroupHash, setSelectedGroupHash] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // comments
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentsCursor, setCommentsCursor] = useState<number | null>(null);
    const [hasMoreComments, setHasMoreComments] = useState(true);

    // UI state
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    // composer
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [localPreviews, setLocalPreviews] = useState<{ url: string; type: string }[]>([]);
    const msgEndRef = useRef<HTMLDivElement | null>(null);

    // previews for local files
    useEffect(() => {
        const urls = files.map(f => ({ url: URL.createObjectURL(f), type: f.type || "" }));
        setLocalPreviews(urls);
        return () => { urls.forEach(p => URL.revokeObjectURL(p.url)); };
    }, [files]);

    // Fetch project once to check banner
    useEffect(() => {
        const ctrl = new AbortController(); let alive = true;
        (async () => {
            try {
                const res = await fetch(`${base}/projects/${props.projectHash}`, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("Failed to load project");
                const data = await res.json();
                if (!alive) return;
                const bannerUrl = data?.media?.banner?.url ?? null;
                setHasBanner(!!bannerUrl);
            } catch (e) {
                if (!alive || isAbortError(e)) return;
                // gracefully ignore – just don't show the banner notice
                setHasBanner(null);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, props.projectHash]);

    // Load groups
    useEffect(() => {
        const ctrl = new AbortController(); let alive = true;
        (async () => {
            setLoadingGroups(true); setError(null);
            try {
                const qs = new URLSearchParams({ page: String(groupsPage), perPage: "20" });
                if (search.trim()) qs.set("q", search.trim());
                const res = await fetch(`${base}/projects/${props.projectHash}/comment-groups?${qs.toString()}`, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                    cache: "no-store",
                });
                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(`Failed to load threads (${res.status}): ${t || res.statusText}`);
                }
                const data = await res.json();
                if (!alive) return;
                const items: GroupLite[] = Array.isArray(data?.items) ? data.items : [];
                const unique = uniqBy(items, g => (g?.hash || String(g?.id)));
                setGroups(unique);
                setGroupsTotalPages(Number(data?.pages ?? 1));
                // auto-select first unique group if none selected
                if (!selectedGroupHash && unique.length > 0) {
                    setSelectedGroupHash(String(unique[0].hash || unique[0].id));
                }
            } catch (e) {
                if (!alive || isAbortError(e)) return;
                setError(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (alive) setLoadingGroups(false);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, props.projectHash, groupsPage, search]);

    // Load comments for selected group
    useEffect(() => {
        setComments([]); setCommentsCursor(null); setHasMoreComments(true); setOk(null); setError(null);
        if (!selectedGroupHash) return;
        void loadMoreComments(selectedGroupHash, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGroupHash]);

    const selectedGroup = useMemo(
        () => (selectedGroupHash ? groups.find(g => g.hash === selectedGroupHash) || null : null),
        [groups, selectedGroupHash]
    );

    async function loadMoreComments(groupHash: string, beforeId: number | null) {
        setLoadingComments(true); setError(null);
        try {
            const qs = new URLSearchParams();
            if (beforeId) qs.set("beforeId", String(beforeId));
            qs.set("limit", "20");

            const res = await fetch(`${base}/comment-groups/${groupHash}/comments?${qs.toString()}`, {
                headers: { Accept: "application/json", ...authHeaders() },
                cache: "no-store",
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`Failed to load comments (${res.status}): ${t || res.statusText}`);
            }
            const data = await res.json();
            const items: CommentItem[] = Array.isArray(data?.items) ? data.items : [];
            setComments(prev => uniqBy([...prev, ...items], c => c.id));
            const nextBefore = data?.nextCursor?.beforeId ?? null;
            setCommentsCursor(nextBefore);
            setHasMoreComments(!!nextBefore);
            if (!beforeId && msgEndRef.current) {
                setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoadingComments(false);
        }
    }

    function clearComposer() {
        setSubject(""); setMessage(""); setFiles([]); setOk(null); setError(null);
    }

    async function sendReply() {
        if (!selectedGroupHash) { setError("Select a thread to reply."); return; }
        if (!subject.trim() && !message.trim() && files.length === 0) {
            setError("Write a subject/message or attach a file."); return;
        }
        setSending(true); setOk(null); setError(null);
        try {
            if (files.length > 0) {
                const fd = new FormData();
                fd.append("data", JSON.stringify({ subject: subject.trim() || null, message: message.trim() || null }));
                files.forEach(f => fd.append("attachments[]", f));
                const cRes = await fetch(`${base}/comment-groups/${selectedGroupHash}/comments`, {
                    method: "POST",
                    headers: { Accept: "application/json", ...authHeaders() },
                    body: fd,
                });
                if (!cRes.ok) {
                    const t = await cRes.text().catch(() => "");
                    throw new Error(`Failed to post comment (${cRes.status}): ${t || cRes.statusText}`);
                }
            } else {
                const cRes = await fetch(`${base}/comment-groups/${selectedGroupHash}/comments`, {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify({ subject: subject.trim() || null, message: message.trim() || null }),
                });
                if (!cRes.ok) {
                    const t = await cRes.text().catch(() => "");
                    throw new Error(`Failed to post comment (${cRes.status}): ${t || cRes.statusText}`);
                }
            }

            clearComposer();
            setOk("Reply posted successfully! ✓");
            props.onSent?.();

            // refresh current thread
            setComments([]); setCommentsCursor(null); setHasMoreComments(true);
            await loadMoreComments(selectedGroupHash, null);

            // gently bump list (reload first page)
            setGroupsPage(1);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setSending(false);
        }
    }

    /* ================== RENDER ================== */
    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Team Threads</h3>
                            <p className="text-sm text-blue-100">Reply to existing conversations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {ok && (
                            <div className="rounded-xl border border-green-400/30 bg-green-50 px-4 py-2 shadow-sm">
                                <span className="text-sm font-semibold text-green-700">{ok}</span>
                            </div>
                        )}
                        {error && (
                            <div className="rounded-xl border border-red-400/30 bg-red-50 px-4 py-2 shadow-sm">
                                <span className="text-sm font-semibold text-red-700">{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Project banner notice */}
            {hasBanner === false && (
                <div className="mx-4 mt-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-sm text-blue-800">
                            This project doesn’t have a banner yet. Add one in <strong>Funding Details &amp; Media</strong> to improve your page.
                        </p>
                    </div>
                </div>
            )}

            {/* Body: 2 panes (threads + messages) */}
            <div className="grid h-[72vh] grid-cols-1 gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
                {/* Threads */}
                <section className="flex min-h-0 flex-col border-r border-gray-200 bg-gray-50">
                    <div className="border-b border-gray-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setGroupsPage(1); }}
                                    placeholder="Search threads…"
                                    className={`w-full ${INPUT} pl-9 pr-3`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-3">
                        {loadingGroups ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                                    <p className="mt-3 text-sm text-gray-500">Loading threads…</p>
                                </div>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">No threads found</p>
                                <p className="mt-1 text-xs text-gray-500">Ask an admin to start a thread for this project</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {groups.map((g) => (
                                    <li key={g.hash}>
                                        <button
                                            onClick={() => setSelectedGroupHash(g.hash)}
                                            className={`w-full rounded-xl border-2 p-3 text-left transition shadow-sm hover:shadow-md ${
                                                selectedGroupHash === g.hash
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-gray-200 bg-white hover:border-blue-300"
                                            }`}
                                        >
                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                <div className="flex-1 truncate text-sm font-bold text-gray-900">
                                                    {g.lastComment?.subject || `Thread #${g.id}`}
                                                </div>
                                                <div className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                                    {fmtDate(g.lastMessageAt || g.updatedAt)}
                                                </div>
                                            </div>
                                            {g.lastComment?.message && (
                                                <div className="mb-2 line-clamp-2 text-xs text-gray-600">{g.lastComment.message}</div>
                                            )}
                                            {g.recipients?.length ? (
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    <div className="truncate text-[11px] text-gray-500">
                                                        {g.recipients.slice(0, 2).map(r => r.fullName || r.email).filter(Boolean).join(", ")}
                                                        {g.recipients.length > 2 && ` +${g.recipients.length - 2}`}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* pagination */}
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <button
                            className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setGroupsPage(p => Math.max(1, p - 1))}
                            disabled={groupsPage <= 1 || loadingGroups}
                        >
                            ← Prev
                        </button>
                        <span className="text-xs font-semibold text-gray-600">Page {groupsPage} of {groupsTotalPages}</span>
                        <button
                            className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setGroupsPage(p => Math.min(groupsTotalPages, p + 1))}
                            disabled={groupsPage >= groupsTotalPages || loadingGroups}
                        >
                            Next →
                        </button>
                    </div>
                </section>

                {/* Messages + composer (reply only) */}
                <section className="flex min-h-0 flex-col bg-white">
                    {/* Top bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 pt-3">
                        <div className="rounded-t-xl px-4 py-2.5 text-sm font-bold border-b-4 border-blue-600 bg-white text-blue-700 shadow-sm">
                            💬 Reply in Thread
                        </div>
                        <div className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                            {selectedGroup ? `Thread #${selectedGroup.id}` : "No thread selected"}
                        </div>
                    </div>

                    {/* Messages list */}
                    <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white p-4">
                        {!selectedGroup ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                                        <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-base font-bold text-gray-900">Select a Thread</p>
                                    <p className="mt-1 text-sm text-gray-500">Choose a conversation from the left</p>
                                </div>
                            </div>
                        ) : comments.length === 0 && !loadingComments ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-blue-500">
                                        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <p className="text-base font-bold text-gray-900">No messages yet</p>
                                    <p className="mt-1 text-sm text-gray-500">Be the first to reply!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((c) => (
                                    <article key={c.id} className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                                                    {(c.author?.fullName || c.author?.email || "U")[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-gray-900">{c.subject || "(no subject)"}</div>
                                                    <div className="mt-0.5 text-xs text-gray-500">
                                                        {c.author?.fullName || c.author?.email || "Unknown"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                                                {fmtDate(c.date)}
                                            </div>
                                        </div>
                                        {c.message && (
                                            <div className="mb-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-800">
                                                {c.message}
                                            </div>
                                        )}
                                        {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    Attachments ({c.attachments.length})
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    {c.attachments.map((a, i) => {
                                                        const href = absUrl(a?.url || null);
                                                        const mime = a?.type || "";
                                                        if (!href) {
                                                            return (
                                                                <div key={`${c.id}-${i}`} className="rounded-lg border bg-white p-3 text-xs text-gray-500">
                                                                    Unavailable file
                                                                </div>
                                                            );
                                                        }
                                                        const asImage = isImageType(mime) || isImageHref(href);
                                                        const asVideo = isVideoType(mime) || isVideoHref(href);
                                                        const asPdf   = isPdfType(mime) || isPdfHref(href);

                                                        return (
                                                            <div key={`${c.id}-${i}`} className="group overflow-hidden rounded-lg border bg-white">
                                                                {asImage ? (
                                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                                                                        <img
                                                                            src={href}
                                                                            alt={a?.type || "image"}
                                                                            className="h-32 w-full object-cover transition group-hover:opacity-90"
                                                                            loading="lazy"
                                                                        />
                                                                    </a>
                                                                ) : asVideo ? (
                                                                    <video src={href} controls className="h-32 w-full object-cover" />
                                                                ) : asPdf ? (
                                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                                                                        <iframe
                                                                            src={`${href}#toolbar=0&navpanes=0`}
                                                                            className="h-32 w-full"
                                                                            title={fileNameFromUrl(href)}
                                                                        />
                                                                        <div className="border-t px-2 py-1 text-[11px] font-medium text-blue-700 group-hover:underline truncate">
                                                                            {fileNameFromUrl(href)}
                                                                        </div>
                                                                    </a>
                                                                ) : (
                                                                    <a href={href} target="_blank" rel="noopener noreferrer"
                                                                       className="flex h-32 w-full flex-col items-center justify-center gap-2 p-3 text-center">
                                                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L18.707 6.707A1 1 0 0119 7.414V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        <div className="px-2 text-[11px] font-medium text-blue-700 group-hover:underline truncate">
                                                                            {fileNameFromUrl(href)}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-500">{a?.type || "file"}</div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                ))}
                                {hasMoreComments && !loadingComments && selectedGroup && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => loadMoreComments(String(selectedGroup.hash), commentsCursor)}
                                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50"
                                        >
                                            Load older messages
                                        </button>
                                    </div>
                                )}
                                {loadingComments && (
                                    <div className="flex justify-center py-4">
                                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                                    </div>
                                )}
                                <div ref={msgEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Sticky composer */}
                    {selectedGroup && (
                        <div className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
                            <div className="mb-3 grid grid-cols-1 gap-3">
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Subject…"
                                    className={INPUT}
                                />
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your reply…"
                                    className={INPUT_AREA + " h-24 resize-y w-full"}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer">
                                        <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                                        {localPreviews.length > 0 && (
                                            <div className="mt-3 grid grid-cols-3 gap-3">
                                                {localPreviews.map((p, idx) => {
                                                    const img = p.type.startsWith("image/");
                                                    const vid = p.type.startsWith("video/");
                                                    const pdf = p.type === "application/pdf";
                                                    return (
                                                        <div key={idx} className="overflow-hidden rounded-lg border bg-white">
                                                            {img ? (
                                                                <img src={p.url} alt={`file-${idx}`} className="h-24 w-full object-cover" />
                                                            ) : vid ? (
                                                                <video src={p.url} controls className="h-24 w-full object-cover" />
                                                            ) : pdf ? (
                                                                <iframe src={`${p.url}#toolbar=0&navpanes=0`} className="h-24 w-full" />
                                                            ) : (
                                                                <div className="flex h-24 items-center justify-center text-xs text-gray-600">File</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <span className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attach
                    </span>
                                    </label>
                                    {files.length > 0 && (
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {files.length} file{files.length > 1 ? "s" : ""}
                    </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setSubject(""); setMessage(""); setFiles([]); }}
                                        className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={sendReply}
                                        disabled={sending || !selectedGroupHash}
                                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                                    >
                                        {sending ? "Posting…" : "Send Reply"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
