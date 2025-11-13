"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

/** backend absolute URL helper */
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const absUrl = (u?: string | null) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;           // already absolute
    const path = u.startsWith("/") ? u : `/${u}`;    // ensure leading slash
    return `${BE}${path}`;
};

const getToken = () => {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
};

/** shape we expect back from /auth/me (normalized) */
type UserLike = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: "founder" | "investor" | "admin" | string;
    founderHash?: string | null;
    investorHash?: string | null;
};

export default function Header() {
    const router = useRouter();

    // nav/menu ui state
    const [open, setOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);

    // auth state
    const [user, setUser] = useState<UserLike | null>(null);

    // unread badge state
    const [unread, setUnread] = useState<number>(0);

    // fetch current user ONCE on mount using the stored token
    useEffect(() => {
        async function loadUser() {
            try {
                const token = getToken();

                if (!token) {
                    setUser(null);
                    setUnread(0);
                    return;
                }

                const res = await fetch(`${BE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    // token invalid / expired
                    setUser(null);
                    setUnread(0);
                    return;
                }

                const data = await res.json();
                // normalize into the shape Header expects
                setUser({
                    name: data.name ?? data.full_name ?? data.fullName ?? null,
                    email: data.email ?? null,
                    // prefer picture.url, fall back to avatar_url, and make absolute
                    image: absUrl(data.picture?.url ?? data.avatar_url ?? null),
                    role: data.role ?? null,
                    founderHash: data.founder?.hash ?? null,
                    investorHash: data.investor?.hash ?? null,
                });
            } catch {
                setUser(null);
                setUnread(0);
            }
        }

        loadUser();
    }, []);

    // fetch unread count (poll while logged in)
    useEffect(() => {
        if (!user) {
            return;
        }

        let timer: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;

        const fetchUnread = async () => {
            const token = getToken();
            if (!token) return; // don't set state here
            try {
                const res = await fetch(`${BE}/me/messages/unread-count`, {
                    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                    cache: "no-store",
                });
                if (!res.ok) return;
                const json = await res.json();
                const n = Number(json?.unread ?? 0);
                if (!Number.isNaN(n) && !cancelled) setUnread(n);
            } catch {
                // ignore
            }
        };

        // initial + poll
        fetchUnread();
        timer = setInterval(fetchUnread, 30000);

        return () => {
            cancelled = true;
            if (timer) clearInterval(timer);
        };
    }, [user]);

    // Compute the profile target once we have user
    const profileHref = useMemo(() => {
        if (!user) return "/login";
        if (user.founderHash) return `/profiles/${user.founderHash}`;
        if (user.investorHash) return `/profiles/${user.investorHash}`;
        return "/dashboard/profile/create";
    }, [user]);

    // sign out clears both storages we rely on
    function handleSignOut() {
        try {
            localStorage.removeItem("auth_token");
        } catch {
            /* ignore */
        }

        // drop cookie token (best-effort; backend httpOnly cookie is better later)
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";

        // optional: also close menus
        setAvatarOpen(false);
        setOpen(false);

        // also reset unread
        setUnread(0);

        // redirect to login (also triggers middleware on protected pages)
        router.push("/login");
    }

    const brand = { primary: "#0066CC", darkBlue: "#003D7A" };
    const unreadBadge = unread > 0
        ? (unread > 99 ? "+99" : String(unread))
        : null;

    return (
        <header className="sticky top-0 z-50 border-b border-white/20 bg-white shadow-sm backdrop-blur-lg">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Left: logo + primary nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="MonkeysRaiser" width={160} height={38} />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-6 md:flex">
                        <Link href="/projects" className="text-sm font-medium text-gray-600 transition hover:text-blue-600">
                            Browse Projects
                        </Link>
                        <Link href="/investors" className="text-sm font-medium text-gray-600 transition hover:text-blue-600">
                            For Investors
                        </Link>
                        <Link href="/pricing" className="text-sm font-medium text-gray-600 transition hover:text-blue-600">
                            Pricing
                        </Link>

                        {/* When logged in, show extra sections */}
                        {user && (
                            <>
                                <Link href="/dashboard" className="text-sm font-medium text-gray-600 transition hover:text-blue-600">
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/projects"
                                    className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
                                >
                                    My Projects
                                </Link>
                                <Link
                                    href="/dashboard/messages"
                                    className="relative text-sm font-medium text-gray-600 transition hover:text-blue-600"
                                >
                                    Messages
                                    {unreadBadge && (
                                        <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                                            {unreadBadge}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: auth actions */}
                <div className="hidden items-center gap-3 md:flex">
                    {!user ? (
                        <>
                            <Link
                                href="/login"
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                            >
                                Sign in
                            </Link>

                            <Link
                                href="/register"
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                List Your Project
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/dashboard/projects/new"
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                New Project
                            </Link>

                            {/* Avatar dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setAvatarOpen((v) => !v)}
                                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 transition hover:bg-gray-50"
                                    aria-haspopup="menu"
                                    aria-expanded={avatarOpen}
                                >
                                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                                        {user.image ? (
                                            <Image alt="avatar" fill src={user.image} unoptimized className="object-cover" />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-600">
                                                {(user.name ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <span className="hidden text-sm font-semibold text-gray-700 sm:inline">
                                        {user.name ?? user.email ?? "Account"}
                                    </span>

                                    <svg
                                        className={`h-4 w-4 text-gray-500 transition ${avatarOpen ? "rotate-180" : ""}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.207l3.71-3.976a.75.75 0 111.08 1.04l-4.24 4.54a.75.75 0 01-1.08 0l-4.24-4.54a.75.75 0 01.02-1.06z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>

                                {avatarOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
                                        role="menu"
                                    >
                                        {/* Profile goes to existing founder/investor profile; if none, to create */}
                                        <Link
                                            href={profileHref}
                                            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            role="menuitem"
                                            onClick={() => setAvatarOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href="/dashboard/plans"
                                            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            role="menuitem"
                                            onClick={() => setAvatarOpen(false)}
                                        >
                                            Plans
                                        </Link>
                                        <div className="my-1 h-px bg-gray-100" />
                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                                            role="menuitem"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 md:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none">
                        {open ? (
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </nav>

            {/* Mobile menu */}
            {open && (
                <div className="border-t border-gray-100 bg-white md:hidden">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="grid gap-2">
                            <Link href="/projects" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Browse Projects
                            </Link>
                            <Link href="/investors" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                For Investors
                            </Link>
                            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Pricing
                            </Link>

                            {!user ? (
                                <>
                                    <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/submit"
                                        className="rounded-lg px-3 py-2 text-sm font-bold text-white"
                                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                    >
                                        List Your Project
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="my-2 h-px bg-gray-100" />
                                    <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Dashboard
                                    </Link>
                                    <Link href="/me/projects" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        My Projects
                                    </Link>
                                    <Link href="/messages" className="relative rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Messages
                                        {unreadBadge && (
                                            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white align-middle">
                                                {unreadBadge}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        href="/dashboard/projects/new"
                                        className="rounded-lg px-3 py-2 text-sm font-bold text-white"
                                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                    >
                                        New Project
                                    </Link>
                                    <div className="my-2 h-px bg-gray-100" />
                                    {/* Mobile Profile uses the same computed href */}
                                    <Link href={profileHref} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Profile
                                    </Link>
                                    <Link href="/me/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Settings
                                    </Link>
                                    <Link href="/billing" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Billing
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                                    >
                                        Sign out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
