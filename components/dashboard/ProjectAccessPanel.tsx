"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ========= Shared types ========= */

export type AccessStatus =
    | "unknown"
    | "none"
    | "requested"
    | "approved"
    | "rejected"
    | "revoked";

type AccessRequestItem = {
    id: number;
    status: "requested" | "approved" | "rejected" | "revoked" | string;
    message: string | null;
    createdAt: string;
    updatedAt: string | null;
    investor: {
        id: number;
        fullName: string | null;
        email: string | null;
        // hashes coming from backend
        investor?: string | null;
        founder?: string | null;
    } | null;
};

type ProjectAccessRequestsGroup = {
    projectId: number;
    projectHash: string;
    projectName: string | null;
    stage: string | null;
    isOwner: boolean;
    isContributor: boolean;
    location:
        | { country?: string; state?: string; city?: string; iso2?: string }
        | string
        | null;
    requests: AccessRequestItem[];
};

type MeAccessRequestsResponse = {
    items: ProjectAccessRequestsGroup[];
};

/* ========= UI / helpers ========= */

const brand = {
    primary: "#0066CC",
    darkBlue: "#003D7A",
} as const;

function cls(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function timeAgo(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
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

function shortLocation(
    loc?:
        | { country?: string; state?: string; city?: string; iso2?: string }
        | string
        | null
) {
    if (!loc) return "—";
    if (typeof loc === "string") return loc;
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    if (parts.length) return parts.join(", ");
    if (loc.iso2) return loc.iso2;
    return "—";
}

/* ========= Auth helpers ========= */

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

/* ========= API calls ========= */

// single skinny endpoint for dashboard
async function fetchDashboardAccessRequests(opts: {
    signal?: AbortSignal;
}): Promise<ProjectAccessRequestsGroup[]> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/me/access/requests`,
        {
            method: "GET",
            headers: { Accept: "application/json", ...authHeaders() },
            signal: opts.signal,
        }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) {
            throw new Error("Please sign in to view access requests (401).");
        }
        throw new Error(
            `Access requests fetch failed (${res.status}): ${
                text || res.statusText
            }`
        );
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid /me/access/requests JSON payload");
    }

    const d = data as Partial<MeAccessRequestsResponse>;
    if (!d || !Array.isArray(d.items)) {
        return [];
    }

    return d.items as ProjectAccessRequestsGroup[];
}

// approve / reject
async function approveRequest(
    projectHash: string,
    reqId: number
): Promise<void> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(
            projectHash
        )}/access/requests/${reqId}/approve`,
        {
            method: "POST",
            headers: { Accept: "application/json", ...authHeaders() },
        }
    );
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Approve failed (${res.status}): ${text || res.statusText}`);
    }
}

async function rejectRequest(
    projectHash: string,
    reqId: number
): Promise<void> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(
            projectHash
        )}/access/requests/${reqId}/reject`,
        {
            method: "POST",
            headers: { Accept: "application/json", ...authHeaders() },
        }
    );
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Reject failed (${res.status}): ${text || res.statusText}`);
    }
}

/* ========= Main dashboard panel ========= */

export default function DashboardAccessRequestsPanel({
                                                         className,
                                                     }: {
    className?: string;
}) {
    const [groups, setGroups] = useState<ProjectAccessRequestsGroup[] | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [actingKey, setActingKey] = useState<string | null>(null); // `${projectHash}:${reqId}`

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        setErr(null);
        setGroups(null);

        (async () => {
            try {
                const items = await fetchDashboardAccessRequests({ signal: ctrl.signal });
                setGroups(items);
            } catch (e) {
                if (isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();

        return () => ctrl.abort();
    }, []);

    function makeKey(projectHash: string, reqId: number) {
        return `${projectHash}:${reqId}`;
    }

    async function handleApprove(projectHash: string, reqId: number) {
        const key = makeKey(projectHash, reqId);
        if (actingKey) return;
        setActingKey(key);
        try {
            await approveRequest(projectHash, reqId);
            setGroups((prev) =>
                (prev || []).map((g) =>
                    g.projectHash === projectHash
                        ? {
                            ...g,
                            requests: g.requests.map((r) =>
                                r.id === reqId
                                    ? {
                                        ...r,
                                        status: "approved",
                                        updatedAt: new Date().toISOString(),
                                    }
                                    : r
                            ),
                        }
                        : g
                )
            );
        } catch (e) {
            alert(e instanceof Error ? e.message : "Approve failed");
        } finally {
            setActingKey(null);
        }
    }

    async function handleReject(projectHash: string, reqId: number) {
        const key = makeKey(projectHash, reqId);
        if (actingKey) return;
        setActingKey(key);
        try {
            await rejectRequest(projectHash, reqId);
            setGroups((prev) =>
                (prev || []).map((g) =>
                    g.projectHash === projectHash
                        ? {
                            ...g,
                            requests: g.requests.map((r) =>
                                r.id === reqId
                                    ? {
                                        ...r,
                                        status: "rejected",
                                        updatedAt: new Date().toISOString(),
                                    }
                                    : r
                            ),
                        }
                        : g
                )
            );
        } catch (e) {
            alert(e instanceof Error ? e.message : "Reject failed");
        } finally {
            setActingKey(null);
        }
    }

    function statusChipClass(status: string) {
        const s = status.toLowerCase();
        if (s === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s === "requested") return "bg-amber-50 text-amber-700 border-amber-200";
        if (s === "rejected" || s === "revoked")
            return "bg-red-50 text-red-700 border-red-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    }

    function statusLabel(status: string) {
        const s = status.toLowerCase();
        if (s === "requested") return "Pending";
        if (s === "approved") return "Approved";
        if (s === "rejected") return "Rejected";
        if (s === "revoked") return "Revoked";
        return status;
    }

    const totalRequests =
        groups?.reduce((sum, g) => sum + (g.requests?.length ?? 0), 0) ?? 0;

    return (
        <section
            className={cls(
                "rounded-2xl border border-blue-100 bg-white p-6 shadow-lg",
                className
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-black text-gray-900">
                        Investor access requests
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">
                        As project owner or collaborator, you can approve or reject investor
                        access to your projects.
                    </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-700">
          {totalRequests} requests
        </span>
            </div>

            {err && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {err}
                </div>
            )}

            {loading && (
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 animate-pulse"
                        >
                            <div className="h-4 w-1/2 rounded bg-gray-200" />
                            <div className="h-3 w-1/3 rounded bg-gray-200" />
                            <div className="flex gap-2">
                                <div className="h-7 w-16 rounded bg-gray-200" />
                                <div className="h-7 w-16 rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && (!groups || groups.length === 0) && !err && (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-xs text-gray-600">
                    There are no investor access requests for your projects yet. When an
                    investor requests access, it will appear here.
                </div>
            )}

            {!loading && groups && groups.length > 0 && (
                <div className="mt-4 space-y-4">
                    {groups.map((g) => (
                        <div
                            key={g.projectHash}
                            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <Link
                                        href={g.projectHash ? `/projects/${g.projectHash}` : "#"}
                                        className="text-sm font-bold text-gray-900 hover:underline"
                                    >
                                        {g.projectName ?? g.projectHash ?? "Untitled project"}
                                    </Link>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                      📍 {shortLocation(g.location)}
                    </span>
                                        {g.stage && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {g.stage}
                      </span>
                                        )}
                                        {g.isOwner && (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Owner
                      </span>
                                        )}
                                        {!g.isOwner && g.isContributor && (
                                            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Contributor
                      </span>
                                        )}
                                    </div>
                                </div>

                                <Link
                                    href={
                                        g.projectHash
                                            ? `/dashboard/projects/${g.projectHash}`
                                            : "/dashboard/projects"
                                    }
                                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 sm:mt-0"
                                >
                                    Manage project
                                </Link>
                            </div>

                            <div className="mt-3 space-y-3">
                                {g.requests.map((r) => {
                                    const isPending = r.status === "requested";
                                    const key = makeKey(g.projectHash, r.id);
                                    const busy = actingKey === key;

                                    // --- new: profile link with priority investor > founder ---
                                    const investorHash = r.investor?.investor || null;
                                    const founderHash =
                                        !investorHash && r.investor?.founder
                                            ? r.investor.founder
                                            : null;

                                    const profileHref = investorHash
                                        ? `/profiles/${encodeURIComponent(investorHash)}`
                                        : founderHash
                                            ? `/profiles/${encodeURIComponent(founderHash)}`
                                            : null;

                                    const investorName =
                                        r.investor?.fullName ||
                                        r.investor?.email ||
                                        `Investor #${r.investor?.id ?? "?"}`;

                                    return (
                                        <div
                                            key={r.id}
                                            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-800 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {profileHref ? (
                                                        <Link
                                                            href={profileHref}
                                                            className="text-[11px] font-bold text-gray-900 hover:underline"
                                                        >
                                                            {investorName}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-gray-900">
                              {investorName}
                            </span>
                                                    )}

                                                    {r.investor?.email && (
                                                        <a
                                                            href={`mailto:${r.investor.email}`}
                                                            className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:underline"
                                                        >
                                                            {r.investor.email}
                                                        </a>
                                                    )}

                                                    <span
                                                        className={cls(
                                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                                            statusChipClass(r.status)
                                                        )}
                                                    >
                            {statusLabel(r.status)}
                          </span>
                                                </div>

                                                {r.message && (
                                                    <p className="line-clamp-2 text-[11px] text-gray-700">
                            <span className="font-semibold text-gray-800">
                              Message:{" "}
                            </span>
                                                        {r.message}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                                    <span>Requested {timeAgo(r.createdAt)}</span>
                                                    {r.updatedAt && (
                                                        <span>• Updated {timeAgo(r.updatedAt)}</span>
                                                    )}
                                                    <span>• ID #{r.id}</span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleReject(g.projectHash, r.id)}
                                                    disabled={!isPending || busy}
                                                    className={cls(
                                                        "rounded-lg border px-3 py-1.5 text-[11px] font-bold transition",
                                                        isPending && !busy
                                                            ? "border-gray-200 text-gray-700 hover:bg-white"
                                                            : "cursor-not-allowed border-gray-100 text-gray-300"
                                                    )}
                                                >
                                                    {busy && !isPending ? "…" : "Reject"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(g.projectHash, r.id)}
                                                    disabled={!isPending || busy}
                                                    className={cls(
                                                        "rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition",
                                                        isPending && !busy
                                                            ? "hover:shadow-md"
                                                            : "cursor-not-allowed opacity-60"
                                                    )}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                                    }}
                                                >
                                                    {busy ? "Updating…" : "Approve"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
