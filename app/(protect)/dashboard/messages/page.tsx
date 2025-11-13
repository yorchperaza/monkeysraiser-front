"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Config / Utils ----------
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const fromBE = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BE}/${String(path).replace(/^\/+/, "")}`;
};

type MediaRef = {
    id?: number | null;
    url: string | null;
    type: string | null;
    hash?: string | null;
};

type UserLite = {
    id: number;
    fullName: string | null;
    email: string | null;
    picture: MediaRef | null;
};

type ConversationLite = {
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

type MessageLite = {
    id: number;
    subject: string | null;
    message: string | null;
    author: UserLite | null;
    attachments: MediaRef[];
};

type Paged<T> = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: T[];
};

const currency = (n: number | null | undefined) =>
    n == null
        ? "—"
        : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Stronger input styles (no “too soft” feel)
const inputBase =
    "mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400";
const textareaBase =
    "mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder-gray-400";

// ---------- Avatar ----------
function Avatar({ pic, alt, size = 36 }: { pic: MediaRef | null; alt?: string | null; size?: number }) {
    const src = useMemo(() => fromBE(pic?.url || null), [pic?.url]);
    const initial = (alt?.trim()?.[0] || "?").toUpperCase();
    return (
        <div className="overflow-hidden rounded-full border border-gray-200 bg-gray-100" style={{ width: size, height: size }}>
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={alt || "avatar"} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">{initial}</div>
            )}
        </div>
    );
}

// ---------- Conversations Page ----------
export default function ConversationsPage() {
    const [token, setToken] = useState<string>("");
    const [loadingList, setLoadingList] = useState(true);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [list, setList] = useState<Paged<ConversationLite> | null>(null);
    const [selected, setSelected] = useState<ConversationLite | null>(null);

    // Thread state
    const [msgs, setMsgs] = useState<MessageLite[]>([]);
    const [cursorBeforeId, setCursorBeforeId] = useState<number | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadBusyOlder, setThreadBusyOlder] = useState(false);

    // Composer state
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Polling control
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("auth_token") || "");
        }
    }, []);

    // Load conversations list
    const loadList = useCallback(
        async (opts?: { page?: number; q?: string }) => {
            if (!token) return;
            setLoadingList(true);
            try {
                const url = new URL(`${BE}/me/conversations`);
                if (opts?.page) url.searchParams.set("page", String(opts.page));
                if (opts?.q ?? q) url.searchParams.set("q", (opts?.q ?? q) || "");
                const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error(`List conversations failed ${res.status}`);
                const data: Paged<ConversationLite> = await res.json();
                setList(data);
                // auto-select first if none selected
                if (!selected && data.items.length > 0) setSelected(data.items[0]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingList(false);
            }
        },
        [token, q, selected]
    );

    useEffect(() => {
        if (!token) return;
        loadList({ page, q });
    }, [token, page]); // q handled by search action

    const onSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setPage(1);
            loadList({ page: 1, q });
        },
        [q, loadList]
    );

    // Load latest messages for a conversation (no cursor => newest-first limited)
    const loadLatestMessages = useCallback(
        async (conv: ConversationLite) => {
            if (!token || !conv?.hash) return;
            setThreadLoading(true);
            try {
                const url = new URL(`${BE}/conversations/${encodeURIComponent(conv.hash)}/messages`);
                // No beforeId => latest N (newest-first)
                const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error(`Load messages failed ${res.status}`);
                const data: { items: MessageLite[]; nextCursor: { beforeId: number | null } } = await res.json();

                // API returns newest-first; we want oldest->newest for display:
                const ordered = [...data.items].reverse();
                setMsgs(ordered);
                setCursorBeforeId(data.nextCursor?.beforeId ?? null);
            } catch (e) {
                console.error(e);
                setMsgs([]);
                setCursorBeforeId(null);
            } finally {
                setThreadLoading(false);
            }
        },
        [token]
    );

    // Load older messages using cursor
    const loadOlder = useCallback(async () => {
        if (!token || !selected?.hash || !cursorBeforeId) return;
        setThreadBusyOlder(true);
        try {
            const url = new URL(`${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`);
            url.searchParams.set("beforeId", String(cursorBeforeId));
            const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Load older failed ${res.status}`);
            const data: { items: MessageLite[]; nextCursor: { beforeId: number | null } } = await res.json();
            const olderChunk = [...data.items].reverse();
            setMsgs((prev) => [...olderChunk, ...prev]);
            setCursorBeforeId(data.nextCursor?.beforeId ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setThreadBusyOlder(false);
        }
    }, [token, selected?.hash, cursorBeforeId]);

    // When selecting a conversation
    useEffect(() => {
        if (selected) {
            loadLatestMessages(selected);
        } else {
            setMsgs([]);
            setCursorBeforeId(null);
        }
    }, [selected, loadLatestMessages]);

    // Poll new messages (compare last id)
    useEffect(() => {
        if (!token || !selected?.hash) return;
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const url = new URL(`${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`);
                const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
                if (!res.ok) return;
                const data: { items: MessageLite[]; nextCursor: { beforeId: number | null } } = await res.json();
                const newestFirst = data.items;
                if (newestFirst.length === 0) return;

                const currentLastId = msgs.length ? msgs[msgs.length - 1].id : 0;
                // Find those > currentLastId and append in chronological order
                const incomingNewestAsc = [...newestFirst.filter((m) => m.id > currentLastId)].reverse();
                if (incomingNewestAsc.length) {
                    setMsgs((prev) => [...prev, ...incomingNewestAsc]);
                }
                // also refresh list previews periodically
                loadList({ page, q });
            } catch {
                // ignore polling failures
            }
        }, 8000); // 8s
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [token, selected?.hash, msgs, loadList, page, q]);

    // Send message (JSON or multipart if attachments)
    const sendMessage = useCallback(async () => {
        if (!token || !selected?.hash) return;
        if (!subject.trim() && !message.trim() && files.length === 0) return;
        setSending(true);
        try {
            const url = `${BE}/conversations/${encodeURIComponent(selected.hash)}/messages`;
            const hasFiles = files.length > 0;
            let res: Response;

            if (hasFiles) {
                const fd = new FormData();
                fd.set(
                    "data",
                    JSON.stringify({
                        subject: subject.trim() || null,
                        message: message.trim() || null,
                    })
                );
                files.forEach((f) => fd.append("attachments[]", f));
                res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
            } else {
                res = await fetch(url, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ subject: subject.trim() || null, message: message.trim() || null }),
                });
            }

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`Send failed (${res.status}): ${t || res.statusText}`);
            }
            const msg: MessageLite = await res.json();

            // Append the newly created message
            setMsgs((prev) => [...prev, msg]);
            setSubject("");
            setMessage("");
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            // refresh side list preview
            loadList({ page, q });
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to send");
        } finally {
            setSending(false);
        }
    }, [token, selected?.hash, subject, message, files, loadList, page, q]);

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-black text-gray-900">Conversations</h1>
                    <Link href="/projects" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600">
                        ← Back to Projects
                    </Link>
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3">
                {/* LEFT: Conversations list */}
                <aside className="lg:col-span-1">
                    <form onSubmit={onSearch} className="mb-3">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search subject or preview…"
                            className={inputBase}
                        />
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3">
                            <div className="text-sm font-black text-gray-900">All conversations</div>
                        </div>

                        {loadingList ? (
                            <div className="p-4 text-sm text-gray-500">Loading…</div>
                        ) : !list || list.items.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No conversations yet</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {list.items.map((c) => {
                                    const last = c.lastMessage;
                                    const isActive = selected?.id === c.id;
                                    return (
                                        <li key={c.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelected(c)}
                                                className={
                                                    "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-blue-50/40 " +
                                                    (isActive ? "bg-blue-50/60" : "bg-white")
                                                }
                                            >
                                                <Avatar pic={last?.author?.picture || null} alt={last?.author?.fullName || last?.author?.email || "User"} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="truncate text-sm font-bold text-gray-900">
                                                            {c.subject || c.project?.name || "(No subject)"}
                                                        </div>
                                                        <div className="ml-2 shrink-0 text-[11px] text-gray-500">
                                                            {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ""}
                                                        </div>
                                                    </div>
                                                    <div className="truncate text-xs text-gray-500">
                                                        {c.lastMessagePreview || last?.message || "—"}
                                                    </div>
                                                    {c.project?.name ? (
                                                        <div className="mt-1 text-[11px] font-medium text-blue-700">
                                                            {c.project.name}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Pagination footer */}
                        {list && list.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 font-bold text-gray-700 disabled:opacity-50 hover:border-blue-400 hover:text-blue-600"
                                >
                                    Prev
                                </button>
                                <div>
                                    Page <span className="font-bold">{page}</span> / {list.pages}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(list.pages, p + 1))}
                                    disabled={page >= list.pages}
                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 font-bold text-gray-700 disabled:opacity-50 hover:border-blue-400 hover:text-blue-600"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* RIGHT: Thread viewer */}
                <section className="lg:col-span-2">
                    {!selected ? (
                        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-blue-100 bg-white text-gray-500">
                            Select a conversation from the left
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-black text-gray-900">{selected.subject || "(No subject)"}</div>
                                    {selected.project?.name ? (
                                        <div className="truncate text-xs text-blue-700">{selected.project.name}</div>
                                    ) : null}
                                </div>
                                {selected.project?.hash ? (
                                    <Link
                                        href={`/projects/${encodeURIComponent(selected.project.hash)}`}
                                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                                    >
                                        View Project
                                    </Link>
                                ) : null}
                            </div>

                            {/* Messages */}
                            <div className="flex max-h-[70vh] flex-col overflow-y-auto">
                                <div className="border-b border-gray-100 p-3">
                                    <button
                                        onClick={loadOlder}
                                        disabled={!cursorBeforeId || threadBusyOlder}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-50 hover:border-blue-400 hover:text-blue-600"
                                    >
                                        {threadBusyOlder ? "Loading…" : cursorBeforeId ? "Load older messages" : "No older messages"}
                                    </button>
                                </div>

                                {threadLoading ? (
                                    <div className="p-6 text-sm text-gray-500">Loading messages…</div>
                                ) : msgs.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">No messages yet</div>
                                ) : (
                                    <ul className="space-y-0 p-4">
                                        {msgs.map((m) => (
                                            <li key={m.id} className="flex gap-3 py-3">
                                                <Avatar pic={m.author?.picture || null} alt={m.author?.fullName || m.author?.email || "User"} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-x-2">
                                                        <div className="truncate text-sm font-bold text-gray-900">
                                                            {m.author?.fullName || m.author?.email || "User"}
                                                        </div>
                                                        {m.subject ? (
                                                            <div className="truncate text-xs font-semibold text-blue-700">• {m.subject}</div>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">
                                                        {m.message || "—"}
                                                    </div>

                                                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {m.attachments.map((a, idx) => {
                                                                const url = fromBE(a.url);
                                                                const isImage = (a.type || "").startsWith("image/");
                                                                return url ? (
                                                                    <a
                                                                        key={`${m.id}-att-${idx}`}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white hover:text-blue-700"
                                                                    >
                                                                        {isImage ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img src={url} alt="attachment" className="h-8 w-8 rounded object-cover" />
                                                                        ) : (
                                                                            <span className="inline-block h-8 w-8 rounded bg-white ring-1 ring-gray-200" />
                                                                        )}
                                                                        <span className="max-w-[160px] truncate">{(a.url || "").split("/").pop()}</span>
                                                                    </a>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Composer */}
                            <div className="border-t border-blue-100 p-5">
                                <div className="grid gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700">Subject</label>
                                        <input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Subject (optional)"
                                            className={inputBase}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700">Message</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={4}
                                            placeholder="Write your message…"
                                            className={textareaBase}
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                                className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700"
                                            />
                                            {files.length > 0 && (
                                                <span className="text-xs text-gray-500">{files.length} file(s) ready</span>
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
                                                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600"
                                                disabled={sending}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={sendMessage}
                                                disabled={sending || (!subject.trim() && !message.trim() && files.length === 0)}
                                                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-black text-white shadow hover:bg-blue-700 disabled:opacity-60"
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
            </main>
        </div>
    );
}
