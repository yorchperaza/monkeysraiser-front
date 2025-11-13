"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import countriesData from "world-countries";
import { State } from "country-state-city";

/* ---------------- BRAND ---------------- */
const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

/* ---------------- SESSION / HEADER HELPERS (from your example) ---------------- */
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type RoleLite = { id: number | null; name: string | null; slug: string | null } | null;
type LocationLite = { country?: string | null; state?: string | null; city?: string | null; iso2?: string | null } | null;

type MeResponse = {
    id: number | null;
    hash?: string | null;
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

const BRAND = { primary: "#0066CC", darkBlue: "#003D7A" } as const;
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

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
    const path = String(u).replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}
function initials(name?: string | null): string {
    if (!name) return "U";
    const words = name.trim().split(/\s+/).slice(0, 2);
    return words.map(w => w[0]?.toUpperCase() ?? "").join("") || "U";
}
function fmtWhen(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function isAbortError(err: unknown): boolean {
    // cross-browser AbortError guard
    if (err instanceof DOMException) return err.name === "AbortError";
    return (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError");
}

async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
    const res = await fetch(`${BE}/me`, {
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

/* ---------------- TYPES (admin list) ---------------- */
type FundingStage = "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C" | "Growth";
type AdminStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
type BoostedMode = "include" | "exclude" | "only";
type AuthorLite = { id?: number | null; fullName?: string | null; email?: string | null } | null;

type AdminProjectRow = {
    id: number;
    hash: string;
    title: string;
    tagline: string | null;
    categories: string[] | null;
    founded: string | null;
    stage: FundingStage | null;
    foundingTarget: number | null;
    capitalSought: number | null;
    image: MediaLite;
    boost: boolean;
    superBoost: boolean;
    location: LocationLite;
    status: AdminStatus;
    publishDate: string | null;
    updateDate: string | null;
    author: AuthorLite;
};

type AdminListResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: AdminProjectRow[];
};

/* ---------------- CONSTANTS ---------------- */
const STAGES: FundingStage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];

const CATEGORIES = [
    "AI / ML","Analytics / BI","AR / VR / XR","Blockchain / Web3","ClimateTech",
    "Aerospace / SpaceTech","Autonomous Systems","Robotics","Drones","Clean Energy / Renewables",
    "Energy Storage / Batteries","Carbon / Offsets / MRV","Agriculture / AgTech","FoodTech","BioTech",
    "Synthetic Biology","HealthTech","Digital Health / Telemedicine","MedTech / Devices","Pharma / Drug Discovery",
    "FinTech","DeFi / Crypto Finance","InsurTech","PropTech / Real Estate","ConstructionTech","Manufacturing / Industry 4.0",
    "Advanced Materials","Semiconductors / Chips","IoT / Embedded","Edge Computing","Networking / 5G","Cybersecurity",
    "Privacy / Compliance","Developer Tools","SaaS / Productivity","SaaS / Infrastructure","Cloud / DevOps / Platform",
    "Open Source","Open Science","Data Infrastructure / Databases","MLOps / DataOps","E-commerce","Marketplaces",
    "RetailTech / POS","Logistics / Supply Chain","Mobility / Transportation","Automotive / EV","Aviation","Maritime",
    "Media / Entertainment","Gaming","Creator Economy","AdTech / MarTech","SalesTech / RevOps","HRTech / Future of Work",
    "EdTech","GovTech / Public Sector","LegalTech","Civic / Social Impact","Security / Defense","Travel / Hospitality",
    "Sports / Fitness","Consumer Social","Communication / Collaboration","Financial Services (Traditional)",
    "Nonprofit / Philanthropy","Localization / Translation","Quantum Tech","Wearables","Home / Smart Home","PetTech",
    "Fashion / BeautyTech","Gaming Infrastructure","Digital Identity","NFTs / Digital Assets","Search / Recommendations",
    "Personalization","Other"
];

const SORT_OPTIONS = [
    { value: "boost", label: "Featured First" },
    { value: "recent", label: "Most Recent" },
    { value: "alpha-asc", label: "A → Z (client)" },
    { value: "alpha-desc", label: "Z → A (client)" },
];

const STATUS_OPTIONS: AdminStatus[] = ["draft", "pending_review", "published", "rejected", "archived"];

const stageColors: Record<FundingStage, { bg: string; text: string; border: string }> = {
    "Pre-seed": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
    Seed: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
    "Series A": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
    "Series B": { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
    "Series C": { bg: "#FCE7F3", text: "#831843", border: "#EC4899" },
    Growth: { bg: "#E9D5FF", text: "#581C87", border: "#A855F7" },
};

/* ---------------- SHARED HELPERS ---------------- */
const currency = (n: number | null | undefined) =>
    n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fromBE = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BE}/${String(path).replace(/^\/+/, "")}`;
};

const iso2ToFlag = (iso?: string | null) => {
    if (!iso || iso.length !== 2) return "";
    const codePoints = iso.toUpperCase().split("").map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const formatLocation = (loc: LocationLite) => {
    if (!loc) return "—";
    // loc is an object: { country?, state?, iso2? }
    const parts = [loc.state || "", loc.country || ""].filter(Boolean).join(", ");
    const flag = iso2ToFlag(loc.iso2 || "");
    return parts ? `${flag ? flag + " " : ""}${parts}` : "—";
};

const COUNTRY_OPTIONS = countriesData
    .map(c => ({ label: c.name.common, iso2: (c.cca2 || c.cca3 || "").toUpperCase().slice(0, 2) }))
    .filter(c => c.iso2.length === 2)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const getStateOptions = (iso2?: string) => {
    if (!iso2 || iso2.length !== 2) return [];
    return (State.getStatesOfCountry(iso2) || [])
        .map(s => ({ label: s.name, code: s.isoCode }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
};

/* ---------------- SMALL UI ---------------- */
function StagePill({ stage }: { stage: FundingStage | null }) {
    if (!stage) return <span className="rounded-full border px-2 py-0.5 text-xs text-gray-500">—</span>;
    const st = stageColors[stage];
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
        >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.border }} />
            {stage}
    </span>
    );
}

function StatusBadge({ status }: { status: AdminStatus }) {
    const map: Record<AdminStatus, string> = {
        draft: "bg-gray-100 text-gray-700 border-gray-300",
        pending_review: "bg-yellow-50 text-yellow-800 border-yellow-300",
        published: "bg-green-50 text-green-800 border-green-300",
        rejected: "bg-red-50 text-red-800 border-red-300",
        archived: "bg-purple-50 text-purple-800 border-purple-300",
    };
    return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${map[status]}`}>{status.replace("_", " ")}</span>;
}

/* ---------------- ADMIN ROW ---------------- */
function AdminRow({
                      p,
                      onToggleBoost,
                      onToggleSuperBoost,
                      onChangeStatus,
                  }: {
    p: AdminProjectRow;
    onToggleBoost: (id: number, next: boolean) => Promise<void>;
    onToggleSuperBoost: (id: number, next: boolean) => Promise<void>;
    onChangeStatus: (id: number, status: AdminStatus) => Promise<void>;
}) {
    const img = fromBE(p.image?.url);

    return (
        <div
            className="
        grid
        grid-cols-[8rem_minmax(0,1fr)_auto]
        gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm
        md:grid-cols-[8rem_minmax(0,1fr)_auto]
      "
        >
            {/* === IMAGE COLUMN === */}
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={img}
                        alt={p.title}
                        className="block h-full w-full object-cover"
                    />
                ) : (
                    <div className="grid h-full w-full place-items-center text-gray-300">
                        No image
                    </div>
                )}
            </div>

            {/* === TEXT COLUMN === */}
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/projects/${p.hash}`}
                        className="truncate text-lg font-extrabold text-gray-900 hover:text-blue-600"
                        title={p.title}
                    >
                        {p.title}
                    </Link>

                    <StagePill stage={p.stage} />
                    <StatusBadge status={p.status} />

                    {p.superBoost && (
                        <span className="rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
              Super Boost
            </span>
                    )}

                    {!p.superBoost && p.boost && (
                        <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
              Featured
            </span>
                    )}
                </div>

                <div className="mt-1 line-clamp-1 text-sm text-gray-600">
                    {p.tagline || "—"}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
            >
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
              {formatLocation(p.location)}
          </span>

                    <span>•</span>

                    <span>
            Founded {p.founded ? new Date(p.founded).getFullYear() : "—"}
          </span>

                    <span>•</span>

                    <span>
            Seeking {currency(p.foundingTarget)} / Committed{" "}
                        {currency(p.capitalSought)}
          </span>

                    {p.author?.fullName && (
                        <>
                            <span>•</span>
                            <span>Author: {p.author.fullName}</span>
                        </>
                    )}
                </div>
            </div>

            {/* === RIGHT ACTIONS COLUMN === */}
            <div className="flex min-w-[220px] shrink-0 flex-col items-end justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggleBoost(p.id, !p.boost)}
                        className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                            p.boost
                                ? "border-blue-500 text-blue-600 bg-blue-50"
                                : "border-gray-200 text-gray-700 hover:border-blue-500"
                        }`}
                    >
                        {p.boost ? "Unfeature" : "Feature"}
                    </button>

                    <button
                        onClick={() => onToggleSuperBoost(p.id, !p.superBoost)}
                        className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                            p.superBoost
                                ? "border-amber-500 text-amber-700 bg-amber-50"
                                : "border-gray-200 text-gray-700 hover:border-amber-500"
                        }`}
                    >
                        {p.superBoost ? "Un-Super" : "Super Boost"}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={p.status}
                        onChange={(e) => onChangeStatus(p.id, e.target.value as AdminStatus)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s.replace("_", " ")}
                            </option>
                        ))}
                    </select>

                    <Link
                        href={`/projects/${p.hash}`}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-700 hover:border-blue-500"
                    >
                        View
                    </Link>

                    <Link
                        href={`/admin/projects/${p.hash}`}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-700 hover:border-purple-500"
                    >
                        Edit
                    </Link>
                </div>
            </div>
        </div>
    );
}


/* ---------------- FILTER SIDEBAR (ADMIN) ---------------- */
function AdminFilterSidebar({
                                selectedStages,
                                selectedCategories,
                                countryIso2,
                                stateCode,
                                loc,
                                statusSet,
                                boostedMode,
                                superOnly,
                                authorId,
                                onStageToggle,
                                onCategoryToggle,
                                onCountryChange,
                                onStateChange,
                                onLocChange,
                                onStatusToggle,
                                onBoostedModeChange,
                                onSuperOnlyChange,
                                onAuthorIdChange,
                                onClearAll,
                            }: {
    selectedStages: Set<string>;
    selectedCategories: Set<string>;
    countryIso2: string;
    stateCode: string;
    loc: string;
    statusSet: Set<AdminStatus>;
    boostedMode: BoostedMode;
    superOnly: boolean;
    authorId: string;
    onStageToggle: (stage: string) => void;
    onCategoryToggle: (category: string) => void;
    onCountryChange: (iso2: string) => void;
    onStateChange: (code: string) => void;
    onLocChange: (value: string) => void;
    onStatusToggle: (status: AdminStatus) => void;
    onBoostedModeChange: (m: BoostedMode) => void;
    onSuperOnlyChange: (v: boolean) => void;
    onAuthorIdChange: (v: string) => void;
    onClearAll: () => void;
}) {
    const [categorySearch, setCategorySearch] = useState("");
    const [showAllCategories, setShowAllCategories] = useState(false);
    const filteredCategories = useMemo(() => {
        if (!categorySearch) return CATEGORIES;
        const term = categorySearch.toLowerCase();
        return CATEGORIES.filter((c) => c.toLowerCase().includes(term));
    }, [categorySearch]);
    const displayedCategories = showAllCategories ? filteredCategories : filteredCategories.slice(0, 10);
    const countryLabel = useMemo(() => {
        if (!countryIso2) return "";
        const hit = COUNTRY_OPTIONS.find(c => c.iso2 === countryIso2);
        return hit?.label || "";
    }, [countryIso2]);

    const hasFilters =
        selectedStages.size > 0 ||
        selectedCategories.size > 0 ||
        countryIso2 ||
        stateCode ||
        loc ||
        statusSet.size > 0 ||
        boostedMode !== "include" ||
        superOnly ||
        authorId.trim() !== "";

    return (
        <aside className="space-y-6">
            {hasFilters && (
                <button
                    onClick={onClearAll}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                >
                    Clear All Filters
                </button>
            )}

            {/* Admin-only filters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Admin Filters</h3>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
                    <div className="space-y-1">
                        {STATUS_OPTIONS.map((s) => {
                            const checked = statusSet.has(s);
                            return (
                                <label key={s} className="flex cursor-pointer items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50">
                                    <input type="checkbox" checked={checked} onChange={() => onStatusToggle(s)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                                    <span className={checked ? "font-bold text-gray-900" : "text-gray-700"}>{s.replace("_", " ")}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Boosted</label>
                    <div className="space-y-1">
                        {(["include", "exclude", "only"] as BoostedMode[]).map((m) => (
                            <label key={m} className="flex cursor-pointer items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50">
                                <input type="radio" name="boostedMode" checked={boostedMode === m} onChange={() => onBoostedModeChange(m)} />
                                <span className="text-gray-700 capitalize">{m}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Super Only</label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50">
                        <input type="checkbox" checked={superOnly} onChange={(e) => onSuperOnlyChange(e.target.checked)} />
                        <span className="text-gray-700">Show only Super Boost</span>
                    </label>
                </div>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Author ID</label>
                    <input
                        type="number"
                        value={authorId}
                        onChange={(e) => onAuthorIdChange(e.target.value)}
                        placeholder="e.g., 123"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Location Filter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Location</h3>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Country</label>
                    <div className="relative">
                        <select
                            value={countryIso2}
                            onChange={(e) => onCountryChange(e.target.value.toUpperCase())}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">All countries</option>
                            {COUNTRY_OPTIONS.map((c) => (
                                <option key={c.iso2} value={c.iso2}>{iso2ToFlag(c.iso2)} {c.label}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">State / Province</label>
                    <div className="relative">
                        <select
                            value={stateCode}
                            onChange={(e) => onStateChange(e.target.value)}
                            disabled={!countryIso2}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">{countryIso2 ? `All in ${countryLabel}` : "Select country first"}</option>
                            {getStateOptions(countryIso2).map((s) => (
                                <option key={s.code} value={s.code}>{s.label}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Free-text Location</label>
                    <input
                        type="text"
                        value={loc}
                        onChange={(e) => onLocChange(e.target.value)}
                        placeholder="city, region..."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {(countryIso2 || stateCode || loc) && (
                    <button
                        onClick={() => { onCountryChange(""); onStateChange(""); onLocChange(""); }}
                        className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        Clear Location
                    </button>
                )}
            </div>

            {/* Funding Stage Filter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Funding Stage</h3>
                <div className="space-y-2">
                    {STAGES.map((stage) => {
                        const stageStyle = stageColors[stage];
                        const isSelected = selectedStages.has(stage);
                        return (
                            <label key={stage} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50">
                                <input type="checkbox" checked={isSelected} onChange={() => onStageToggle(stage)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                                    style={{ backgroundColor: isSelected ? stageStyle.bg : "transparent", color: stageStyle.text, borderColor: stageStyle.border }}
                                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageStyle.border }} />
                                    {stage}
                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Category Filter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Categories</h3>
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="max-h-96 space-y-1 overflow-y-auto">
                    {displayedCategories.map((category) => {
                        const isSelected = selectedCategories.has(category);
                        return (
                            <label key={category} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm transition hover:bg-gray-50">
                                <input type="checkbox" checked={isSelected} onChange={() => onCategoryToggle(category)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                                <span className={isSelected ? "font-bold text-blue-600" : "text-gray-700"}>{category}</span>
                            </label>
                        );
                    })}
                </div>

                {!categorySearch && filteredCategories.length > 10 && (
                    <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        {showAllCategories ? "Show Less" : `Show All (${CATEGORIES.length})`}
                    </button>
                )}
            </div>
        </aside>
    );
}

/* ---------------- TOP HEADER (pulls session via token) ---------------- */
function AdminHeaderBar() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        let alive = true;

        (async () => {
            try {
                const d = await fetchMe(ctrl.signal);
                if (alive) setMe(d);
            } catch (e) {
                if (alive && !isAbortError(e)) {
                    setErr(e instanceof Error ? e.message : "Unknown error");
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; ctrl.abort(); };
    }, []);

    const avatarUrl = useMemo(() => mediaUrl(me?.picture?.url || ""), [me]);
    const editHash = me?.founder?.hash ?? me?.investor?.hash ?? me?.hash ?? null;

    return (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl ring-4 ring-white shadow">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={me?.fullName ?? "User"} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-base font-black text-white">
                            {initials(me?.fullName)}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">{me?.fullName || (loading ? "Loading…" : "Unnamed user")}</div>
                    <div className="text-xs text-gray-600">{me?.email || "—"}</div>
                </div>
                {err && <span className="ml-3 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{err}</span>}
            </div>

            <div className="flex items-center gap-2">
                <span className="hidden text-xs text-gray-500 sm:block">Last login: <b className="text-gray-800">{fmtWhen(me?.lastLoginAt)}</b></span>
                <Link
                    href={editHash ? `/dashboard/profile/${editHash}` : "/dashboard/profile"}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50"
                >
                    Edit profile
                </Link>
            </div>
        </div>
    );
}

/* ---------------- PAGE ---------------- */
export default function AdminProjectsPage() {
    const searchParams = useSearchParams();

    const [rows, setRows] = useState<AdminProjectRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, perPage: 24, total: 0, pages: 0 });

    const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
    const [selectedSort, setSelectedSort] = useState(searchParams?.get("sort") || "boost");
    const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set(searchParams?.get("stage")?.split(",").filter(Boolean) || []));
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(searchParams?.get("category")?.split(",").filter(Boolean) || []));
    const [countryIso2, setCountryIso2] = useState((searchParams?.get("iso2") || "").toUpperCase().slice(0, 2));
    const [stateCode, setStateCode] = useState(searchParams?.get("state") || "");
    const [loc, setLoc] = useState(searchParams?.get("loc") || "");
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.get("page") || "1"));
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Admin-only filter states
    const [statusSet, setStatusSet] = useState<Set<AdminStatus>>(new Set((searchParams?.get("status") || "").split(",").filter(Boolean) as AdminStatus[]));
    const [boostedMode, setBoostedMode] = useState<BoostedMode>((searchParams?.get("boosted") as BoostedMode) || "include");
    const [superOnly, setSuperOnly] = useState((searchParams?.get("superOnly") || "0") === "1");
    const [authorId, setAuthorId] = useState(searchParams?.get("authorId") || "");

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(currentPage));
            params.set("perPage", "24");

            // backend sort only supports recent|boost (alpha sorts are client-side)
            if (selectedSort === "recent") params.set("sort", "recent");
            else if (selectedSort === "boost") params.set("sort", "boost");

            if (selectedStages.size > 0) params.set("stage", Array.from(selectedStages).join(","));
            if (selectedCategories.size > 0) params.set("category", Array.from(selectedCategories).join(","));
            if (searchQuery.trim()) params.set("q", searchQuery.trim());
            if (loc.trim()) params.set("loc", loc.trim());
            if (countryIso2) params.set("iso2", countryIso2);
            if (stateCode.trim()) params.set("state", stateCode.trim());

            // admin params
            if (statusSet.size > 0) params.set("status", Array.from(statusSet).join(","));
            if (boostedMode !== "include") params.set("boosted", boostedMode);
            if (superOnly) params.set("superOnly", "1");
            if (authorId.trim()) params.set("authorId", String(parseInt(authorId, 10)));

            const url = `${BE}/admin/projects?${params.toString()}`;
            const res = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json", ...authHeaders() },
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Failed to fetch admin projects (${res.status})`);

            const data: AdminListResponse = await res.json();
            let items = data.items || [];

            // client-side alpha sort fallback
            if (selectedSort === "alpha-asc") {
                items = [...items].sort((a, b) => a.title.localeCompare(b.title));
            } else if (selectedSort === "alpha-desc") {
                items = [...items].sort((a, b) => b.title.localeCompare(a.title));
            }

            setRows(items);
            setPagination({ page: data.page, perPage: data.perPage, total: data.total, pages: data.pages });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedSort, selectedStages, selectedCategories, searchQuery, loc, countryIso2, stateCode, statusSet, boostedMode, superOnly, authorId]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    // keep URL in sync
    useEffect(() => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set("page", String(currentPage));
        if (selectedSort !== "boost") params.set("sort", selectedSort);
        if (selectedStages.size > 0) params.set("stage", Array.from(selectedStages).join(","));
        if (selectedCategories.size > 0) params.set("category", Array.from(selectedCategories).join(","));
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (loc.trim()) params.set("loc", loc.trim());
        if (countryIso2) params.set("iso2", countryIso2);
        if (stateCode.trim()) params.set("state", stateCode.trim());

        if (statusSet.size > 0) params.set("status", Array.from(statusSet).join(","));
        if (boostedMode !== "include") params.set("boosted", boostedMode);
        if (superOnly) params.set("superOnly", "1");
        if (authorId.trim()) params.set("authorId", authorId.trim());

        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
    }, [currentPage, selectedSort, selectedStages, selectedCategories, searchQuery, loc, countryIso2, stateCode, statusSet, boostedMode, superOnly, authorId]);

    // handlers
    const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setCurrentPage(1); };
    const handleStageToggle = (stage: string) => { setSelectedStages(prev => { const next = new Set(prev); next.has(stage) ? next.delete(stage) : next.add(stage); return next; }); setCurrentPage(1); };
    const handleCategoryToggle = (cat: string) => { setSelectedCategories(prev => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; }); setCurrentPage(1); };
    const handleCountryChange = (iso2: string) => { setCountryIso2(iso2); setStateCode(""); setCurrentPage(1); };
    const handleStateChange = (code: string) => { setStateCode(code); setCurrentPage(1); };
    const handleLocChange = (value: string) => { setLoc(value); setCurrentPage(1); };
    const handleStatusToggle = (s: AdminStatus) => { setStatusSet(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; }); setCurrentPage(1); };
    const handleBoostedModeChange = (m: BoostedMode) => { setBoostedMode(m); setCurrentPage(1); };
    const handleSuperOnlyChange = (v: boolean) => { setSuperOnly(v); setCurrentPage(1); };
    const handleAuthorIdChange = (v: string) => { setAuthorId(v); setCurrentPage(1); };
    const handleClearAll = () => {
        setSelectedStages(new Set());
        setSelectedCategories(new Set());
        setSearchQuery("");
        setCountryIso2("");
        setStateCode("");
        setLoc("");
        setStatusSet(new Set());
        setBoostedMode("include");
        setSuperOnly(false);
        setAuthorId("");
        setCurrentPage(1);
    };
    const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); };

    // admin actions (now send the Bearer token)
    const adminUpdate = async (id: number, payload: Record<string, unknown>) => {
        const res = await fetch(`${BE}/admin/projects/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
            cache: "no-store",
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed (${res.status})`);
        return res.json();
    };

    const onToggleBoost = async (id: number, next: boolean) => {
        setRows(prev => prev.map(r => (r.id === id ? { ...r, boost: next } as AdminProjectRow : r)));
        try { await adminUpdate(id, { boost: next }); }
        catch (e) { setRows(prev => prev.map(r => (r.id === id ? { ...r, boost: !next } as AdminProjectRow : r))); console.error(e); }
    };

    const onToggleSuperBoost = async (id: number, next: boolean) => {
        setRows(prev => prev.map(r => (r.id === id ? { ...r, superBoost: next } as AdminProjectRow : r)));
        try { await adminUpdate(id, { superBoost: next }); }
        catch (e) { setRows(prev => prev.map(r => (r.id === id ? { ...r, superBoost: !next } as AdminProjectRow : r))); console.error(e); }
    };

    const onChangeStatus = async (id: number, status: AdminStatus) => {
        const prevRow = rows.find(r => r.id === id);
        setRows(prev => prev.map(r => (r.id === id ? { ...r, status } as AdminProjectRow : r)));
        try { await adminUpdate(id, { status }); }
        catch (e) { setRows(prev => prev.map(r => (r.id === id ? { ...r, status: (prevRow?.status || "draft") } as AdminProjectRow : r))); console.error(e); }
    };

    const activeFiltersCount =
        selectedStages.size +
        selectedCategories.size +
        (searchQuery ? 1 : 0) +
        (loc ? 1 : 0) +
        (countryIso2 ? 1 : 0) +
        (stateCode ? 1 : 0) +
        statusSet.size +
        (boostedMode !== "include" ? 1 : 0) +
        (superOnly ? 1 : 0) +
        (authorId.trim() ? 1 : 0);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <section className="relative overflow-hidden py-6" style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}>
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-6">
                    {/* Example-like top header pulling session from token */}
                    <AdminHeaderBar />

                    <div className="mt-6 mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="mb-1 text-4xl font-black text-gray-900 sm:text-5xl">Admin • Projects</h1>
                            <p className="text-gray-600">Moderate, feature, and manage all projects</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedSort}
                                    onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
                                    className="appearance-none rounded-xl border-2 border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-bold text-gray-700 outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 lg:hidden"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters
                                {activeFiltersCount > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{activeFiltersCount}</span>}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, description, keywords…"
                                className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-14 pr-32 text-base text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                            />
                            <svg className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6 py-2 text-sm font-bold text-white transition hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.darkBlue})` }}
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="hidden w-80 shrink-0 lg:block">
                        <div className="sticky top-24">
                            <AdminFilterSidebar
                                selectedStages={selectedStages}
                                selectedCategories={selectedCategories}
                                countryIso2={countryIso2}
                                stateCode={stateCode}
                                loc={loc}
                                statusSet={statusSet}
                                boostedMode={boostedMode}
                                superOnly={superOnly}
                                authorId={authorId}
                                onStageToggle={handleStageToggle}
                                onCategoryToggle={handleCategoryToggle}
                                onCountryChange={handleCountryChange}
                                onStateChange={handleStateChange}
                                onLocChange={handleLocChange}
                                onStatusToggle={handleStatusToggle}
                                onBoostedModeChange={handleBoostedModeChange}
                                onSuperOnlyChange={handleSuperOnlyChange}
                                onAuthorIdChange={handleAuthorIdChange}
                                onClearAll={handleClearAll}
                            />
                        </div>
                    </div>

                    {/* Mobile sidebar */}
                    {showMobileFilters && (
                        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
                            <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                    <button onClick={() => setShowMobileFilters(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <AdminFilterSidebar
                                    selectedStages={selectedStages}
                                    selectedCategories={selectedCategories}
                                    countryIso2={countryIso2}
                                    stateCode={stateCode}
                                    loc={loc}
                                    statusSet={statusSet}
                                    boostedMode={boostedMode}
                                    superOnly={superOnly}
                                    authorId={authorId}
                                    onStageToggle={handleStageToggle}
                                    onCategoryToggle={handleCategoryToggle}
                                    onCountryChange={handleCountryChange}
                                    onStateChange={handleStateChange}
                                    onLocChange={handleLocChange}
                                    onStatusToggle={handleStatusToggle}
                                    onBoostedModeChange={handleBoostedModeChange}
                                    onSuperOnlyChange={handleSuperOnlyChange}
                                    onAuthorIdChange={handleAuthorIdChange}
                                    onClearAll={handleClearAll}
                                />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing{" "}
                                <span className="font-bold text-gray-900">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1}
                </span>{" "}
                                -{" "}
                                <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.perPage, pagination.total)}</span>{" "}
                                of <span className="font-bold text-gray-900">{pagination.total}</span> projects
                            </p>
                        </div>

                        {loading && (
                            <div className="flex min-h-[300px] items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: brand.primary }} />
                                    <p className="mt-4 text-gray-600">Loading…</p>
                                </div>
                            </div>
                        )}

                        {!loading && rows.length === 0 && (
                            <div className="flex min-h-[300px] items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-4 text-xl font-bold text-gray-900">No projects found</h3>
                                    <p className="mt-2 text-gray-600">Adjust filters or search query</p>
                                    <button
                                        onClick={handleClearAll}
                                        className="mt-4 rounded-xl border-2 px-6 py-3 text-sm font-bold transition hover:bg-gray-50"
                                        style={{ borderColor: brand.primary, color: brand.primary }}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && rows.length > 0 && (
                            <div className="space-y-4">
                                {rows.map((p) => (
                                    <AdminRow
                                        key={p.id}
                                        p={p}
                                        onToggleBoost={onToggleBoost}
                                        onToggleSuperBoost={onToggleSuperBoost}
                                        onChangeStatus={onChangeStatus}
                                    />
                                ))}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 disabled:opacity-50 disabled:hover:border-gray-200"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                    .filter((page) => page === 1 || page === pagination.pages || Math.abs(page - pagination.page) <= 2)
                                    .map((page, idx, arr) => {
                                        const prevPage = arr[idx - 1];
                                        const showEllipsis = prevPage && page - prevPage > 1;
                                        return (
                                            <React.Fragment key={page}>
                                                {showEllipsis && <span className="px-2 text-gray-400">…</span>}
                                                <button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`rounded-lg border-2 px-4 py-2 text-sm font-bold transition ${
                                                        pagination.page === page ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-700 hover:border-blue-500"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 disabled:opacity-50 disabled:hover:border-gray-200"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
