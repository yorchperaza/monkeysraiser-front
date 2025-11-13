"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ========= Types =========
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type UserLite = { id: number; fullName?: string | null; email?: string | null; picture?: MediaLite } | null;

type MessageLite = {
    id: number;
    subject: string | null;
    message: string | null;
    author: UserLite | null;
    attachments: MediaLite[];
    createdAt?: string | null;
};

type ConversationDetail = {
    id: number;
    hash: string;
    subject: string | null;
    project?: { id: number | null; hash: string | null; name: string | null } | null;
    participants?: UserLite[];
    createdAt?: string | null;
    updatedAt?: string | null;
    lastMessagePreview?: string | null;
};

type MessagesCursorResponse = {
    items: MessageLite[];
    nextCursor: { beforeId: number | null };
};

// ========= Helpers =========
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

function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = (u || "").replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}

function cls(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function timeAgo(s?: string | null) {
    if (!s) return "";
    const d = new Date(s);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

function isAbortError(err: unknown): boolean {
    if (typeof DOMException !== "undefined" && err instanceof DOMException) {
        return err.name === "AbortError";
    }
    return !!(
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as any).name === "AbortError"
    );
}

// ========= Data =========
async function fetchConversation(hash: string, signal?: AbortSignal): Promise<ConversationDetail> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversations/${encodeURIComponent(hash)}`,
        { headers: { Accept: "application/json", ...authHeaders() }, signal }
    );
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in (401).");
        throw new Error(`Conversation fetch failed (${res.status}): ${t || res.statusText}`);
    }
    return (await res.json()) as ConversationDetail;
}

async function fetchMessagesCursor(params: {
    conversationHash: string;
    beforeId?: number | null;
    limit?: number;
    signal?: AbortSignal;
}): Promise<MessagesCursorResponse> {
    const sp = new URLSearchParams();
    if (params.beforeId) sp.set("beforeId", String(params.beforeId));
    if (params.limit) sp.set("limit", String(params.limit));

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversations/${encodeURIComponent(
            params.conversationHash
        )}/messages?${sp.toString()}`,
        { headers: { Accept: "application/json", ...authHeaders() }, signal: params.signal }
    );
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in to view messages (401).");
        throw new Error(`Messages fetch failed (${res.status}): ${t || res.statusText}`);
    }
    const j = (await res.json()) as MessagesCursorResponse;
    return { items: j.items || [], nextCursor: j.nextCursor || { beforeId: null } };
}

async function postMessage(params: {
    conversationHash: string;
    subject?: string;
    message?: string;
    files: File[];
}): Promise<MessageLite> {
    const form = new FormData();
    form.set(
        "data",
        JSON.stringify({ subject: params.subject || null, message: params.message || null })
    );
    for (const f of params.files) form.append("attachments[]", f);

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversations/${encodeURIComponent(
            params.conversationHash
        )}/messages`,
        { method: "POST", headers: { ...authHeaders() }, body: form }
    );
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Please sign in to post (401).");
        throw new Error(`Create message failed (${res.status}): ${t || res.statusText}`);
    }
    return (await res.json()) as MessageLite;
}

// ========= UI bits =========
function AttachmentChip({ m }: { m: MediaLite }) {
    if (!m) return null;
    const url = mediaUrl(m.url || undefined);
    const isImage = (m.type || "").startsWith("image/");
    const name = m.hash || m.url?.split("/").pop() || "file";
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
            {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="attachment" className="h-6 w-6 rounded object-cover" />
            ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100">
                    📎
                </span>
            )}
            <span className="max-w-[12rem] truncate">{name}</span>
        </a>
    );
}

function MessageCard({ m }: { m: MessageLite }) {
    const pic = mediaUrl(m.author?.picture?.url ?? null);
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-gray-100">
                    {pic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pic} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold text-gray-900">
                            {m.author?.fullName || m.author?.email || "User"}
                        </div>
                        {m.createdAt && (
                            <div className="text-xs text-gray-500">{timeAgo(m.createdAt)}</div>
                        )}
                    </div>
                    {m.subject && (
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                            {m.subject}
                        </div>
                    )}
                    {m.message && (
                        <div className="prose prose-sm mt-1 max-w-none text-gray-800">
                            {m.message}
                        </div>
                    )}
                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {m.attachments.map((a, i) => (
                                <AttachmentChip key={(a?.id ?? 0) + ":" + i} m={a} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Composer({
                      conversationHash,
                      onCreated,
                  }: {
    conversationHash: string;
    onCreated: (m: MessageLite) => void;
}) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                setErr(null);
                setBusy(true);
                try {
                    const created = await postMessage({
                        conversationHash,
                        subject,
                        message,
                        files,
                    });
                    onCreated(created);
                    setSubject("");
                    setMessage("");
                    setFiles([]);
                } catch (e) {
                    setErr(e instanceof Error ? e.message : "Unknown error");
                } finally {
                    setBusy(false);
                }
            }}
            className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
        >
            <h3 className="text-base font-black text-gray-900">New message</h3>
            <div className="mt-4 space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-700">Subject</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-700">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-700">Attachments</label>
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        className="mt-2 block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 p-3 text-sm file:mr-3 file:rounded-lg file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold hover:border-gray-400"
                    />
                    {files.length > 0 && (
                        <ul className="mt-2 divide-y divide-gray-100 rounded-xl border bg-gray-50">
                            {files.map((f, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between px-3 py-2 text-xs"
                                >
                                    <div className="truncate">
                                        <span className="font-medium text-gray-900">
                                            {f.name}
                                        </span>{" "}
                                        <span className="ml-2 text-gray-500">
                                            ({Math.round(f.size / 1024)} KB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFiles((prev) =>
                                                prev.filter((_, ix) => ix !== i)
                                            )
                                        }
                                        className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-white"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {err && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {err}
                </div>
            )}
            <div className="mt-4 flex items-center justify-end">
                <button
                    type="submit"
                    disabled={busy || (!subject && !message && files.length === 0)}
                    className={cls(
                        "rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg",
                        busy ? "opacity-70" : "hover:shadow-xl"
                    )}
                    style={{ background: `linear-gradient(135deg, #0066CC, #003D7A)` }}
                >
                    {busy ? "Posting…" : "Post message"}
                </button>
            </div>
        </form>
    );
}

// ========= Page =========
export default function ConversationThreadPage() {
    const { hash } = useParams<{ hash: string }>();
    const conversationHash = String(hash || "");

    const [conv, setConv] = useState<ConversationDetail | null>(null);
    const [messages, setMessages] = useState<MessageLite[]>([]);
    const [cursor, setCursor] = useState<number | null>(null); // beforeId
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Load conversation + first page
    useEffect(() => {
        if (!conversationHash) return;
        const ctrl = new AbortController();
        setErr(null);
        setInitialLoading(true);

        Promise.all([
            fetchConversation(conversationHash, ctrl.signal),
            fetchMessagesCursor({ conversationHash, limit: 20, signal: ctrl.signal }),
        ])
            .then(([c, m]) => {
                setConv(c);
                setMessages(m.items || []);
                setCursor(m.nextCursor?.beforeId ?? null);
            })
            .catch((e) => {
                if (isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            })
            .finally(() => {
                if (!ctrl.signal.aborted) {
                    setInitialLoading(false);
                }
            });

        return () => ctrl.abort();
    }, [conversationHash]);

    // Infinite scroll for older messages
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !cursor) return;

        let ctrl: AbortController | null = null;
        let active = true;

        const loadMore = async () => {
            try {
                setLoadingMore(true);
                ctrl = new AbortController();

                const res = await fetchMessagesCursor({
                    conversationHash,
                    beforeId: cursor,
                    limit: 20,
                    signal: ctrl.signal,
                });

                if (!active) return;

                setMessages((prev) => [...prev, ...(res.items || [])]);
                setCursor(res.nextCursor?.beforeId ?? null);
            } catch (e) {
                if (isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (active) setLoadingMore(false);
            }
        };

        const io = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first?.isIntersecting && !loadingMore && cursor) {
                    void loadMore();
                }
            },
            { rootMargin: "600px 0px 600px 0px" }
        );

        io.observe(el);

        return () => {
            active = false;
            io.disconnect();
            if (ctrl) ctrl.abort();
        };
    }, [conversationHash, cursor, loadingMore]);

    function onCreated(m: MessageLite) {
        // Prepend newest (list is newest-first)
        setMessages((prev) => [m, ...prev]);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">
                                {conv?.subject || "Conversation"}
                            </h1>
                            {conv?.project?.hash && (
                                <p className="mt-1 text-sm text-gray-600">
                                    In project{" "}
                                    <Link
                                        href={`/dashboard/projects/${conv.project.hash}/messages`}
                                        className="font-bold text-blue-700 hover:underline"
                                    >
                                        {conv.project.name || conv.project.hash}
                                    </Link>
                                </p>
                            )}
                        </div>
                        {conv?.project?.hash && (
                            <Link
                                href={`/dashboard/projects/${conv.project.hash}/messages`}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                            >
                                ← Back to Conversations
                            </Link>
                        )}
                    </div>
                </div>

                {/* Grid: thread + composer */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        {err && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {err}
                            </div>
                        )}

                        {initialLoading && (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-100"
                                    />
                                ))}
                            </div>
                        )}

                        {!initialLoading && messages.length === 0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                                    💬
                                </div>
                                <h3 className="text-lg font-black text-gray-900">
                                    No messages yet
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Be the first to post in this conversation.
                                </p>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <div className="space-y-3">
                                {messages.map((m) => (
                                    <MessageCard key={m.id} m={m} />
                                ))}
                            </div>
                        )}

                        <div
                            ref={sentinelRef}
                            className="mt-6 flex items-center justify-center pb-10"
                        >
                            {loadingMore && (
                                <div className="text-sm text-gray-600">
                                    Loading older…
                                </div>
                            )}
                            {!loadingMore && !cursor && messages.length > 0 && (
                                <div className="text-xs text-gray-500">
                                    All messages loaded
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="lg:col-span-1">
                        <Composer
                            conversationHash={conversationHash}
                            onCreated={onCreated}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
