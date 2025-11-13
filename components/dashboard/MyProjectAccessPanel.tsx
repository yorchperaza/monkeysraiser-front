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

type LocationLite =
    | { country?: string; state?: string; city?: string; iso2?: string }
    | string
    | null;

type LatestRequestLite = {
    id: number;
    status: string;
    message: string | null;
    createdAt: string;
    updatedAt: string | null;
} | null;

type InvestorAccessProject = {
    projectId: number;
    projectHash: string | null;
    projectName: string | null;
    stage: string | null;
    location: LocationLite;
    hasAccess: boolean;
    status: AccessStatus | string;
    latestRequest: LatestRequestLite;
};

type MeAccessProjectsResponse = {
    items: InvestorAccessProject[];
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

function shortLocation(loc: LocationLite) {
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

async function myProjectAccessPanel(opts: {
    signal?: AbortSignal;
}): Promise<InvestorAccessProject[]> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/me/access/projects`,
        {
            method: "GET",
            headers: { Accept: "application/json", ...authHeaders() },
            signal: opts.signal,
        }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) {
            throw new Error("Please sign in to view your project access (401).");
        }
        throw new Error(
            `My access projects fetch failed (${res.status}): ${
                text || res.statusText
            }`
        );
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid /me/access/projects JSON payload");
    }

    const d = data as Partial<MeAccessProjectsResponse>;
    if (!d || !Array.isArray(d.items)) return [];
    return d.items as InvestorAccessProject[];
}

/* ========= Main dashboard panel (INVESTOR) ========= */

export default function MyProjectAccessPanel({
                                                 className,
                                             }: {
    className?: string;
}) {
    const [items, setItems] = useState<InvestorAccessProject[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        setErr(null);
        setItems(null);

        (async () => {
            try {
                const projects = await myProjectAccessPanel({ signal: ctrl.signal });
                setItems(projects);
            } catch (e) {
                if (isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();

        return () => ctrl.abort();
    }, []);

    function statusChipClass(status: string, hasAccess: boolean) {
        const s = status.toLowerCase();
        if (hasAccess || s === "approved") {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
        if (s === "requested") return "bg-amber-50 text-amber-700 border-amber-200";
        if (s === "rejected" || s === "revoked")
            return "bg-red-50 text-red-700 border-red-200";
        if (s === "none") return "bg-slate-50 text-slate-700 border-slate-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    }

    function statusLabel(status: string, hasAccess: boolean) {
        const s = status.toLowerCase();
        if (hasAccess || s === "approved") return "Access granted";
        if (s === "requested") return "Pending approval";
        if (s === "rejected") return "Rejected";
        if (s === "revoked") return "Access revoked";
        if (s === "none") return "No request";
        return status;
    }

    const totalProjects = items?.length ?? 0;
    const grantedCount =
        items?.filter((p) => p.hasAccess || p.status.toLowerCase() === "approved")
            .length ?? 0;

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
                        My project access
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">
                        See the projects you&apos;ve requested access to and where access has
                        been granted.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-gray-700">
          <span className="rounded-full bg-gray-100 px-2.5 py-1">
            {totalProjects} projects
          </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {grantedCount} with access
          </span>
                </div>
            </div>

            {/* Error */}
            {err && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {err}
                </div>
            )}

            {/* Loading */}
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

            {/* Empty */}
            {!loading && (!items || items.length === 0) && !err && (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-xs text-gray-600">
                    You haven&apos;t requested access to any projects yet. When you request
                    access, projects will appear here.
                </div>
            )}

            {/* List */}
            {!loading && items && items.length > 0 && (
                <div className="mt-4 space-y-3">
                    {items.map((p) => {
                        const latest = p.latestRequest;
                        const projectStatus = statusLabel(p.status, p.hasAccess);
                        const statusClass = statusChipClass(p.status, p.hasAccess);

                        return (
                            <div
                                key={p.projectId}
                                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-800 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={
                                                p.projectHash ? `/projects/${p.projectHash}` : "#"
                                            }
                                            className="text-sm font-bold text-gray-900 hover:underline"
                                        >
                                            {p.projectName ?? p.projectHash ?? "Untitled project"}
                                        </Link>

                                        <span
                                            className={cls(
                                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                                statusClass
                                            )}
                                        >
                      {projectStatus}
                    </span>
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5">
                      📍 {shortLocation(p.location)}
                    </span>
                                        {p.stage && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {p.stage}
                      </span>
                                        )}
                                    </div>

                                    {latest && (
                                        <div className="mt-2 space-y-0.5 text-[11px] text-gray-700">
                                            {latest.message && (
                                                <p className="line-clamp-2">
                          <span className="font-semibold text-gray-800">
                            Your message:{" "}
                          </span>
                                                    {latest.message}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                                <span>Requested {timeAgo(latest.createdAt)}</span>
                                                {latest.updatedAt && (
                                                    <span>• Updated {timeAgo(latest.updatedAt)}</span>
                                                )}
                                                <span>• Request ID #{latest.id}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={
                                            p.projectHash ? `/projects/${p.projectHash}` : "#"
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-white"
                                    >
                                        View project
                                    </Link>
                                    {p.hasAccess && p.projectHash && (
                                        <Link
                                            href={`/dashboard/projects/${p.projectHash}`}
                                            className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                            }}
                                        >
                                            Open workspace
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
