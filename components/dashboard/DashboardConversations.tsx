"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types (matches your API) ----------
type MediaRef = { id?: number | null; url: string | null; type: string | null; hash?: string | null } | null;

type UserLite = {
    id: number;
    fullName: string | null;
    email: string | null;
    picture: MediaRef;
};

type MessageLite = {
    id: number;
    subject: string | null;
    message: string | null;
    author: UserLite | null;
    attachments: Array<{ id?: number | null; url: string | null; type: string | null; hash?: string | null }>;
    read?: boolean | null;
    readDate?: string | null; // ISO
};

export type ConversationLite = {
    id: number;
    hash: string;
    subject: string | null;
    project: { id: number; hash: string; name: string } | null;
    createdAt: string | null;
    updatedAt: string | null;
    lastMessage?: MessageLite | null;
    lastMessagePreview?: string | null;
    participants?: UserLite[];
};

type Paged<T> = { page: number; perPage: number; total: number; pages: number; items: T[] };

// ---------- Small utils ----------
function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}
const nowIso = () => new Date().toISOString();

function getToken(): string {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}
function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
function fromBE(u?: string | null): string | null {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `${BE}/${String(u).replace(/^\/+/, "")}`;
}

// ---------- Read endpoints helpers (await + return success) ----------
async function markConversationRead(convHash: string): Promise<boolean> {
    if (!convHash) return false;
    try {
        const res = await fetch(`${BE}/conversations/${encodeURIComponent(convHash)}/read`, {
            method: "POST",
            headers: { Accept: "application/json", ...authHeaders() },
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function markMessageRead(convHash: string, messageId: number): Promise<boolean> {
    if (!convHash || !messageId) return false;
    try {
        const res = await fetch(`${BE}/conversations/${encodeURIComponent(convHash)}/messages/${messageId}/read`, {
            method: "POST",
            headers: { Accept: "application/json", ...authHeaders() },
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Stronger inputs (consistent with your dash)
const inputBase =
    "w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// ---------- Avatar ----------
function Avatar({ user, size = 28 }: { user: UserLite | null | undefined; size?: number }) {
    const src = useMemo(() => fromBE(user?.picture?.url || null), [user?.picture?.url]);
    const label = user?.fullName || user?.email || "User";
    const initial = (label?.trim()?.[0] || "?").toUpperCase();
    return (
        <div className="overflow-hidden rounded-full border border-gray-200 bg-gray-100" style={{ width: size, height: size }}>
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={label} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400">{initial}</div>
            )}
        </div>
    );
}

// ---------- Message Item Component (with its own hooks) ----------
function MessageItem({
                         message,
                         conversationHash,
                         onMarkRead,
                     }: {
    message: MessageLite;
    conversationHash: string;
    onMarkRead: (messageId: number) => void;
}) {
    const ref = useRef<HTMLLIElement>(null);
    const hasMarked = useRef(false);

    // IntersectionObserver to mark as read when visible
    useEffect(() => {
        if (message.read || hasMarked.current) return;

        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        hasMarked.current = true;
                        onMarkRead(message.id);
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [message.read, message.id, onMarkRead]);

    const isImage = (t?: string | null) => (t || "").startsWith("image/");

    return (
        <li ref={ref} className="flex gap-3 py-3">
            <Avatar user={message.author} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                    <div className="truncate text-sm font-bold text-gray-900">
                        {message.author?.fullName || message.author?.email || "User"}
                    </div>
                    {!message.read && (
                        <span
                            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white"
                            title="Unread message"
                        >
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            NEW
                        </span>
                    )}
                    {message.subject && (
                        <div className="truncate text-xs font-semibold text-blue-700">
                            • {message.subject}
                        </div>
                    )}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">
                    {message.message || "—"}
                </div>

                {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((a, i) => {
                            const url = fromBE(a.url || "");
                            if (!url) return null;
                            return (
                                <a
                                key={`${message.id}-att-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white hover:text-blue-700"
                                >
                                {isImage(a.type) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt="attachment" className="h-8 w-8 rounded object-cover" />
                            ) : (
                                <span className="inline-block h-8 w-8 rounded bg-white ring-1 ring-gray-200" />
                            )}
                            <span className="max-w-[160px] truncate">{(a.url || "").split("/").pop()}</span>
                        </a>
                        );
                        })}
                    </div>
                )}
            </div>
        </li>
    );
}

// ---------- Main Component ----------
export default function DashboardConversations({
                                                   className,
                                                   perPage = 8,
                                                   pollMs = 8000,
                                                   showHeader = true,
                                                   conversations: initialConversations,
                                               }: {
    className?: string;
    perPage?: number;
    pollMs?: number;
    showHeader?: boolean;
    conversations?: ConversationLite[];
}) {
    const [q, setQ] = useState("");
    const [loadingList, setLoadingList] = useState(!initialConversations);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<Paged<ConversationLite> | null>(initialConversations ? {
        page: 1,
        perPage: perPage,
        total: initialConversations.length, // approximation
        pages: 1,
        items: initialConversations
    } : null);
    
    // Initialize selected if we have items and none selected yet (handled in effect or initial state?)
    // Actually, `selected` is state. Let's initialize it if provided.
    const [selected, setSelected] = useState<ConversationLite | null>(initialConversations && initialConversations.length > 0 ? initialConversations[0] : null);

    // Thread state
    const [msgs, setMsgs] = useState<MessageLite[]>([]);
    const [cursorBeforeId, setCursorBeforeId] = useState<number | null>(null);
    const [loadingThread, setLoadingThread] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasMarkedRef = useRef<string | null>(null);
    const initializedRef = useRef(!!initialConversations);

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // ---- List loader
    const loadList = useCallback(async (force = false) => {
        // specific check to skip first load if we have props
        if (!force && initializedRef.current) {
             return;
        }

        setLoadingList(true);
        setErr(null);
        try {
            const url = new URL(`${BE}/me/conversations`);
            url.searchParams.set("page", "1");
            url.searchParams.set("perPage", String(perPage));
            if (q.trim()) url.searchParams.set("q", q.trim());

            const res = await fetch(url.toString(), { headers: { Accept: "application/json", ...authHeaders() } });
            if (!res.ok) throw new Error(`Conversations fetch failed (${res.status})`);
            const payload: Paged<ConversationLite> = await res.json();
            setData(payload);

            // Keep current selection if still present
            if (selected) {
                const still = payload.items.find((i) => i.id === selected.id);
                if (!still && payload.items.length) setSelected(payload.items[0]);
            } else if (payload.items.length) {
                setSelected(payload.items[0]);
            }
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load conversations");
        } finally {
            setLoadingList(false);
        }
    }, [perPage, q, selected]);

    useEffect(() => {
        // If we initialized with props, disable the flag so subsequent calls (like search) work
        // But for the FIRST mount, we want to skip loadList() call in this effect if we have data.
        // Actually, we can just call loadList() and let it check the ref.
        loadList();  
        // After first run, we want future calls to work (e.g. manual refresh or search), 
        // implies we should unset initializedRef after a timeout or in a separate effect?
        // Better: let's just make the effect logic explicit.
        
        // Wait, if q changes, we DO want to load list irrespective of initial props.
        // So initializedRef should be reset when q changes? 
        // Complex interactions. 
        
        // Simpler: 
        if (initializedRef.current) {
             // We used initial data.
             // We must eventually allow refetching. 
             // Let's set it to false AFTER this effect runs?
             const t = setTimeout(() => { initializedRef.current = false; }, 100);
             return () => clearTimeout(t);
        }
    }, [loadList]);

    // Reset initialization flag if q changes so we do fetch
    useEffect(() => {
        if (q) initializedRef.current = false;
    }, [q]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    // ---- Thread loader (latest batch)
    const loadThreadLatest = useCallback(
        async (conv: ConversationLite | null) => {
            if (!conv) return;
            setLoadingThread(true);
            try {
                const url = `${BE}/conversations/${encodeURIComponent(conv.hash)}/messages`;
                const res = await fetch(url, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    cache: "no-store",
                });
                if (!res.ok) throw new Error(`Messages load failed (${res.status})`);
                const { items, nextCursor }: { items: MessageLite[]; nextCursor: { beforeId: number | null } } =
                    await res.json();

                // API returns newest-first; show oldest->newest:
                const ordered = [...items].reverse();
                setMsgs(ordered);
                setCursorBeforeId(nextCursor?.beforeId ?? null);
            } catch (e) {
                setMsgs([]);
                setCursorBeforeId(null);
            } finally {
                setLoadingThread(false);
            }
        },
        []
    );

    // Reset one-time marker whenever conversation changes, then load
    useEffect(() => {
        hasMarkedRef.current = null;
        loadThreadLatest(selected);
    }, [selected, loadThreadLatest]);

    // Load older via cursor
    const loadOlder = useCallback(async () => {
        if (!selected || !cursorBeforeId) return;
        setLoadingOlder(true);
        try {
            const url = new URL(`${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`);
            url.searchParams.set("beforeId", String(cursorBeforeId));
            const res = await fetch(url.toString(), {
                headers: { Accept: "application/json", ...authHeaders() },
            });
            if (!res.ok) throw new Error(`Older messages load failed (${res.status})`);
            const { items, nextCursor }: { items: MessageLite[]; nextCursor: { beforeId: number | null } } =
                await res.json();
            const olderAsc = [...items].reverse();
            setMsgs((prev) => [...olderAsc, ...prev]);
            setCursorBeforeId(nextCursor?.beforeId ?? null);
        } catch {
            // ignore
        } finally {
            setLoadingOlder(false);
        }
    }, [selected, cursorBeforeId]);

    // Poll newest messages into the open thread
    useEffect(() => {
        if (!selected) return;
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const url = `${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`;
                const res = await fetch(url, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    cache: "no-store",
                });
                if (!res.ok) return;
                const { items }: { items: MessageLite[] } = await res.json();

                const currentLast = msgs.length ? msgs[msgs.length - 1].id : 0;
                const incomingAsc = [...items.filter((m) => m.id > currentLast)].reverse();

                if (incomingAsc.length) {
                    setMsgs((prev) => [...prev, ...incomingAsc]);
                    await loadList();
                }
            } catch {
                // ignore polling errors
            }
        }, Math.max(4000, pollMs));
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selected, msgs, pollMs, loadList]);

    // Handler for marking messages as read
    const handleMarkMessageRead = useCallback(
        async (messageId: number) => {
            if (!selected) return;

            const ok = await markMessageRead(selected.hash, messageId);
            const stamp = nowIso();

            setMsgs((prev) =>
                prev.map((x) =>
                    x.id === messageId ? { ...x, read: true, readDate: x.readDate ?? stamp } : x
                )
            );

            if (ok) await loadList();
        },
        [selected, loadList]
    );

    // Send message
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [sending, setSending] = useState(false);

    const send = useCallback(async () => {
        if (!selected) return;
        if (!subject.trim() && !message.trim() && files.length === 0) return;

        setSending(true);
        try {
            const endpoint = `${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`;
            let res: Response;

            if (files.length) {
                const fd = new FormData();
                fd.set("data", JSON.stringify({ subject: subject.trim() || null, message: message.trim() || null }));
                files.forEach((f) => fd.append("attachments[]", f));
                res = await fetch(endpoint, { method: "POST", headers: { ...authHeaders() }, body: fd });
            } else {
                res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify({ subject: subject.trim() || null, message: message.trim() || null }),
                });
            }
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`Send failed (${res.status}): ${t || res.statusText}`);
            }
            const msg: MessageLite = await res.json();
            setMsgs((prev) => [...prev, msg]);
            setSubject("");
            setMessage("");
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            await loadList();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to send");
        } finally {
            setSending(false);
        }
    }, [selected, subject, message, files, loadList]);

    return (
        <section className={classNames("rounded-2xl bg-white p-5 shadow-lg", className)}>
            {showHeader && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Conversations</h2>
                        <p className="text-sm text-gray-600">View and reply without leaving the dashboard.</p>
                    </div>
                    <Link
                        href="/dashboard/messages"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600"
                    >
                        Open full view →
                    </Link>
                </div>
            )}

            {/* Search */}
            <div className="mb-3 flex items-center gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadList()}
                    placeholder="Search subject or preview…"
                    className={inputBase}
                />
                <button
                    onClick={() => loadList()}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-black text-white hover:bg-blue-700"
                >
                    Search
                </button>
            </div>

            {err && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err} <button onClick={() => loadList()} className="underline">Retry</button>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-5">
                {/* List */}
                <aside className="lg:col-span-2">
                    <div className="overflow-hidden rounded-2xl border border-blue-100">
                        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2.5 text-sm font-black text-gray-900">
                            My conversations
                        </div>

                        {loadingList ? (
                            <ul className="divide-y divide-gray-100">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3">
                                        <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />
                                        <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
                                    </li>
                                ))}
                            </ul>
                        ) : !data || data.items.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-gray-500">No conversations yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {data.items.map((c) => {
                                    const isActive = selected?.id === c.id;
                                    const lastAuthor = c.lastMessage?.author;
                                    return (
                                        <li key={c.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelected(c)}
                                                className={classNames(
                                                    "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-blue-50/50",
                                                    isActive ? "bg-blue-50/60" : "bg-white"
                                                )}
                                            >
                                                <Avatar user={lastAuthor} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="truncate text-sm font-bold text-gray-900">
                                                            {c.subject || c.project?.name || "(No subject)"}
                                                        </div>
                                                        <div className="shrink-0 text-[11px] text-gray-500">
                                                            {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ""}
                                                        </div>
                                                    </div>
                                                    <div className="truncate text-xs text-gray-600">
                                                        {c.lastMessagePreview || c.lastMessage?.message || "—"}
                                                    </div>
                                                    {c.project?.name && (
                                                        <div className="mt-1 text-[11px] font-medium text-blue-700">
                                                            {c.project.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Light footer */}
                        {data && data.total > data.perPage && (
                            <div className="border-t border-gray-100 px-3 py-2 text-center text-xs text-gray-600">
                                Showing {Math.min(data.perPage, data.items.length)} of {data.total}.{" "}
                                <Link href="/conversations" className="font-bold text-blue-700 underline">
                                    See all
                                </Link>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Thread */}
                <section className="lg:col-span-3">
                    {!selected ? (
                        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-blue-100 bg-white text-gray-500">
                            Select a conversation to view messages
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2.5">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-black text-gray-900">
                                        {selected.subject || "(No subject)"}
                                    </div>
                                    {selected.project?.name && (
                                        <div className="truncate text-xs text-blue-700">{selected.project.name}</div>
                                    )}
                                </div>
                                {selected.project?.hash && (
                                    <Link
                                        href={`/projects/${encodeURIComponent(selected.project.hash)}`}
                                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                                    >
                                        View project
                                    </Link>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex max-h-[420px] flex-col overflow-y-auto">
                                <div className="border-b border-gray-100 p-3">
                                    <button
                                        onClick={loadOlder}
                                        disabled={!cursorBeforeId || loadingOlder}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-50 hover:border-blue-400 hover:text-blue-600"
                                    >
                                        {loadingOlder
                                            ? "Loading…"
                                            : cursorBeforeId
                                                ? "Load older messages"
                                                : "No older messages"}
                                    </button>
                                </div>

                                {loadingThread ? (
                                    <div className="p-4 text-sm text-gray-500">Loading messages…</div>
                                ) : msgs.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No messages yet.</div>
                                ) : (
                                    <ul className="space-y-0 p-4">
                                        {msgs.map((m) => (
                                            <MessageItem
                                                key={m.id}
                                                message={m}
                                                conversationHash={selected.hash}
                                                onMarkRead={handleMarkMessageRead}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Composer */}
                            <div className="border-t border-blue-100 p-4">
                                <div className="grid gap-2">
                                    <input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Subject (optional)"
                                        className={inputBase}
                                    />
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                        placeholder="Write a message…"
                                        className={inputBase}
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                                className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700"
                                            />
                                            {files.length > 0 && (
                                                <span className="text-xs text-gray-500">{files.length} file(s)</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSubject("");
                                                    setMessage("");
                                                    setFiles([]);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                disabled={sending}
                                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={send}
                                                disabled={
                                                    sending ||
                                                    (!subject.trim() && !message.trim() && files.length === 0)
                                                }
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                {sending ? "Sending…" : "Send"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
}