// app/profiles/[hash]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/* ---------------- BRAND (match homepage) ---------------- */
const BRAND = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
} as const;

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

/* ---------------- TYPES (aligned to /profiles/{hash}) ---------------- */
type ProfileType = "founder" | "investor";

type MediaRef = { id?: number | null; url?: string | null; type?: string | null; hash?: string | null } | null;

type Founder = {
    id?: number | null;
    yearsExpertise?: number | null;
    expertise?: string[] | null;
    notable?: string | null;
    personalWebsite?: string | null;
    fundingPreferences?: string[] | null;
    calendly?: string | null;
    hash?: string | null;
} | null;

type Investor = {
    id?: number | null;
    foundName?: string | null;
    fundWebsite?: string | null;
    stageFocus?: string[] | null;
    sector?: string[] | null;
    ticketSizeStart?: number | null;
    ticketSizeRangeEnd?: number | null;
    geographicFocus?: string[] | null;
    avgCheckSize?: number | null;
    assetsManagement?: number | null;
    previousInvestments?: string | null;
    leadInvestments?: number | null;
    accreditation?: string | null;
    personalWebsite?: string | null;
    preferredPartner?: string | null;
    pressLinks?: string[] | null;
    tesisDocuments?: MediaRef;
    hash?: string | null;
} | null;

type PublicProfile = {
    id: number;
    email: string | null;
    fullName?: string | null;
    title?: string | null;
    shortBio?: string | null;
    longBio?: string | null;
    social?: Record<string, string> | null;
    timeZone?: string | null;
    location?: { country?: string; state?: string } | null;
    picture?: MediaRef;
    banner?: MediaRef;
    roles?: Array<{ id: number; name: string; slug: string }> | null;
    founder?: Founder;
    investor?: Investor;
    lastLoginAt?: string | null;
    profileType?: ProfileType;
    profileHash?: string;
};

type ProjectListItem = {
    hash: string | null;
    title: string | null;
    categories?: string[] | null;
    image?: MediaRef;
};

/* ---------------- UTILS ---------------- */
const cn = (...classes: Array<string | boolean | undefined | null>) => classes.filter(Boolean).join(" ");

const currency = (n?: number | null) =>
    n == null
        ? "—"
        : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

async function safeJson(url: string, init?: RequestInit) {
    try {
        const res = await fetch(url, { cache: "no-store", ...init });
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson ? await res.json().catch(() => ({})) : null;
        if (!res.ok) {
            const msg =
                res.status === 404
                    ? "Profile not found."
                    : res.status >= 500
                        ? "Server error. Please try again."
                        : (data as any)?.message || "Unable to load profile.";
            return { ok: false as const, status: res.status, message: msg, data };
        }
        return { ok: true as const, status: res.status, data };
    } catch {
        return { ok: false as const, status: 0, message: "Network error. Check your connection.", data: null };
    }
}

/* ---------------- CHIPS ---------------- */
function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="inline-flex items-center rounded-full border-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:scale-105"
            style={{ borderColor: BRAND.primary, backgroundColor: `${BRAND.lightBlue}` }}
        >
            {children}
        </span>
    );
}

const ABS_URL = /^(?:https?:)?\/\//i;

function mediaUrl(u?: string | null) {
    if (!u) return "";
    if (u.startsWith("data:") || u.startsWith("blob:") || ABS_URL.test(u)) return u;
    return `${BE}${u.startsWith("/") ? "" : "/"}${u}`;
}

/* ---------------- SKELETON ---------------- */
function Skeleton() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND.darkBlue}, ${BRAND.primary})` }}>
                <div className="mx-auto max-w-6xl px-6 py-20">
                    <div className="animate-pulse">
                        <div className="h-48 w-full rounded-3xl bg-white/10" />
                        <div className="-mt-12 flex items-end gap-6">
                            <div className="h-32 w-32 rounded-2xl bg-white/20 ring-4 ring-white" />
                            <div className="space-y-3 pb-4">
                                <div className="h-4 w-32 rounded bg-white/20" />
                                <div className="h-8 w-64 rounded bg-white/20" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-48 rounded-2xl bg-white shadow-lg" />
                        <div className="h-96 rounded-2xl bg-white shadow-lg" />
                    </div>
                    <div className="space-y-6">
                        <div className="h-64 rounded-2xl bg-white shadow-lg" />
                        <div className="h-32 rounded-2xl bg-blue-50" />
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ---------------- PAGE ---------------- */
export default function PublicProfilePage() {
    const { hash } = useParams<{ hash: string }>();
    const [data, setData] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const res = await safeJson(`${BE}/profiles/${encodeURIComponent(hash)}`);
            console.log(res);
            if (!mounted) return;
            if (res.ok) {
                setData(res.data as PublicProfile);
            } else {
                setErr(res.message);
            }
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [hash]);

    const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
    const [projectsLoading, setProjectsLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            setProjectsLoading(true);
            const res = await safeJson(`${BE}/profiles/${encodeURIComponent(hash)}/projects`);
            if (!alive) return;
            if (res.ok) {
                setProjects((res.data as ProjectListItem[]) || []);
            } else {
                setProjects([]); // fail soft
            }
            setProjectsLoading(false);
        })();
        return () => { alive = false; };
    }, [hash]);

    if (loading) return <Skeleton />;

    if (err || !data) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <section className="mx-auto max-w-3xl px-6 py-32 text-center">
                    <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900">Unable to load profile</h1>
                    <p className="mt-4 text-lg text-gray-600">{err || "Unknown error."}</p>
                    <div className="mt-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                            style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.darkBlue})` }}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Homepage
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    const {
        fullName,
        title,
        location,
        timeZone,
        picture,
        banner,
        social,
        longBio,
        shortBio,
        profileType,
        founder,
        investor,
    } = data;

    const isFounder = profileType === "founder";
    const isInvestor = profileType === "investor";

    const locString = [location?.state, location?.country].filter(Boolean).join(", ");
    const avatar = mediaUrl(picture?.url) || "https://placehold.co/256x256?text=Avatar";
    const bannerUrl = mediaUrl(banner?.url);

    const expertise = (founder?.expertise || []) as string[];
    const fundingPrefs = (founder?.fundingPreferences || []) as string[];

    const stageFocus = (investor?.stageFocus || []) as string[];
    const sectors = (investor?.sector || []) as string[];
    const geos = (investor?.geographicFocus || []) as string[];
    const pressLinks = (investor?.pressLinks || []) as string[];

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Enhanced Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    {bannerUrl ? (
                        <img
                            src={bannerUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${BRAND.darkBlue}, ${BRAND.primary})` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
                    <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                    <div className="absolute -left-10 bottom-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-28">
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                        {/* Avatar */}
                        <div className="shrink-0">
                            <div className="group relative h-36 w-36 overflow-hidden rounded-2xl ring-4 ring-white shadow-2xl transition-transform hover:scale-105">
                                <img
                                    src={avatar}
                                    alt={fullName || "Profile"}
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = "https://placehold.co/256x256?text=Avatar";
                                    }}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-white">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide backdrop-blur-md">
                                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                                {isFounder ? "Founder Profile" : isInvestor ? "Investor Profile" : "Profile"}
                            </div>

                            <h1 className="mb-2 text-4xl font-black leading-tight sm:text-5xl">
                                {fullName || "Unnamed User"}
                            </h1>

                            {shortBio ? (
                                <div
                                    className="prose prose-invert mb-4 text-xl text-blue-100 max-w-none"
                                    dangerouslySetInnerHTML={{ __html: shortBio }}
                                />
                            ) : (
                                <p className="mb-4 text-xl text-blue-100">
                                    {title || ""}
                                </p>
                            )}

                            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-blue-100">
                                {locString && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z"/>
            </svg>
                                        {locString}
          </span>
                                )}
                                {timeZone && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
                                        {timeZone}
          </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {isFounder && founder?.calendly && (
                                    <a
                                        href={founder.calendly}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                                        style={{ background: `linear-gradient(135deg, ${BRAND.accent}, #34D399)` }}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Book a meeting
                                    </a>
                                )}
                                {isInvestor && investor?.fundWebsite && (
                                    <a
                                        href={investor.fundWebsite}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border-2 bg-white px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-xl"
                                        style={{ borderColor: BRAND.white, color: BRAND.primary }}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Visit fund website
                                    </a>
                                )}
                                {social?.linkedin && (
                                    <a
                                        href={social.linkedin}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        LinkedIn
                                    </a>
                                )}
                                {social?.website && (
                                    <a
                                        href={social.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* Body with improved cards */}
            <section className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About - Enhanced with HTML rendering */}
                        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg transition-all hover:shadow-2xl">
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">About</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                {longBio ? (
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: longBio }}
                                    />
                                ) : (
                                    <div className="rounded-xl bg-gray-50 p-6 text-center">
                                        <p className="text-gray-500">No bio provided yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Founder Snapshot - Enhanced */}
                        {isFounder && (
                            <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg transition-all hover:shadow-2xl">
                                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900">Founder Snapshot</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            }
                                            label="Years of Expertise"
                                            value={founder?.yearsExpertise ?? "—"}
                                        />
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            }
                                            label="Personal Website"
                                            value={founder?.personalWebsite ? <ExtLink href={founder.personalWebsite} /> : "—"}
                                        />
                                    </div>

                                    <FieldChips
                                        label="Expertise"
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        }
                                        items={expertise}
                                    />
                                    <FieldChips
                                        label="Funding Preferences"
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                        items={fundingPrefs}
                                    />

                                    {founder?.notable && (
                                        <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span className="text-sm font-bold uppercase tracking-wide text-blue-900">Notable Achievements</span>
                                            </div>
                                            <div
                                                className="prose prose-sm max-w-none text-gray-800"
                                                dangerouslySetInnerHTML={{ __html: founder.notable }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Investor Snapshot - Enhanced */}
                        {isInvestor && (
                            <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg transition-all hover:shadow-2xl">
                                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900">Investor Snapshot</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            }
                                            label="Fund / Firm"
                                            value={investor?.foundName || "—"}
                                        />
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            }
                                            label="Fund Website"
                                            value={investor?.fundWebsite ? <ExtLink href={investor.fundWebsite} /> : "—"}
                                        />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            }
                                            label="Ticket Size"
                                            value={`${currency(investor?.ticketSizeStart)}–${currency(investor?.ticketSizeRangeEnd)}`}
                                        />
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            }
                                            label="Avg Check Size"
                                            value={currency(investor?.avgCheckSize)}
                                        />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            }
                                            label="AUM"
                                            value={currency(investor?.assetsManagement)}
                                        />
                                        <StatCard
                                            icon={
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            }
                                            label="Lead Investments"
                                            value={investor?.leadInvestments ?? "—"}
                                        />
                                    </div>

                                    <FieldChips
                                        label="Stage Focus"
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        }
                                        items={stageFocus}
                                    />
                                    <FieldChips
                                        label="Sector Focus"
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        }
                                        items={sectors}
                                    />
                                    <FieldChips
                                        label="Geographic Focus"
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                        items={geos}
                                    />

                                    {investor?.accreditation && (
                                        <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
                                            <div className="mb-3 flex items-center gap-2">
                                                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                <span className="text-sm font-bold uppercase tracking-wide text-blue-900">Accreditation</span>
                                            </div>
                                            <p className="text-gray-800 leading-relaxed">{investor.accreditation}</p>
                                        </div>
                                    )}

                                    {investor?.previousInvestments && (
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Previous Investments
                                            </div>
                                            <div
                                                className="prose prose-sm max-w-none text-gray-700"
                                                dangerouslySetInnerHTML={{ __html: investor.previousInvestments }}
                                            />
                                        </div>
                                    )}

                                    {pressLinks.length > 0 && (
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                                </svg>
                                                Press & Media
                                            </div>
                                            <ul className="space-y-2">
                                                {pressLinks.map((u, i) => (
                                                    <li key={`${u}-${i}`} className="flex items-start gap-2">
                                                        <svg className="mt-1 h-4 w-4 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        <a href={u} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all hover:text-blue-900">
                                                            {u}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Projects (by profile) */}
                        <section className="mx-auto max-w-6xl px-6 pb-6">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-black text-gray-900">Projects</h2>
                            </div>

                            {projectsLoading ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                                            <div className="h-40 w-full bg-gray-100" />
                                            <div className="p-5 space-y-3">
                                                <div className="h-5 w-2/3 rounded bg-gray-100" />
                                                <div className="flex gap-2">
                                                    <div className="h-6 w-20 rounded-full bg-gray-100" />
                                                    <div className="h-6 w-24 rounded-full bg-gray-100" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !projects || projects.length === 0 ? (
                                <div className="rounded-xl border border-blue-100 bg-white p-8 text-center text-gray-600">
                                    No projects to show yet.
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {projects.map((p, idx) => (
                                        <ProjectCard key={`${p.hash}-${idx}`} project={p} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right: Contact / Links - Enhanced */}
                    <aside className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900">Quick Links</h4>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <LinkItem
                                    icon={
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    }
                                    label="Website"
                                    value={social?.website ? <ExtLink href={social.website} /> : "—"}
                                />
                                <LinkItem
                                    icon={
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                    }
                                    label="LinkedIn"
                                    value={social?.linkedin ? <ExtLink href={social.linkedin} /> : "—"}
                                />
                                {isFounder && (
                                    <LinkItem
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        }
                                        label="Calendly"
                                        value={founder?.calendly ? <ExtLink href={founder.calendly!} /> : "—"}
                                    />
                                )}
                                {isInvestor && (
                                    <LinkItem
                                        icon={
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        }
                                        label="Personal Site"
                                        value={investor?.personalWebsite ? <ExtLink href={investor.personalWebsite} /> : "—"}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border-2 bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-sm leading-relaxed text-blue-900" style={{ borderColor: BRAND.primary }}>
                            <div className="mb-3 flex items-center gap-2">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold uppercase tracking-wide">Privacy Notice</span>
                            </div>
                            <p className="text-blue-800">
                                This profile is publicly accessible via a unique hash. Only share the URL with people you want to connect with.
                            </p>
                        </div>

                        {/* Share Card */}
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900">Share Profile</h4>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="mb-4 text-sm text-gray-600">
                                    Share this profile with your network
                                </p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="w-full rounded-xl border-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm font-bold transition-all hover:from-blue-100 hover:to-purple-100"
                                    style={{ borderColor: BRAND.primary, color: BRAND.primary }}
                                >
                                    Copy Profile Link
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* Enhanced CTA Section */}
            <section className="relative overflow-hidden py-24" style={{ background: `linear-gradient(135deg, ${BRAND.darkBlue}, ${BRAND.primary})` }}>
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
                    />
                </div>
                <div className="absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-6 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 backdrop-blur-md">
                        <span className="text-2xl">🤝</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-white">Let's Connect</span>
                    </div>
                    <h3 className="mb-6 text-4xl font-black text-white sm:text-5xl">Ready to Connect?</h3>
                    <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100">
                        Use the contact information above to reach out. For platform support or to list your own project, visit our homepage.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                            style={{ color: BRAND.primary }}
                        >
                            <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Homepage
                        </Link>
                        <a
                            href="#/browse"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20"
                        >
                            Browse All Profiles
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ---------------- ENHANCED MINI COMPONENTS ---------------- */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="group overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5 transition-all hover:border-blue-300 hover:shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-blue-600">
                {icon}
                <div className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
    );
}

function LinkItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50">
            <div className="flex items-center gap-2 text-gray-600">
                {icon}
                <span className="text-sm font-semibold">{label}</span>
            </div>
            <div className="max-w-[60%] text-right text-sm font-medium text-gray-900">{value}</div>
        </div>
    );
}

function ExtLink({ href }: { href: string }) {
    const safe = href?.startsWith("http") ? href : `https://${href}`;
    const display = href.length > 30 ? href.substring(0, 30) + "..." : href;
    return (
        <a
            href={safe}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 underline transition-colors hover:text-blue-900"
            title={href}
        >
            {display}
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </a>
    );
}

function FieldChips({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                {icon}
                {label}
            </div>
            {items.length ? (
                <div className="flex flex-wrap gap-2">
                    {items.map((t, i) => (
                        <Chip key={`${t}-${i}`}>{t}</Chip>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Not specified</p>
            )}
        </div>
    );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
    const img = mediaUrl(project.image?.url) || "https://placehold.co/640x360?text=Project";
    const title = project.title || "Untitled Project";
    const cats = project.categories || [];
    const href = project.hash ? `/projects/${project.hash}` : "#";

    return (
        <Link
            href={href}
            className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        >
            <div className="relative h-40 w-full overflow-hidden">
                <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/640x360?text=Project"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">{title}</h3>
                {cats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {cats.slice(0, 3).map((c, i) => (
                            <span
                                key={`${c}-${i}`}
                                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-gray-700"
                                style={{ borderColor: BRAND.primary, backgroundColor: BRAND.lightBlue }}
                            >
                {c}
              </span>
                        ))}
                        {cats.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                +{cats.length - 3} more
              </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}