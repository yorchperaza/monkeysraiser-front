"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardUI } from "@/context/DashboardUIContext";

/* ========== Types ========== */
type BadgeKey = "projects" | "unreadMessages" | "plans";

type SidebarCounts = Partial<Record<BadgeKey, number>> & {
    users?: number;
};

type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type RoleLite = { id: number | null; name: string | null; slug: string | null } | null;
type LocationLite = { country?: string; state?: string; city?: string; iso2?: string } | null;

type MeResponse = {
    id: number | null;
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

/* ========== Nav ========== */
const nav: Array<{ href: string; label: string; icon: string; badge?: BadgeKey }> = [
    { href: "/dashboard", label: "Overview", icon: "home" },
    { href: "/dashboard/projects", label: "Projects", icon: "grid", badge: "projects" },
    { href: "/projects", label: "Browse projects", icon: "search" },
    { href: "/dashboard/messages", label: "Messages", icon: "inbox", badge: "unreadMessages" },
    { href: "/dashboard/plans", label: "Plans", icon: "plans", badge: "plans" },
];

/* ========== Utils ========== */
const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

function Icon({ name, className }: { name: string; className?: string }) {
    switch (name) {
        case "menu":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            );
        case "home":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2 7-7 7 7m-14 0v10a1 1 0 001 1h3m10-11l2 2v10a1 1 0 01-1 1h-3" />
                </svg>
            );
        case "grid":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6m2 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2z"
                    />
                </svg>
            );
        case "search":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="6" strokeWidth={2} />
                    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 16l4 4" />
                </svg>
            );
        case "inbox":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
            );
        case "users":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7a4 4 0 11-8 0 4 4 0 018 0zm8 14v-1a6 6 0 00-9-5.2M15 21H3v-1a6 6 0 0112 0v1z"
                    />
                </svg>
            );
        case "user":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 10-8 0m8 0a4 4 0 01-8 0m8 0v6H8v-6m4-9a4 4 0 110 8 4 4 0 010-8z" />
                </svg>
            );
        case "settings":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317a1 1 0 011.35-.936l.724.241a8.05 8.05 0 012.518 0l.724-.241a1 1 0 011.35.936l.138.76c.137.753.52 1.44 1.09 1.948l.57.5a1 1 0 010 1.49l-.57.5a4.99 4.99 0 00-1.09 1.948l-.138.76a1 1 0 01-1.35.936l-.724-.241a8.05 8.05 0 01-2.518 0l-.724.241a1 1 0 01-1.35-.936l-.138-.76z"
                    />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        case "logout":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                    />
                </svg>
            );
        case "plans":
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.25 7.5L12 12 3.75 7.5M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0v9a2.25 2.25 0 01-1.125 1.944l-7.5 4.2a2.25 2.25 0 01-2.25 0l-7.5-4.2A2.25 2.25 0 013 16.5v-9M12 12v9"
                    />
                </svg>
            );
        default:
            return null;
    }
}

function initials(name?: string | null) {
    if (!name) return "U";
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("") || "U"
    );
}

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

function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = (u || "").replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}

function isAbortError(err: unknown): boolean {
    if (err instanceof DOMException) return err.name === "AbortError";
    return typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError";
}

/* ========== Data ========== */
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
    const raw = (await res.json()) as Partial<MeResponse>;
    return {
        id: raw.id ?? null,
        fullName: raw.fullName ?? null,
        title: raw.title ?? null,
        shortBio: raw.shortBio ?? null,
        longBio: raw.longBio ?? null,
        social: raw.social && typeof raw.social === "object" ? raw.social : null,
        timeZone: raw.timeZone ?? null,
        location: raw.location && typeof raw.location === "object" ? (raw.location as LocationLite) : null,
        email: raw.email ?? null,
        picture: raw.picture ?? null,
        banner: raw.banner ?? null,
        roles: Array.isArray(raw.roles) ? raw.roles : [],
        lastLoginAt: raw.lastLoginAt ?? null,
        founder: raw.founder ?? null,
        investor: raw.investor ?? null,
    };
}

/* ========== Component ========== */
export default function Sidebar({ counts }: { counts?: SidebarCounts }) {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarOpen, toggleSidebar } = useDashboardUI();

    const [me, setMe] = useState<MeResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        let alive = true;

        fetchMe(ctrl.signal)
            .then((d) => {
                if (alive) setMe(d);
            })
            .catch((e) => {
                if (alive && !isAbortError(e)) setErr(e instanceof Error ? e.message : "Unknown error");
            });

        return () => {
            alive = false;
            ctrl.abort();
        };
    }, []);

    const avatarSrc = useMemo(() => mediaUrl(me?.picture?.url || ""), [me]);

    const roleSlugs = useMemo(
        () => (me?.roles ?? []).map((r) => (r?.slug || "").toString().toLowerCase()),
        [me?.roles]
    );
    const isAdmin = roleSlugs.includes("admin");
    const canSeeFounder = isAdmin || roleSlugs.includes("founder");
    const canSeeInvestor = isAdmin || roleSlugs.includes("investor");

    const founderHash = (me?.founder?.hash ?? "").trim() || null;
    const investorHash = (me?.investor?.hash ?? "").trim() || null;

    const editHash = founderHash ?? investorHash;
    const hasAnyProfile = Boolean(editHash);

    const defaultType: "founder" | "investor" = canSeeInvestor && !canSeeFounder ? "investor" : "founder";

    const profileHref = hasAnyProfile
        ? `/dashboard/profile/${encodeURIComponent(editHash!)}`
        : `/dashboard/profile/create`;
    const profileLabel = hasAnyProfile ? "Profile" : "Create profile";
    const profileTitle = hasAnyProfile ? "Edit profile" : "Create your profile";

    const displayName = me?.fullName || "User";
    const displayEmail = me?.email || "";

    const handleSignOut = () => {
        try {
            localStorage.removeItem("auth_token");
        } catch {}
        router.push("/login");
    };

    return (
        <aside
            className={cx(
                "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white shadow-lg transition-all duration-300",
                sidebarOpen ? "w-64" : "w-20"
            )}
        >
            <div className="flex h-16 items-center justify-between border-b px-4">
                <Link href="/dashboard" className="flex items-center">
                    <div className={cx("flex items-center", sidebarOpen ? "h-12" : "h-10")}>
                        <img src="/logo.svg" alt="Logo" className={cx("block h-full", sidebarOpen ? "w-auto" : "w-10")} height={48} />
                    </div>
                </Link>
                <button onClick={toggleSidebar} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Toggle sidebar">
                    <Icon name="menu" className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {nav.map((item) => {
                    const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const badgeValue = item.badge ? (counts?.[item.badge] ?? 0) : 0;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cx(
                                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                                active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <Icon name={item.icon} className="h-5 w-5" />
                            {sidebarOpen && <span>{item.label}</span>}
                            {sidebarOpen && item.badge && badgeValue > 0 && (
                                <span
                                    className={cx(
                                        "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
                                        item.badge === "unreadMessages" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                    )}
                                >
                                    {badgeValue}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t p-4">
                {err && <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div>}

                <div className="flex items-center gap-3">
                    {avatarSrc ? (
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                            <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                            {initials(displayName)}
                        </div>
                    )}

                    {sidebarOpen && (
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-gray-900">{displayName}</div>
                            {displayEmail && <div className="truncate text-xs text-gray-500">{displayEmail}</div>}
                        </div>
                    )}
                </div>

                <div className={cx("mt-3 grid gap-2", sidebarOpen ? "grid-cols-1" : "grid-cols-1")}>
                    <Link
                        href={profileHref}
                        className={cx(
                            "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                            "border-gray-200 text-gray-800 hover:bg-gray-50"
                        )}
                        title={profileTitle}
                    >
                        <Icon name="user" className="h-4 w-4" />
                        {sidebarOpen && <span>{profileLabel}</span>}
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className={cx(
                            "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                            "border-red-200 text-red-700 hover:bg-red-50"
                        )}
                        title="Sign out"
                    >
                        <Icon name="logout" className="h-4 w-4" />
                        {sidebarOpen && <span>Sign out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
