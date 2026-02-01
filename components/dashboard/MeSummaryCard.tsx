"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import RichHtml from "@/components/global/RichHtml";

/* ===================== Types ===================== */
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type RoleLite = { id: number | null; name: string | null; slug: string | null } | null;
type LocationLite = { country?: string; state?: string; city?: string; iso2?: string } | null;

export type MeResponse = {
    id: number | null;
    hash?: string | null; // optional profile edit hash (fallback)
    fullName: string | null;
    title: string | null;
    shortBio: string | null;
    longBio: string | null;
    social: Record<string, unknown> | null;
    timeZone: string | null;
    location: LocationLite;
    email: string | null;
    picture: MediaLite;
    banner: MediaLite;
    roles: RoleLite[];
    lastLoginAt: string | null;
    founder?: { hash?: string | null } | null;
    investor?: { hash?: string | null } | null;
};

/* ===================== Utils ===================== */
const BRAND = { primary: "#0066CC", darkBlue: "#003D7A" } as const;
const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

function getToken(): string {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}
function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = u.replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}
function shortLocation(loc?: LocationLite) {
    if (!loc) return "—";
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length ? parts.join(", ") : loc.iso2 || "—";
}
function initials(name?: string | null): string {
    if (!name) return "U";
    const words = name.trim().split(/\s+/).slice(0, 2);
    return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
}
function fmtWhen(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function isAbortError(err: unknown): boolean {
    if (err instanceof DOMException) return err.name === "AbortError";
    return (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError");
}

/* ===================== Data ===================== */
async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me`, {
        headers: { Accept: "application/json", ...authHeaders() },
        signal,
        cache: "no-store",
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to load profile (${res.status}): ${text || res.statusText}`);
    }
    const data = (await res.json()) as Partial<MeResponse>;
    return {
        id: data.id ?? null,
        hash: data.hash ?? null,
        fullName: data.fullName ?? null,
        title: data.title ?? null,
        shortBio: data.shortBio ?? null,
        longBio: data.longBio ?? null,
        social: (typeof data.social === "object" && data.social) ? data.social : null,
        timeZone: data.timeZone ?? null,
        location: (data.location && typeof data.location === "object") ? (data.location as LocationLite) : null,
        email: data.email ?? null,
        picture: data.picture ?? null,
        banner: data.banner ?? null,
        roles: Array.isArray(data.roles) ? data.roles : [],
        lastLoginAt: data.lastLoginAt ?? null,
        founder: data.founder ?? null,
        investor: data.investor ?? null,
    };
}

/* ===================== Component ===================== */
export default function MeSummaryCard({ className, user }: { className?: string; user?: MeResponse | null }) {
    const [me, setMe] = useState<MeResponse | null>(user ?? null);
    const [loading, setLoading] = useState(!user);
    const [err, setErr] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Sync prop changes
    useEffect(() => {
        if (user) {
            setMe(user);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) return; // Skip fetch if user provided

        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        let alive = true;

        setLoading(true);
        setErr(null);

        fetchMe(ctrl.signal)
            .then((d) => { if (alive) setMe(d); })
            .catch((e: unknown) => {
                if (!alive || isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            })
            .finally(() => { if (alive) setLoading(false); });

        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [user]);

    const bannerUrl = useMemo(() => mediaUrl(me?.banner?.url || ""), [me]);
    const avatarUrl = useMemo(() => mediaUrl(me?.picture?.url || ""), [me]);

    // Role gates
    const roleSlugs = useMemo(
        () => (me?.roles ?? []).map((r) => (r?.slug || "").toString().toLowerCase()),
        [me?.roles]
    );
    const isAdmin = roleSlugs.includes("admin");
    const canSeeFounder = isAdmin || roleSlugs.includes("founder");
    const canSeeInvestor = isAdmin || roleSlugs.includes("investor");

    // Existing profile hashes (view pages)
    const founderHash = me?.founder?.hash || null;
    const investorHash = me?.investor?.hash || null;

    // Edit hash (if any), else we'll route to create
    const editHash = founderHash ?? investorHash ?? me?.hash ?? null;

    // Final action URL + label
    const hasAnyProfile = Boolean(founderHash || investorHash || editHash);
    const actionHref = hasAnyProfile
        ? `/dashboard/profile/${editHash}`
        : `/dashboard/profile/create`;
    const actionLabel = hasAnyProfile ? "Edit profile" : "Create profile";

    if (loading && !me) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-32 w-full animate-pulse bg-gradient-to-r from-slate-100 to-slate-200" />
            </div>
        );
    }

    return (
        <section className={cx("overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>
            {/* Banner */}
            <div className="relative h-36 w-full">
                {bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-blue-600 to-blue-400" />
                )}
            </div>

            <div className="p-5">
                {err && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {err}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative -mt-14 h-20 w-20 overflow-hidden rounded-2xl ring-4 ring-white shadow-lg">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt={me?.fullName ?? "User"} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black text-white">
                                    {initials(me?.fullName)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{me?.fullName || "Unnamed user"}</h2>
                            <p className="text-sm text-gray-600">{me?.title || "—"}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        {founderHash && (
                            <Link
                                href={`/profiles/${founderHash}`}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                            >
                                View founder profile
                            </Link>
                        )}
                        {investorHash && (
                            <Link
                                href={`/profiles/${investorHash}`}
                                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-100"
                            >
                                View investor profile
                            </Link>
                        )}

                        <Link
                            href={actionHref}
                            className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
                        >
                            {actionLabel}
                        </Link>
                    </div>
                </div>

                {/* Meta grid */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Email</div>
                        <div className="mt-1 font-medium text-gray-900">{me?.email || "—"}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Location</div>
                        <div className="mt-1 font-medium text-gray-900">{shortLocation(me?.location)}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Time zone</div>
                        <div className="mt-1 font-medium text-gray-900">{me?.timeZone || "—"}</div>
                    </div>
                </div>

                {/* Bio */}
                {(me?.shortBio || me?.longBio) && (
                    <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
                        {me?.shortBio && (
                            <div className="mb-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                                <RichHtml html={me.shortBio} small />
                            </div>
                        )}
                        {me?.longBio && <RichHtml html={me.longBio} />}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                    <div>
                        Last login:{" "}
                        <span className="font-semibold text-gray-900">{fmtWhen(me?.lastLoginAt)}</span>
                    </div>
                    {!hasAnyProfile && (
                        <div className="rounded-lg bg-blue-50 px-3 py-1 font-semibold text-blue-800">
                            You don’t have a public profile yet — let’s create one.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
