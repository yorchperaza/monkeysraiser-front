"use client";

import React, { useMemo, useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import ImageGallery from "@/components/global/ImageGallery";

// Lazy load the chart component as it's below the fold
const FundingLineChart = dynamic(() => import("@/components/projects/Fundinglinechart"), {
    ssr: false,
    loading: () => (
        <div className="flex h-40 items-center justify-center">
            <div className="text-sm text-gray-400">Loading chart...</div>
        </div>
    ),
});

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

type FundingStage =
    | "Pre-seed"
    | "Seed"
    | "Series A"
    | "Series B"
    | "Series C"
    | "Growth";

const stageColors: Record<
    FundingStage,
    { bg: string; text: string; border: string }
> = {
    "Pre-seed": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
    Seed: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
    "Series A": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
    "Series B": { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
    "Series C": { bg: "#FCE7F3", text: "#831843", border: "#EC4899" },
    Growth: { bg: "#E9D5FF", text: "#581C87", border: "#A855F7" },
};

type AccessStatus = "unknown" | "none" | "requested" | "approved" | "rejected" | "revoked";

type MediaRef = {
    url: string | null;
    type: string | null;
    hash?: string | null;
    id?: number | null;
};

type UserLite = {
    id: number;
    fullName: string | null;
    email: string | null;
    picture: MediaRef | null;
    founderHash: string | null;
};

type LocationLike =
    | { country?: string | null; state?: string | null; iso2?: string | null }
    | string
    | null
    | undefined;

type ProjectDetail = {
    id: number | string;
    hash: string;
    name: string;
    tagline: string | null;
    stage: FundingStage;
    founded: string | null;
    category: string[] | null;
    elevatorPitch: string | null;
    problemStatement: string | null;
    solution: string | null;
    model: string | null;
    traction: string | null;
    teamSize: number | null;
    capitalSought: number | null;
    valuation: number | null;
    foundingTarget: number | null;
    previousAmountFunding: number | null;
    previousRound: string | null;
    previousRoundDate: string | null;
    status: string;
    publishDate: string | null;
    media: {
        logo: MediaRef | null;
        banner: MediaRef | null;
        gallery: MediaRef[] | null;
    };
    fundingHistory?:
        | Array<{
        date: string;
        committed: number;
    }>
        | undefined;

    author: UserLite | null;
    contributors?: UserLite[] | undefined;
    urls?: {
        demo?: string | null;
        deck?: string | null;
        website?: string | null;
        linkedin?: string | null;
        twitter?: string | null;
    };
    boost?: boolean | null;
    superBoost?: boolean | null;
    location?: LocationLike;
};

// --- utils ---
const currency = (n: number | null | undefined) =>
    n == null
        ? "—"
        : new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(n);

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const fromBE = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BE}/${String(path).replace(/^\/+/, "")}`;
};

// Memoized components
const RichBlock = memo(function RichBlock({
                                              html,
                                              className = "",
                                          }: {
    html: string | null | undefined;
    className?: string;
}) {
    if (!html) {
        return <div className={className}>—</div>;
    }
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
});

const profileHref = (hash?: string | null) =>
    hash ? `/profiles/${encodeURIComponent(hash)}` : null;

const PersonAvatar = memo(function PersonAvatar({
                                                    img,
                                                    alt,
                                                    size = 44,
                                                }: {
    img: string | null;
    alt: string;
    size?: number;
}) {
    const imgSrc = useMemo(() => fromBE(img), [img]);
    const initial = useMemo(() => alt?.trim()?.[0]?.toUpperCase() || "?", [alt]);

    return (
        <div
            className="overflow-hidden rounded-full border border-gray-200 bg-gray-100"
            style={{ width: size, height: size }}
        >
            {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imgSrc}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                    {initial}
                </div>
            )}
        </div>
    );
});

const PersonRow = memo(function PersonRow({
                                              u,
                                              badge,
                                              showEmail,
                                          }: {
    u: UserLite;
    badge?: string;
    showEmail?: boolean;
}) {
    const href = useMemo(() => profileHref(u.founderHash), [u.founderHash]);
    const displayName = u.fullName || u.email || "User";

    return (
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar img={u.picture?.url || null} alt={displayName} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold text-gray-900">
                            {u.fullName || "—"}
                        </div>
                        {badge ? (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                                {badge}
                            </span>
                        ) : null}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                        {showEmail ? (u.email || "—") : "Contact details locked, request access"}
                    </div>
                </div>
            </div>
            {href ? (
                <Link
                    href={href}
                    className="ml-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                >
                    View Profile
                </Link>
            ) : (
                <span className="ml-3 text-[11px] font-medium text-gray-400">
                    No profile
                </span>
            )}
        </div>
    );
});

const PeopleGrid = memo(function PeopleGrid({
                                                people,
                                                showEmail,
                                            }: {
    people: UserLite[];
    showEmail?: boolean;
}) {
    if (!Array.isArray(people) || people.length === 0) {
        return <div className="text-sm text-gray-400">No contributors yet</div>;
    }
    return (
        <div className="grid gap-3">
            {people.map((p) => (
                <PersonRow key={p.id} u={p} showEmail={showEmail} />
            ))}
        </div>
    );
});

// helper: convert YT link to embed src
function youtubeToEmbed(url?: string | null): string | null {
    if (!url) return null;
    const matchStandard = url.match(/youtube\.com\/watch\?v=([^&]+)/i);
    const matchShort = url.match(/youtu\.be\/([^?&]+)/i);
    const videoId =
        (matchStandard && matchStandard[1]) || (matchShort && matchShort[1]);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
}

// normalize deck & website to have protocol
function normalizedHttpUrl(u?: string | null): string | null {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
}

const QuickStats = memo(function QuickStats({
                                                founded,
                                                teamSize,
                                                stage,
                                            }: {
    founded: string | null;
    teamSize: number | null;
    stage: string;
}) {
    const foundedYear = useMemo(
        () => (founded ? new Date(founded).getFullYear() : "—"),
        [founded]
    );

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Founded
                </div>
                <div className="mt-1 text-xl font-black text-gray-900">
                    {foundedYear}
                </div>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-purple-600">
                    Team Size
                </div>
                <div className="mt-1 text-xl font-black text-gray-900">
                    {teamSize ? `${teamSize} people` : "—"}
                </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                    Stage
                </div>
                <div className="mt-1 text-xl font-black text-gray-900">
                    {stage}
                </div>
            </div>
        </div>
    );
});

const DemoVideo = memo(function DemoVideo({ embedSrc }: { embedSrc: string }) {
    return (
        <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-black text-gray-900">
                Product Demo
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-black shadow-md">
                <div className="aspect-video w-full">
                    <iframe
                        src={embedSrc}
                        title="Product Demo"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            </div>
        </div>
    );
});

const InvestmentDetails = memo(function InvestmentDetails({
                                                              foundingTarget,
                                                              previousAmountFunding,
                                                              valuation,
                                                              previousRound,
                                                              previousRoundDate,
                                                              status,
                                                              isSaved,
                                                              favBusy,
                                                              onToggleSave,
                                                              accessStatus,
                                                              accessBusy,
                                                              onRequestAccess,
                                                          }: {
    foundingTarget: number | null;
    previousAmountFunding: number | null;
    valuation: number | null;
    previousRound: string | null;
    previousRoundDate: string | null;
    status: string;
    isSaved: boolean;
    favBusy: boolean;
    onToggleSave: () => void;
    accessStatus: AccessStatus;
    accessBusy: boolean;
    onRequestAccess: () => void;
}) {
    const formattedDate = useMemo(
        () =>
            previousRoundDate
                ? new Date(previousRoundDate).toLocaleDateString()
                : null,
        [previousRoundDate]
    );

    const accessLabel = useMemo(() => {
        if (accessBusy) return "Requesting...";
        switch (accessStatus) {
            case "approved":
                return "Access Approved";
            case "requested":
                return "Request Pending Approval";
            case "rejected":
                return "Request Access Again";
            case "revoked":
                return "Request Access Again";
            case "none":
            case "unknown":
            default:
                return "Request Investor Access";
        }
    }, [accessStatus, accessBusy]);

    const accessDisabled =
        accessBusy || accessStatus === "approved" || accessStatus === "requested";

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h2 className="text-lg font-black text-gray-900">
                    Investment Details
                </h2>
            </div>
            <div className="p-6">
                <dl className="space-y-3 text-sm">
                    <div className="flex items-start justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <dt className="font-bold text-gray-700">Target Raise</dt>
                        <dd className="text-right font-black text-gray-900">
                            {currency(foundingTarget)}
                        </dd>
                    </div>

                    <div className="flex items-start justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <dt className="font-bold text-gray-700">Committed So Far</dt>
                        <dd className="text-right">
                            <div className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text font-black text-transparent">
                                {currency(previousAmountFunding)}
                            </div>
                        </dd>
                    </div>

                    <div className="flex items-start justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <dt className="font-bold text-gray-700">Valuation</dt>
                        <dd className="text-right font-black text-gray-900">
                            {currency(valuation)}
                        </dd>
                    </div>

                    <div className="flex items-start justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <dt className="font-bold text-gray-700">Previous Round</dt>
                        <dd className="text-right">
                            <div className="font-bold text-gray-900">
                                {previousRound || "—"}
                            </div>
                            {formattedDate && (
                                <div className="text-xs text-gray-500">
                                    {formattedDate}
                                </div>
                            )}
                        </dd>
                    </div>

                    <div className="flex items-start justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <dt className="font-bold text-gray-700">Status</dt>
                        <dd className="text-right">
                            <span className="font-bold text-gray-900">
                                {status === "pending_review"
                                    ? "Pending Review"
                                    : status}
                            </span>
                        </dd>
                    </div>
                </dl>

                <button
                    type="button"
                    onClick={onRequestAccess}
                    disabled={accessDisabled}
                    className={`mt-6 block w-full rounded-xl px-6 py-3 text-center text-base font-black text-white shadow-lg transition-all duration-300 ${
                        accessStatus === "approved"
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-xl"
                            : accessStatus === "requested"
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 hover:shadow-xl"
                                : "bg-gradient-to-r from-emerald-500 to-green-400 hover:-translate-y-0.5 hover:shadow-xl"
                    } disabled:opacity-60`}
                >
                    {accessLabel}
                </button>

                <button
                    type="button"
                    onClick={onToggleSave}
                    disabled={favBusy}
                    className={
                        isSaved
                            ? "mt-3 block w-full rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-3 text-center text-base font-black text-emerald-700 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-60"
                            : "mt-3 block w-full rounded-xl border-2 border-blue-200 bg-white px-6 py-3 text-center text-base font-bold text-gray-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
                    }
                    aria-busy={favBusy}
                >
                    {favBusy
                        ? "Saving…"
                        : isSaved
                            ? "Saved ✓ (Unsave)"
                            : "Save Project"}
                </button>
            </div>
        </div>
    );
});

const FounderLinks = memo(function FounderLinks({
                                                    deckUrl,
                                                    websiteUrl,
                                                    linkedinUrl,
                                                    twitterUrl,
                                                }: {
    deckUrl: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
}) {
    const hasAnyLink = deckUrl || websiteUrl || linkedinUrl || twitterUrl;

    if (!hasAnyLink) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h2 className="text-lg font-black text-gray-900">
                    Founder Links
                </h2>
            </div>

            <div className="p-6 space-y-3 text-sm">
                {deckUrl && (
                    <a
                        href={deckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow"
                    >
                        <span className="flex items-center gap-2 font-bold">
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 11V7m0 4l-2-2m2 2l2-2" />
                                <path d="M6 13V9a2 2 0 012-2h5l5 5v5a2 2 0 01-2 2h-3" />
                                <path d="M8 16h4" />
                            </svg>
                            Pitch Deck
                        </span>
                        <span className="truncate text-xs text-gray-500">
                            {deckUrl.replace(/^https?:\/\//, "")}
                        </span>
                    </a>
                )}

                {websiteUrl && (
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow"
                    >
                        <span className="flex items-center gap-2 font-bold">
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
                            </svg>
                            Website
                        </span>
                        <span className="truncate text-xs text-gray-500">
                            {websiteUrl.replace(/^https?:\/\//, "")}
                        </span>
                    </a>
                )}

                {linkedinUrl && (
                    <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow"
                    >
                        <span className="flex items-center gap-2 font-bold">
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4zM8 8h3.8v2.2h.1C12.5 8.9 14.4 8 16.7 8 21.4 8 24 10.9 24 16v8h-4v-7c0-2-.1-4.5-3-4.5-3 0-3.4 2.2-3.4 4.3V24H9v-16z" />
                            </svg>
                            LinkedIn
                        </span>
                        <span className="truncate text-xs text-gray-500">
                            {linkedinUrl.replace(/^https?:\/\//, "")}
                        </span>
                    </a>
                )}

                {twitterUrl && (
                    <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow"
                    >
                        <span className="flex items-center gap-2 font-bold">
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M22.23 5.924c-.793.352-1.644.59-2.538.697a4.442 4.442 0 001.953-2.453 8.902 8.902 0 01-2.812 1.086 4.418 4.418 0 00-7.52 4.03A12.54 12.54 0 013 4.897a4.418 4.418 0 001.367 5.902 4.389 4.389 0 01-2-.553v.056a4.418 4.418 0 003.546 4.33 4.43 4.43 0 01-2 .076 4.422 4.422 0 004.132 3.07A8.867 8.867 0 012 19.54 12.49 12.49 0 008.29 21c8.307 0 12.853-6.877 12.853-12.84 0-.196-.004-.393-.013-.586a9.15 9.15 0 002.24-2.33z" />
                            </svg>
                            Social
                        </span>
                        <span className="truncate text-xs text-gray-500">
                            {twitterUrl.replace(/^https?:\/\//, "")}
                        </span>
                    </a>
                )}
            </div>
        </div>
    );
});

const iso2ToFlag = (iso?: string | null) => {
    if (!iso || iso.length !== 2) return "";
    const codePoints = iso.toUpperCase().split("").map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const formatLocation = (loc: LocationLike) => {
    if (!loc) return "—";
    if (typeof loc === "string") return loc.trim() || "—";
    const parts = [loc.state || "", loc.country || ""].filter(Boolean).join(", ");
    const flag = iso2ToFlag(loc.iso2 || "");
    return parts ? `${flag ? flag + " " : ""}${parts}` : "—";
};

async function createProjectConversation(opts: {
    projectHash: string;
    token: string;
    subject?: string | null;
    participantIds?: number[];       // e.g., [project.author.id]
    participantEmails?: string[];    // or emails if you prefer
}) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(opts.projectHash)}/conversations`,
        {
            method: "POST",
            headers: { Authorization: `Bearer ${opts.token}` },
            body: (() => {
                const fd = new FormData();
                fd.set(
                    "data",
                    JSON.stringify({
                        subject: opts.subject ?? null,
                        participantIds: opts.participantIds ?? [],
                        participantEmails: opts.participantEmails ?? [],
                    })
                );
                return fd;
            })(),
        }
    );
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(
            res.status === 401
                ? "Please sign in."
                : res.status === 403
                    ? "You don't have permission to start a conversation for this project."
                    : `Create conversation failed (${res.status}): ${t || res.statusText}`
        );
    }
    return (await res.json()) as { hash: string };
}

async function postFirstMessage(opts: {
    conversationHash: string;
    token: string;
    subject?: string | null;
    message?: string | null;
    files?: File[]; // NEW
}) {
    // If your backend expects a different field name for files, change this:
    const ATTACH_FIELD = "attachments[]";

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversations/${encodeURIComponent(opts.conversationHash)}/messages`,
        {
            method: "POST",
            headers: { Authorization: `Bearer ${opts.token}` },
            body: (() => {
                const fd = new FormData();
                fd.set(
                    "data",
                    JSON.stringify({
                        subject: opts.subject ?? null,
                        message: opts.message ?? null,
                    })
                );
                (opts.files ?? []).forEach((file) => {
                    fd.append(ATTACH_FIELD, file, file.name);
                });
                return fd;
            })(),
        }
    );

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Post message failed (${res.status}): ${t || res.statusText}`);
    }
}

function MessageFounderCard({
                                token,
                                me,
                                project,
                            }: {
    token: string;
    me: { id: number; email: string } | null;
    project: ProjectDetail;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const canShow = !!token; // show only if logged in

    if (!canShow) {
        return (
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                    <h2 className="text-lg font-black text-gray-900">Contact Founder</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600">
                        Sign in to start a conversation with the founder.
                    </p>
                    <Link
                        href="/login"
                        className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow hover:bg-blue-700"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h2 className="text-lg font-black text-gray-900">Contact Founder</h2>
            </div>
            <div className="p-6">
                {!open ? (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-center text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        Message Founder
                    </button>
                ) : (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!token || !project?.hash) return;
                            setErr(null);
                            setBusy(true);
                            try {
                                // Target participant: the project owner (fallback to email if needed)
                                const ownerId = project.author?.id ?? null;

                                const conv = await createProjectConversation({
                                    projectHash: project.hash,
                                    token,
                                    subject: subject || `Inquiry about ${project.name}`,
                                    participantIds: ownerId ? [ownerId] : [],
                                    // If you prefer emails instead:
                                    // participantEmails: project.author?.email ? [project.author.email] : []
                                });

                                // Optional initial message
                                if (message?.trim() || files.length) {
                                    await postFirstMessage({
                                        conversationHash: conv.hash,
                                        token,
                                        subject: subject || null,
                                        message,
                                        files, // ✅ send attachments
                                    });
                                }

                                // Go to the conversation thread
                                router.push(`/dashboard/messages/${encodeURIComponent(conv.hash)}`);
                            } catch (e) {
                                setErr(e instanceof Error ? e.message : "Unknown error");
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="space-y-3"
                    >
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Subject</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder={`Inquiry about ${project.name}`}
                                className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Write your message to the founder…"
                                className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        {/* Attachments */}
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Attachments</label>
                            <AttachmentPicker files={files} setFiles={setFiles} />
                        </div>
                        {err && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {err}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-gray-300"
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={busy}
                                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow hover:bg-blue-700 disabled:opacity-60"
                            >
                                {busy ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const AttachmentPicker = memo(function AttachmentPicker({
                                                            files,
                                                            setFiles,
                                                        }: {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
    const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        if (!list.length) return;
        // De-duplicate by name + size
        const map = new Map<string, File>();
        [...files, ...list].forEach((f) => map.set(`${f.name}-${f.size}`, f));
        setFiles(Array.from(map.values()));
    };

    const removeAt = (idx: number) => {
        setFiles((arr) => arr.filter((_, i) => i !== idx));
    };

    return (
        <div className="mt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-400 bg-white px-3.5 py-2 text-sm font-bold text-gray-800 shadow-sm hover:border-gray-500">
                <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.2-9.19a3.5 3.5 0 015 5l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Attach files</span>
                <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onSelect}
                />
            </label>

            {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${f.size}-${i}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                        >
              <span className="truncate">
                {f.name} <span className="text-gray-500">({(f.size / 1024).toFixed(1)} KB)</span>
              </span>
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="ml-3 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 hover:border-gray-400"
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();

    // State
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string>("");
    const [me, setMe] = useState<{ id: number; email: string } | null>(null);
    const [meLoading, setMeLoading] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState(false);
    const [favBusy, setFavBusy] = useState(false);

    const [accessStatus, setAccessStatus] = useState<AccessStatus>("unknown");
    const [accessBusy, setAccessBusy] = useState(false);

    // Memoized values
    const projectHash = useMemo(() => (params as any)?.hash as string | undefined, [params]);

    const bannerUrl = useMemo(
        () => fromBE(project?.media?.banner?.url),
        [project?.media?.banner?.url]
    );

    const logoUrl = useMemo(
        () => fromBE(project?.media?.logo?.url),
        [project?.media?.logo?.url]
    );

    const safeStageStyle = useMemo(
        () =>
            project?.stage
                ? stageColors[project.stage as FundingStage] ?? {
                bg: "#E5E7EB",
                text: "#374151",
                border: "#9CA3AF",
            }
                : { bg: "#E5E7EB", text: "#374151", border: "#9CA3AF" },
        [project?.stage]
    );

    const urls = useMemo(() => project?.urls || {}, [project?.urls]);
    const demoEmbedSrc = useMemo(() => youtubeToEmbed(urls.demo), [urls.demo]);
    const deckUrl = useMemo(() => normalizedHttpUrl(urls.deck), [urls.deck]);
    const websiteUrl = useMemo(() => normalizedHttpUrl(urls.website), [urls.website]);
    const linkedinUrl = useMemo(() => normalizedHttpUrl(urls.linkedin), [urls.linkedin]);
    const twitterUrl = useMemo(() => normalizedHttpUrl(urls.twitter), [urls.twitter]);

    const galleryItems = useMemo(
        () => project?.media?.gallery ?? [],
        [project?.media?.gallery]
    );

    // Access control
    const isPending = project?.status === "pending_review";
    const isAuthor = !!me && !!project?.author && me.id === project.author.id;
    const isContributor = useMemo(
        () =>
            !!me &&
            Array.isArray(project?.contributors) &&
            project.contributors.some((c) => c.id === me.id),
        [me, project?.contributors]
    );
    const canView = !isPending || isAuthor || isContributor;
    const hasFullAccess =
        isAuthor || isContributor || accessStatus === "approved";
    // Load project by hash
    useEffect(() => {
        if (!projectHash) return;

        let mounted = true;

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(
                        projectHash
                    )}`
                );
                if (!res.ok) throw new Error("Project not found");
                const data = await res.json();
                console.log(data);
                if (mounted) setProject(data);
            } catch (e) {
                console.error("Error loading project:", e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [projectHash]);

    // Read auth token
    useEffect(() => {
        if (typeof window === "undefined") return;
        setToken(localStorage.getItem("auth_token") || "");
    }, []);

    // Check if project is favorited
    useEffect(() => {
        if (!projectHash || !token) {
            setIsSaved(false);
            return;
        }

        let aborted = false;

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(
                        projectHash
                    )}/favorite`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) {
                    if (!aborted) setIsSaved(false);
                    return;
                }
                const data = await res.json();
                if (!aborted) setIsSaved(!!data.favorited);
            } catch {
                if (!aborted) setIsSaved(false);
            }
        })();

        return () => {
            aborted = true;
        };
    }, [projectHash, token]);

    // Fetch current user
    useEffect(() => {
        if (!token) {
            setMe(null);
            return;
        }

        let mounted = true;

        (async () => {
            try {
                setMeLoading(true);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/me`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) {
                    if (mounted) setMe(null);
                    return;
                }
                const data = await res.json();
                if (mounted) setMe({ id: data.id, email: data.email });
            } catch {
                if (mounted) setMe(null);
            } finally {
                if (mounted) setMeLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [token]);

    // Load my access status for this project
    useEffect(() => {
        if (!projectHash || !token) {
            setAccessStatus("none");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(
                    `${BE}/projects/${encodeURIComponent(projectHash)}/access/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!res.ok) {
                    if (!cancelled) setAccessStatus("none");
                    return;
                }
                const data = await res.json();
                if (cancelled) return;

                const status = (data?.status as AccessStatus | undefined) ?? "none";
                if (data?.hasAccess) {
                    setAccessStatus("approved");
                } else {
                    setAccessStatus(status);
                }
            } catch {
                if (!cancelled) setAccessStatus("none");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [projectHash, token]);

    // Toggle save handler with useCallback
    const toggleSave = useCallback(async () => {
        if (!project) return;
        if (!token) {
            alert("Please sign in to save projects.");
            return;
        }

        const h = project.hash;
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(
            h
        )}/favorite`;
        const method = isSaved ? "DELETE" : "POST";

        setFavBusy(true);
        setIsSaved((v) => !v); // optimistic

        try {
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setIsSaved((v) => !v);
                alert(
                    res.status === 401
                        ? "Please sign in."
                        : res.status === 404
                            ? "Project not found."
                            : "We couldn't update your favorites."
                );
                return;
            }

            if (typeof data?.favorited === "boolean") {
                setIsSaved(data.favorited);
            }
        } catch {
            setIsSaved((v) => !v);
            alert("Network error. Please try again.");
        } finally {
            setFavBusy(false);
        }
    }, [project, token, isSaved]);

    const handleRequestAccess = useCallback(async () => {
        if (!project) return;

        // Not logged in -> go to /login
        if (!token) {
            router.push("/login");
            return;
        }

        setAccessBusy(true);
        try {
            const res = await fetch(
                `${BE}/projects/${encodeURIComponent(project.hash)}/access/request`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                alert("We couldn't send your access request. Please try again.");
                return;
            }

            const status = (data?.status as AccessStatus | undefined) ?? "requested";
            const hasAccess = !!data?.hasAccess;

            if (hasAccess || status === "approved") {
                setAccessStatus("approved");
            } else {
                setAccessStatus(status || "requested");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setAccessBusy(false);
        }
    }, [project, token, router]);

    // Loading states
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <div className="mt-4 text-gray-600">Loading project...</div>
                </div>
            </div>
        );
    }

    if (isPending && meLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <div className="mt-4 text-gray-600">Checking access…</div>
                </div>
            </div>
        );
    }

    if (isPending && !canView) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white px-6">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-black text-gray-900">
                        Access Restricted
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        This project is currently under review. Only the owner and
                        contributors can view it.
                    </p>

                    {!token ? (
                        <Link
                            href="/login"
                            className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-blue-700"
                        >
                            Sign in to continue
                        </Link>
                    ) : (
                        <Link
                            href="/projects"
                            className="mt-6 inline-flex items-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600"
                        >
                            ← Back to projects
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-900">
                        Project not found
                    </h1>
                    <Link
                        href="/projects"
                        className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                    >
                        ← Back to projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden border-b border-blue-100">
                <div className="relative w-full">
                    <div className="relative h-64 w-full md:h-80 lg:h-[480px]">
                        {bannerUrl ? (
                            <Image
                                src={bannerUrl}
                                alt={`${project.name} banner`}
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
                        )}

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                        {/* Boost badges (top-right) */}
                        {project.superBoost ? (
                            <span className="absolute right-6 top-6 z-20 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg">
      ⭐ Super Boost
    </span>
                        ) : project.boost ? (
                            <span className="absolute right-6 top-6 z-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg">
      ⭐ Featured
    </span>
                        ) : null}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
                        <div className="mx-auto flex max-w-7xl items-end gap-6">
                            {logoUrl && (
                                <div
                                    className="relative flex items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl"
                                    style={{
                                        width: "160px",
                                        height: "96px",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt={`${project.name} logo`}
                                        className="block h-full w-full object-contain"
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                    <Link
                                        href={`/projects?stage=${encodeURIComponent(project.stage)}`}
                                        className="inline-block rounded-lg border-2 px-3 py-1 text-xs font-black uppercase tracking-wide shadow-sm transition-all hover:scale-105 hover:shadow-md"
                                        style={{
                                            backgroundColor: safeStageStyle.bg,
                                            borderColor: safeStageStyle.border,
                                            color: safeStageStyle.text,
                                        }}
                                    >
                                        {project.stage}
                                    </Link>

                                    {project.category?.length ? (
                                        <div className="flex gap-2">
                                            {project.category.map((cat, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={`/projects?category=${encodeURIComponent(cat)}`}
                                                    className="rounded-lg border-2 border-white/50 bg-white/90 px-3 py-1 text-xs font-bold text-gray-700 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-md"
                                                >
                                                    {cat}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <h1 className="text-3xl font-black text-white drop-shadow-lg md:text-4xl lg:text-5xl">
                                    {project.name}
                                </h1>
                                <RichBlock
                                    className="mt-2 text-lg font-medium text-white/95 drop-shadow-md [&_*]:text-white [&_*]:drop-shadow-md"
                                    html={project.tagline}
                                />
                                {/* Location row */}
                                <div className="mt-3 flex items-center gap-3 text-sm text-white/90">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/20">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span className="font-semibold">
                                      {formatLocation(project.location ?? null)}
                                    </span>
                                  </span>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PAGE BODY */}
            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* LEFT COLUMN */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Quick Stats */}
                        <QuickStats
                            founded={project.founded}
                            teamSize={project.teamSize}
                            stage={project.stage}
                        />

                        {/* Demo video */}
                        {demoEmbedSrc && <DemoVideo embedSrc={demoEmbedSrc} />}

                        {/* Gallery */}
                        <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
                            <h2 className="mb-6 text-2xl font-black text-gray-900">
                                Gallery
                            </h2>
                            <ImageGallery images={galleryItems} fromBE={fromBE} />
                        </div>

                        {/* Overview */}
                        <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
                            <h2 className="mb-6 text-2xl font-black text-gray-900">
                                Overview
                            </h2>
                            <div className="space-y-6 text-sm leading-relaxed text-gray-700">
                                {project.elevatorPitch && (
                                    <div>
                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                            Elevator Pitch
                                        </div>
                                        <RichBlock
                                            className="prose prose-sm max-w-none text-gray-900 [&_*]:text-gray-900"
                                            html={project.elevatorPitch}
                                        />
                                    </div>
                                )}

                                {project.problemStatement && (
                                    <div>
                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                            Problem
                                        </div>
                                        <RichBlock
                                            className="prose prose-sm max-w-none text-gray-700 [&_*]:text-gray-700"
                                            html={project.problemStatement}
                                        />
                                    </div>
                                )}

                                {project.solution && (
                                    <div>
                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                            Solution
                                        </div>
                                        <RichBlock
                                            className="prose prose-sm max-w-none text-gray-700 [&_*]:text-gray-700"
                                            html={project.solution}
                                        />
                                    </div>
                                )}

                                {project.model && (
                                    <div>
                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                            Business Model
                                        </div>
                                        <RichBlock
                                            className="prose prose-sm max-w-none text-gray-700 [&_*]:text-gray-700"
                                            html={project.model}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Traction */}
                        <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
                            <h2 className="mb-6 text-2xl font-black text-gray-900">
                                Traction
                            </h2>

                            <RichBlock
                                className="mb-6 prose prose-sm max-w-none leading-relaxed text-gray-700 [&_*]:text-gray-700"
                                html={project.traction}
                            />
                        </div>

                        {/* Team */}
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                                <h2 className="text-lg font-black text-gray-900">
                                    Team
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                        Owner
                                    </div>
                                    {project.author ? (
                                        <PersonRow
                                            u={project.author}
                                            badge="Owner"
                                            showEmail={hasFullAccess}
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-400">—</div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                        Contributors
                                    </div>
                                    <PeopleGrid
                                        people={project.contributors || []}
                                        showEmail={hasFullAccess}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                        <MessageFounderCard token={token} me={me} project={project} />

                        <InvestmentDetails
                            foundingTarget={project.foundingTarget}
                            previousAmountFunding={project.previousAmountFunding}
                            valuation={project.valuation}
                            previousRound={project.previousRound}
                            previousRoundDate={project.previousRoundDate}
                            status={project.status}
                            isSaved={isSaved}
                            favBusy={favBusy}
                            onToggleSave={toggleSave}
                            accessStatus={accessStatus}
                            accessBusy={accessBusy}
                            onRequestAccess={handleRequestAccess}
                        />

                        <FounderLinks
                            deckUrl={hasFullAccess ? deckUrl : null}
                            websiteUrl={hasFullAccess ? websiteUrl : null}
                            linkedinUrl={hasFullAccess ? linkedinUrl : null}
                            twitterUrl={hasFullAccess ? twitterUrl : null}
                        />

                        {/* Disclaimer card */}
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                                <h2 className="text-lg font-black text-gray-900">
                                    Disclaimer
                                </h2>
                            </div>

                            <div className="p-6 text-xs leading-relaxed text-yellow-800">
                                <div className="mb-3 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-yellow-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div className="text-[11px] font-black uppercase tracking-wide text-yellow-800">
                                        Important Disclaimer
                                    </div>
                                </div>
                                <p className="text-[12px] leading-relaxed text-gray-700">
                                    This profile contains founder-provided information for
                                    investor discovery and does not constitute a securities
                                    offering. Always perform independent due diligence before
                                    investing.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}