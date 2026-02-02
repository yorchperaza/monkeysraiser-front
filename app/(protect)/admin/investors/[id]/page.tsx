"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import countriesData from "world-countries";

/* ---------------- ENV ---------------- */
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    white: "#FFFFFF",
};

/* ---------------- TYPES ---------------- */
type MediaLite = { id: number | null; url: string | null } | null;

type InvestorDetail = {
    id: string;
    fundName: string;
    verified: boolean;
    linkedin: string | null;
    website: string | null;
    description: string | null;
    valueAdd: string | null;
    firmType: string | null;
    globalHq: string | null;
    fundingStages: string | null;
    checkSizeMin: number | null;
    checkSizeMax: number | null;
    targetCountries: string | null;
    team: string | null;
    sourcePage: string | null;
    logo: MediaLite;
    created: string | null;
    updated: string | null;
};

/* ---------------- CONSTANTS ---------------- */
const FIRM_TYPES = [
    "VC",
    "Corporate VC",
    "Angel network",
    "Solo angel",
    "Incubator, Accelerator",
    "Startup studio",
    "Family office",
    "PE fund",
    "Public fund",
    "Other",
];

const FUNDING_STAGES = [
    "Idea or Patent",
    "Prototype",
    "Early Revenue",
    "Scaling",
    "Growth",
    "Pre-IPO",
];

const COUNTRY_OPTIONS = countriesData
    .map((c) => ({ label: c.name.common, iso2: (c.cca2 || c.cca3 || "").toUpperCase().slice(0, 2) }))
    .filter((c) => c.iso2.length === 2)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

/* ---------------- HELPERS ---------------- */
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

const mediaUrl = (u?: string | null) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `${BE}/${String(u).replace(/^\/+/, "")}`;
};

const currency = (n: number | null | undefined) =>
    n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/* ---------------- COMPONENTS ---------------- */
function VerifiedBadge({ verified }: { verified: boolean }) {
    return verified ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Verified
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600">
            Unverified
        </span>
    );
}

/* ---------------- PAGE ---------------- */
export default function AdminInvestorEditPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [investor, setInvestor] = useState<InvestorDetail | null>(null);

    // File state
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);

    // Fetch investor data
    useEffect(() => {
        if (!id) return;
        const ctrl = new AbortController();

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const res = await fetch(`${BE}/open-vc-investors/${id}`, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                    cache: "no-store",
                });
                if (!res.ok) {
                    throw new Error(`Failed to load investor (${res.status})`);
                }
                const data = await res.json();
                setInvestor({
                    id: data.id,
                    fundName: data.fundName || "",
                    verified: !!data.verified,
                    linkedin: data.linkedin || null,
                    website: data.website || null,
                    description: data.description || null,
                    valueAdd: data.valueAdd || null,
                    firmType: data.firmType || null,
                    globalHq: data.globalHq || null,
                    fundingStages: data.fundingStages || null,
                    checkSizeMin: data.checkSizeMin ?? null,
                    checkSizeMax: data.checkSizeMax ?? null,
                    targetCountries: data.targetCountries || null,
                    team: data.team || null,
                    sourcePage: data.sourcePage || null,
                    logo: data.logo || null,
                    created: data.created || null,
                    updated: data.updated || null,
                });
            } catch (e: any) {
                if (e.name !== "AbortError") {
                    setErr(e.message || "Unknown error");
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => ctrl.abort();
    }, [id]);

    // Helper to update investor state
    const merge = <K extends keyof InvestorDetail>(key: K, value: InvestorDetail[K]) =>
        setInvestor((prev) => (prev ? { ...prev, [key]: value } : prev));

    // Parse JSON fields for display - extract clean values from various formats
    // Helper to safely convert to string
    const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');
    
    const parsedFirmType = useMemo(() => {
        if (!investor?.firmType) return [];
        // Already an array?
        if (Array.isArray(investor.firmType)) return investor.firmType;
        const ft = toStr(investor.firmType);
        if (!ft) return [];
        try {
            const parsed = JSON.parse(ft);
            return Array.isArray(parsed) ? parsed : [ft];
        } catch {
            // Could be semicolon-delimited or single value
            if (ft.includes(";")) {
                return ft.split(";").map(s => s.trim()).filter(Boolean);
            }
            return [ft];
        }
    }, [investor?.firmType]);

    // Helper to extract clean stage name without numbering (e.g., "1. Idea or Patent" -> "Idea or Patent")
    const cleanStageName = (s: unknown): string => {
        if (typeof s !== 'string') return String(s || '');
        return s.replace(/^\d+\.\s*/, "").trim();
    };

    const parsedFundingStages = useMemo(() => {
        if (!investor?.fundingStages) return [];
        // Already an array?
        if (Array.isArray(investor.fundingStages)) return investor.fundingStages.map(cleanStageName);
        const fs = toStr(investor.fundingStages);
        if (!fs) return [];
        // fundingStages is stored as semicolon-delimited string like "1. Idea or Patent; 2. Prototype"
        if (fs.includes(";")) {
            return fs.split(";").map(s => cleanStageName(s)).filter(Boolean);
        }
        try {
            const parsed = JSON.parse(fs);
            return Array.isArray(parsed) ? parsed.map(cleanStageName) : [];
        } catch {
            // Single value
            return [cleanStageName(fs)];
        }
    }, [investor?.fundingStages]);

    const parsedCountries = useMemo(() => {
        if (!investor?.targetCountries) return [];
        // Already an array?
        if (Array.isArray(investor.targetCountries)) return investor.targetCountries.map(c => cleanStageName(c));
        const tc = toStr(investor.targetCountries);
        if (!tc) return [];
        // targetCountries is stored as semicolon-delimited string like "1. USA; 2. Canada"
        if (tc.includes(";")) {
            return tc.split(";").map(s => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
        }
        try {
            const parsed = JSON.parse(tc);
            return Array.isArray(parsed) ? parsed.map(c => cleanStageName(c)) : [];
        } catch {
            return [tc.replace(/^\d+\.\s*/, "").trim()];
        }
    }, [investor?.targetCountries]);

    // Check if a firm type is selected (handles different formats)
    const isFirmTypeActive = (type: string) => {
        return parsedFirmType.some(t => t.toLowerCase() === type.toLowerCase());
    };

    // Check if a funding stage is selected
    const isStageActive = (stage: string) => {
        return parsedFundingStages.some(s => s.toLowerCase().includes(stage.toLowerCase()) || stage.toLowerCase().includes(s.toLowerCase()));
    };

    // Check if a country is selected
    const isCountryActive = (country: string) => {
        return parsedCountries.some(c => c.toLowerCase() === country.toLowerCase());
    };

    // Toggle multi-select items
    const toggleFirmType = (type: string) => {
        const isActive = isFirmTypeActive(type);
        const updated = isActive 
            ? parsedFirmType.filter((t) => t.toLowerCase() !== type.toLowerCase())
            : [...parsedFirmType, type];
        merge("firmType", JSON.stringify(updated));
    };

    const toggleFundingStage = (stage: string) => {
        const isActive = isStageActive(stage);
        const updated = isActive 
            ? parsedFundingStages.filter((s) => !s.toLowerCase().includes(stage.toLowerCase()) && !stage.toLowerCase().includes(s.toLowerCase()))
            : [...parsedFundingStages, stage];
        // Store as semicolon-delimited for consistency
        merge("fundingStages", updated.join("; "));
    };

    const toggleCountry = (country: string) => {
        const isActive = isCountryActive(country);
        const updated = isActive 
            ? parsedCountries.filter((c) => c.toLowerCase() !== country.toLowerCase())
            : [...parsedCountries, country];
        merge("targetCountries", updated.join("; "));
    };

    // Build save payload
    const buildPayload = (): Record<string, any> => {
        if (!investor) return {};
        return {
            fundName: investor.fundName,
            verified: investor.verified,
            linkedin: investor.linkedin,
            website: investor.website,
            description: investor.description,
            valueAdd: investor.valueAdd,
            firmType: investor.firmType,
            globalHq: investor.globalHq,
            fundingStages: investor.fundingStages,
            checkSizeMin: investor.checkSizeMin,
            checkSizeMax: investor.checkSizeMax,
            targetCountries: investor.targetCountries,
            team: investor.team,
            sourcePage: investor.sourcePage,
            removeLogo,
        };
    };

    // Save handler
    const save = async () => {
        if (!investor) return;
        setSaving(true);
        setErr(null);

        try {
            const hasFile = !!logoFile;

            if (hasFile) {
                const fd = new FormData();
                fd.append("data", JSON.stringify(buildPayload()));
                if (logoFile) fd.append("logo", logoFile);

                const res = await fetch(`${BE}/admin/open-vc-investors/${investor.id}`, {
                    method: "POST",
                    headers: { Accept: "application/json", ...authHeaders() },
                    body: fd,
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Save failed (${res.status}): ${text}`);
                }
            } else {
                const res = await fetch(`${BE}/admin/open-vc-investors/${investor.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
                    body: JSON.stringify(buildPayload()),
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Save failed (${res.status}): ${text}`);
                }
            }

            // Refresh data
            const r2 = await fetch(`${BE}/open-vc-investors/${investor.id}`, {
                headers: { Accept: "application/json", ...authHeaders() },
                cache: "no-store",
            });
            if (r2.ok) {
                const fresh = await r2.json();
                setInvestor((prev) => (prev ? { ...prev, ...fresh } : prev));
            }
            setLogoFile(null);
            setRemoveLogo(false);
        } catch (e: any) {
            setErr(e.message || "Unknown error");
        } finally {
            setSaving(false);
        }
    };

    // Delete handler
    const doDelete = async () => {
        if (!investor) return;
        if (!window.confirm(`Delete "${investor.fundName}"?\nThis cannot be undone.`)) return;

        setDeleting(true);
        setErr(null);

        try {
            const res = await fetch(`${BE}/open-vc-investors/${investor.id}`, {
                method: "DELETE",
                headers: { Accept: "application/json", ...authHeaders() },
            });
            if (!res.ok) {
                throw new Error(`Delete failed (${res.status})`);
            }
            router.replace("/admin/investors");
        } catch (e: any) {
            setErr(e.message || "Unknown error");
            setDeleting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <div
                            className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"
                            style={{ borderColor: brand.primary }}
                        />
                        <p className="mt-6 text-lg font-semibold text-gray-600">Loading investor…</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state - only show after loading completes and investor is null
    if (!loading && !investor) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <div className="mx-auto max-w-3xl p-6">
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-red-700">
                        <h2 className="text-xl font-bold mb-2">Error Loading Investor</h2>
                        <p>{err || "Investor not found."}</p>
                    </div>
                    <div className="mt-6">
                        <Link href="/admin/investors" className="text-blue-600 font-semibold hover:underline">
                            ← Back to list
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Guard for TypeScript - investor is guaranteed to be non-null here
    if (!investor) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Header Section */}
            <section
                className="relative overflow-hidden py-8"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <Link href="/admin/investors" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
                            ← Back to list
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                {investor.logo?.url && (
                                    <img
                                        src={mediaUrl(investor.logo.url)}
                                        alt={investor.fundName}
                                        className="h-16 w-16 rounded-xl object-cover border border-gray-200"
                                    />
                                )}
                                <h1 className="text-4xl font-black text-gray-900 truncate">{investor.fundName}</h1>
                                <VerifiedBadge verified={investor.verified} />
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="font-mono text-xs">ID: {investor.id}</span>
                                {investor.globalHq && <span>📍 {investor.globalHq}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={`/investors/${investor.id}`}
                                className="rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition"
                            >
                                👁️ View Live
                            </Link>
                            <button
                                onClick={doDelete}
                                disabled={deleting || saving}
                                className="rounded-xl border-2 border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                                {deleting ? "Deleting…" : "🗑️ Delete"}
                            </button>
                            <button
                                disabled={saving}
                                onClick={save}
                                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                {saving ? "💾 Saving…" : "💾 Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Error Message */}
            {err && (
                <div className="mx-auto max-w-7xl px-6 mt-6">
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{err}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* LEFT COLUMN: Main Content (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Basic Info Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Fund Name *</span>
                                    <input
                                        value={investor.fundName}
                                        onChange={(e) => merge("fundName", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="Enter fund name"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">LinkedIn</span>
                                    <input
                                        value={investor.linkedin || ""}
                                        onChange={(e) => merge("linkedin", e.target.value || null)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="https://linkedin.com/company/..."
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Website</span>
                                    <input
                                        value={investor.website || ""}
                                        onChange={(e) => merge("website", e.target.value || null)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="https://..."
                                    />
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Headquarters</span>
                                    <input
                                        value={investor.globalHq || ""}
                                        onChange={(e) => merge("globalHq", e.target.value || null)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="San Francisco, CA"
                                    />
                                </label>

                                <label className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 transition hover:border-green-300 cursor-pointer md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">Verified Investor</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={investor.verified}
                                        onChange={(e) => merge("verified", e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-green-600"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Description</h2>
                            </div>

                            <div className="space-y-6">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Description</span>
                                    <textarea
                                        value={investor.description || ""}
                                        onChange={(e) => merge("description", e.target.value || null)}
                                        rows={4}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-y"
                                        placeholder="Describe the investor's focus and strategy..."
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Value Add</span>
                                    <textarea
                                        value={investor.valueAdd || ""}
                                        onChange={(e) => merge("valueAdd", e.target.value || null)}
                                        rows={3}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-y"
                                        placeholder="What value does this investor add beyond capital?"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Team</span>
                                    <textarea
                                        value={investor.team || ""}
                                        onChange={(e) => merge("team", e.target.value || null)}
                                        rows={3}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-y"
                                        placeholder="Key team members (Name, Role)..."
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Investment Criteria Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Investment Criteria</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Check Size */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-gray-700">Check Size Min (USD)</span>
                                        <input
                                            type="number"
                                            value={investor.checkSizeMin ?? ""}
                                            onChange={(e) => merge("checkSizeMin", e.target.value === "" ? null : Number(e.target.value))}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                            placeholder="50000"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-gray-700">Check Size Max (USD)</span>
                                        <input
                                            type="number"
                                            value={investor.checkSizeMax ?? ""}
                                            onChange={(e) => merge("checkSizeMax", e.target.value === "" ? null : Number(e.target.value))}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                            placeholder="500000"
                                        />
                                    </label>
                                </div>

                                {/* Firm Type */}
                                <div>
                                    <span className="mb-3 block text-sm font-bold text-gray-700">Firm Type</span>
                                    <div className="flex flex-wrap gap-2">
                                        {FIRM_TYPES.map((type) => {
                                            const active = isFirmTypeActive(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => toggleFirmType(type)}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                                                        active
                                                            ? "bg-blue-50 border-blue-200 text-blue-700"
                                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Funding Stages */}
                                <div>
                                    <span className="mb-3 block text-sm font-bold text-gray-700">Funding Stages</span>
                                    <div className="flex flex-wrap gap-2">
                                        {FUNDING_STAGES.map((stage) => {
                                            const active = isStageActive(stage);
                                            return (
                                                <button
                                                    key={stage}
                                                    onClick={() => toggleFundingStage(stage)}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                                                        active
                                                            ? "bg-green-50 border-green-200 text-green-700"
                                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                                    }`}
                                                >
                                                    {stage}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Countries */}
                                <div>
                                    <span className="mb-3 block text-sm font-bold text-gray-700">
                                        Target Countries ({parsedCountries.length} selected)
                                    </span>
                                    
                                    {/* Selected Countries (removable chips) */}
                                    {parsedCountries.length > 0 && (
                                        <div className="mb-3 flex flex-wrap gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                                            {parsedCountries.map((country) => (
                                                <button
                                                    key={country}
                                                    onClick={() => toggleCountry(country)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition"
                                                >
                                                    {country}
                                                    <span className="text-indigo-500 hover:text-indigo-700">×</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Country picker */}
                                    <div className="max-h-48 overflow-y-auto rounded-xl border-2 border-gray-200 p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {COUNTRY_OPTIONS.map(({ label }) => {
                                                const active = isCountryActive(label);
                                                return (
                                                    <button
                                                        key={label}
                                                        onClick={() => toggleCountry(label)}
                                                        className={`rounded-lg px-2 py-1 text-xs font-medium transition border ${
                                                            active
                                                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (1/3) */}
                    <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                                    <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Logo</h3>
                            </div>

                            {investor.logo?.url && !removeLogo ? (
                                <div className="space-y-3">
                                    <img
                                        src={mediaUrl(investor.logo.url)}
                                        alt="Logo"
                                        className="h-32 w-32 rounded-xl object-cover border border-gray-200 mx-auto"
                                    />
                                    <button
                                        onClick={() => setRemoveLogo(true)}
                                        className="w-full rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                                    >
                                        Remove Logo
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logoFile ? (
                                        <div className="text-center">
                                            <img
                                                src={URL.createObjectURL(logoFile)}
                                                alt="Preview"
                                                className="h-32 w-32 rounded-xl object-cover border border-gray-200 mx-auto mb-2"
                                            />
                                            <p className="text-xs text-gray-500">{logoFile.name}</p>
                                            <button
                                                onClick={() => setLogoFile(null)}
                                                className="mt-2 text-xs text-red-600 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-400 transition">
                                            <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-sm text-gray-500">Click to upload logo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setLogoFile(file);
                                                        setRemoveLogo(false);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Source Info */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Source</h3>
                            </div>

                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-gray-700">Source Page URL</span>
                                <input
                                    value={investor.sourcePage || ""}
                                    onChange={(e) => merge("sourcePage", e.target.value || null)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    placeholder="https://openvc.app/fund/..."
                                />
                            </label>

                            {investor.sourcePage && (
                                <a
                                    href={investor.sourcePage.startsWith("http") ? investor.sourcePage : `https://openvc.app/${investor.sourcePage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                    View original source →
                                </a>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-4">Metadata</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">Created:</span>{" "}
                                    {investor.created ? new Date(investor.created).toLocaleDateString() : "—"}
                                </p>
                                <p>
                                    <span className="font-medium">Updated:</span>{" "}
                                    {investor.updated ? new Date(investor.updated).toLocaleDateString() : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
