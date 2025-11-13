"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import countriesData from "world-countries";
import { State } from "country-state-city";
import TeamMessenger from "@/components/dashboard/TeamMessenger";
import RichTextEditor from "@/components/global/RichTextEditor";

/* ---------------- BRAND / ENV ---------------- */
const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

/* ---------------- TYPES ---------------- */
type FundingStage = "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C" | "Growth";
type AdminStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
type MediaLite = { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
type LocationLite = { country?: string | null; state?: string | null; city?: string | null; iso2?: string | null } | null;

type AdminProjectDetail = {
    id: number;
    hash: string;
    name: string;
    tagline: string | null;
    stage: FundingStage | null;
    founded: string | null;
    teamSize: number | null;

    category: string[] | null;
    urls: Record<string, string> | null;
    social: Record<string, string> | null;
    location: LocationLite;

    // money
    foundingTarget: number | null;
    capitalSought: number | null;
    valuation: number | null;
    previousAmountFunding: number | null;
    currentFoundingAmount: number | null;

    // narrative
    elevatorPitch: string | null;
    problemStatement: string | null;
    solution: string | null;
    model: string | null;
    traction: string | null;
    demoVideo: string | null;
    previousRound: string | null;

    // dates
    previousRoundDate: string | null;
    publishDate: string | null;

    // status / boost
    status: AdminStatus;
    boost: boolean;
    boostDate: string | null;
    superBoost: boolean;
    superBoostDate: string | null;

    // media (lite)
    logo: MediaLite;
    banner: MediaLite;
    pitchDeck: MediaLite;
    gallery: MediaLite[] | null;
};

type SaveState = "idle" | "saving";

/* ---------------- CONSTANTS / HELPERS ---------------- */
const STAGES: FundingStage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];
const STATUS_OPTIONS: AdminStatus[] = ["draft", "pending_review", "published", "rejected", "archived"];

const CATEGORIES = [
    "AI / ML","Analytics / BI","AR / VR / XR","Blockchain / Web3","ClimateTech","Aerospace / SpaceTech","Autonomous Systems","Robotics","Drones","Clean Energy / Renewables",
    "Energy Storage / Batteries","Carbon / Offsets / MRV","Agriculture / AgTech","FoodTech","BioTech","Synthetic Biology","HealthTech","Digital Health / Telemedicine","MedTech / Devices",
    "Pharma / Drug Discovery","FinTech","DeFi / Crypto Finance","InsurTech","PropTech / Real Estate","ConstructionTech","Manufacturing / Industry 4.0","Advanced Materials","Semiconductors / Chips",
    "IoT / Embedded","Edge Computing","Networking / 5G","Cybersecurity","Privacy / Compliance","Developer Tools","SaaS / Productivity","SaaS / Infrastructure","Cloud / DevOps / Platform",
    "Open Source","Open Science","Data Infrastructure / Databases","MLOps / DataOps","E-commerce","Marketplaces","RetailTech / POS","Logistics / Supply Chain","Mobility / Transportation",
    "Automotive / EV","Aviation","Maritime","Media / Entertainment","Gaming","Creator Economy","AdTech / MarTech","SalesTech / RevOps","HRTech / Future of Work","EdTech","GovTech / Public Sector",
    "LegalTech","Civic / Social Impact","Security / Defense","Travel / Hospitality","Sports / Fitness","Consumer Social","Communication / Collaboration","Financial Services (Traditional)",
    "Nonprofit / Philanthropy","Localization / Translation","Quantum Tech","Wearables","Home / Smart Home","PetTech","Fashion / BeautyTech","Gaming Infrastructure","Digital Identity",
    "NFTs / Digital Assets","Search / Recommendations","Personalization","Other"
];

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

const currency = (n: number | null | undefined) =>
    n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const mediaUrl = (u?: string | null) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `${BE}/${String(u).replace(/^\/+/, "")}`;
};

function getToken(): string { try { return localStorage.getItem("auth_token") || ""; } catch { return ""; } }
function authHeaders(): HeadersInit { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; }
function isAbortError(err: unknown): boolean {
    if (err instanceof DOMException) return err.name === "AbortError";
    return !!(typeof err === "object" && err && "name" in err && (err as any).name === "AbortError");
}

const stageColors: Record<FundingStage, { bg: string; text: string; border: string }> = {
    "Pre-seed": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
    Seed: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
    "Series A": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
    "Series B": { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
    "Series C": { bg: "#FCE7F3", text: "#831843", border: "#EC4899" },
    Growth: { bg: "#E9D5FF", text: "#581C87", border: "#A855F7" },
};

function StagePill({ stage }: { stage: FundingStage | null }) {
    if (!stage) return <span className="rounded-full border px-2 py-0.5 text-xs text-gray-500">—</span>;
    const st = stageColors[stage];
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
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
    return <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${map[status]}`}>{status.replace("_", " ")}</span>;
}

/* ---------------- PAGE ---------------- */
export default function AdminProjectEditPage() {
    const { hash } = useParams<{ hash: string }>();
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<SaveState>("idle");
    const [err, setErr] = useState<string | null>(null);
    const [p, setP] = useState<AdminProjectDetail | null>(null);

    // local form state for files & remove flags
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [pitchFile, setPitchFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [removeBanner, setRemoveBanner] = useState(false);
    const [removePitchDeck, setRemovePitchDeck] = useState(false);

    // fetch detail
    useEffect(() => {
        const ctrl = new AbortController();
        let alive = true;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const res = await fetch(`${BE}/projects/${hash}`, {
                    method: "GET",
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                    cache: "no-store",
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Failed to load project (${res.status}): ${text || res.statusText}`);
                }
                const data = (await res.json()) as Partial<AdminProjectDetail>;
                if (!alive) return;

                const raw: any = data || {};
                const m = raw.media || {};

                const norm: AdminProjectDetail = {
                    id: Number(raw.id) as number,
                    hash: String(raw.hash || ""),
                    name: String(raw.name ?? raw.title ?? ""),
                    tagline: raw.tagline ?? null,
                    stage: (raw.stage as FundingStage | null) ?? null,
                    founded: raw.founded ?? null,
                    teamSize: raw.teamSize ?? null,

                    category: Array.isArray(raw.category) ? raw.category : null,
                    urls: raw.urls ?? null,
                    social: raw.social ?? null,
                    location: raw.location ?? null,

                    foundingTarget: raw.foundingTarget ?? null,
                    capitalSought: raw.capitalSought ?? null,
                    valuation: raw.valuation ?? null,
                    previousAmountFunding: raw.previousAmountFunding ?? null,
                    currentFoundingAmount: raw.currentFoundingAmount ?? null,

                    elevatorPitch: raw.elevatorPitch ?? null,
                    problemStatement: raw.problemStatement ?? null,
                    solution: raw.solution ?? null,
                    model: raw.model ?? null,
                    traction: raw.traction ?? null,
                    demoVideo: raw.demoVideo ?? null,
                    previousRound: raw.previousRound ?? null,

                    previousRoundDate: raw.previousRoundDate ?? null,
                    publishDate: raw.publishDate ?? null,

                    status: (raw.status as AdminStatus) ?? "draft",
                    boost: !!raw.boost,
                    boostDate: raw.boostDate ?? null,
                    superBoost: !!raw.superBoost,
                    superBoostDate: raw.superBoostDate ?? null,

                    logo: m.logo ?? raw.logo ?? null,
                    banner: m.banner ?? raw.banner ?? null,
                    pitchDeck: m.pitchDeck ?? raw.pitchDeck ?? null,
                    gallery: Array.isArray(m.gallery) ? m.gallery
                        : Array.isArray(raw.gallery) ? raw.gallery
                            : null,
                };

                setP(norm);
                setLogoFile(null); setBannerFile(null); setPitchFile(null); setGalleryFiles([]);
                setRemoveLogo(false); setRemoveBanner(false); setRemovePitchDeck(false);
            } catch (e) {
                if (!alive || isAbortError(e)) return;
                setErr(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; ctrl.abort(); };
    }, [hash]);

    const canSave = !!p && saving === "idle";

    // update helper
    const merge = <K extends keyof AdminProjectDetail>(key: K, value: AdminProjectDetail[K]) =>
        setP(prev => (prev ? { ...prev, [key]: value } : prev));

    // stringify arrays/objects safely to inputs
    const categoryText = useMemo(() => (p?.category || []).join(", "), [p?.category]);
    const urlsText = useMemo(() => JSON.stringify(p?.urls || {}, null, 2), [p?.urls]);
    const socialText = useMemo(() => JSON.stringify(p?.social || {}, null, 2), [p?.social]);

    // location helpers
    const iso2 = (p?.location?.iso2 || "").toUpperCase().slice(0, 2);
    const stateOptions = getStateOptions(iso2);
    const countryLabel = useMemo(() => COUNTRY_OPTIONS.find(c => c.iso2 === iso2)?.label || "", [iso2]);

    // build payload (JSON or multipart)
    const buildJsonData = (): Record<string, any> => {
        if (!p) return {};
        return {
            name: p.name,
            tagline: p.tagline,
            stage: p.stage,
            elevatorPitch: p.elevatorPitch,
            problemStatement: p.problemStatement,
            solution: p.solution,
            model: p.model,
            traction: p.traction,
            demoVideo: p.demoVideo,
            previousRound: p.previousRound,

            category: p.category,
            urls: p.urls,
            social: p.social,
            location: p.location,

            teamSize: p.teamSize,
            foundingTarget: p.foundingTarget,
            capitalSought: p.capitalSought,
            valuation: p.valuation,
            previousAmountFunding: p.previousAmountFunding,
            currentFoundingAmount: p.currentFoundingAmount,

            founded: p.founded,

            previousRoundDate: p.previousRoundDate,
            publishDate: p.publishDate,

            status: p.status,
            boost: p.boost,
            boostDate: p.boostDate,
            superBoost: p.superBoost,
            superBoostDate: p.superBoostDate,

            removeLogo,
            removeBanner,
            removePitchDeck,
        };
    };

    const wantsMultipart =
        !!logoFile || !!bannerFile || !!pitchFile || (galleryFiles && galleryFiles.length > 0);

    const save = async () => {
        if (!p) return;
        setSaving("saving");
        setErr(null);
        try {
            if (wantsMultipart) {
                const fd = new FormData();
                fd.append("data", JSON.stringify(buildJsonData()));
                if (logoFile) fd.append("logo", logoFile);
                if (bannerFile) fd.append("banner", bannerFile);
                if (pitchFile) fd.append("pitchDeck", pitchFile);
                if (galleryFiles?.length) galleryFiles.forEach(f => fd.append("gallery[]", f));

                const res = await fetch(`${BE}/admin/projects/${p.id}`, {
                    method: "POST",
                    headers: { Accept: "application/json", ...authHeaders() },
                    body: fd,
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Save failed (${res.status}): ${text || res.statusText}`);
                }
            } else {
                const res = await fetch(`${BE}/admin/projects/${p.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
                    body: JSON.stringify(buildJsonData()),
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Save failed (${res.status}): ${text || res.statusText}`);
                }
            }

            const r2 = await fetch(`${BE}/projects/${p.hash}`, {
                headers: { Accept: "application/json", ...authHeaders() },
                cache: "no-store",
            });
            const fresh = (await r2.json()) as Partial<AdminProjectDetail>;
            setP(prev => prev ? { ...prev, ...fresh } as any : prev);
            setLogoFile(null); setBannerFile(null); setPitchFile(null); setGalleryFiles([]);
            setRemoveLogo(false); setRemoveBanner(false); setRemovePitchDeck(false);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setSaving("idle");
        }
    };

    async function doDeleteProject() {
        if (!p) return;
        if (!window.confirm(`Delete "${p.name}" (ID ${p.id})?\nThis cannot be undone.`)) return;

        setDeleting(true);
        setErr(null);

        const delOnce = async () => {
            // primary attempt: DELETE /admin/projects/{id}
            const res = await fetch(`${BE}/admin/projects/${p.id}`, {
                method: "DELETE",
                headers: { Accept: "application/json", ...authHeaders() },
            });
            // if your API uses a POST fallback like /admin/projects/{id}/delete
            if (res.status === 404 || res.status === 405) {
                return await fetch(`${BE}/admin/projects/${p.id}/delete`, {
                    method: "POST",
                    headers: { Accept: "application/json", ...authHeaders() },
                });
            }
            return res;
        };

        try {
            const res = await delOnce();
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Delete failed (${res.status}): ${text || res.statusText}`);
            }
            // go back to list
            router.replace("/admin/projects");
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Unknown error");
            setDeleting(false);
        }
    }

    const publishNow = () => {
        const nowIso = new Date().toISOString();
        setP(prev => prev ? { ...prev, status: "published", publishDate: nowIso } : prev);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: brand.primary }} />
                        <p className="mt-6 text-lg font-semibold text-gray-600">Loading project…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!p) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <div className="mx-auto max-w-3xl p-6">
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-red-700">
                        <h2 className="text-xl font-bold mb-2">Error Loading Project</h2>
                        <p>{err || "Project not found."}</p>
                    </div>
                    <div className="mt-6">
                        <Link href="/admin/projects" className="text-blue-600 font-semibold hover:underline">← Back to list</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Header Section */}
            <section className="relative overflow-hidden py-8" style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}>
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <Link href="/admin/projects" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
                            ← Back to list
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-4xl font-black text-gray-900 truncate">{p.name}</h1>
                                <StagePill stage={p.stage} />
                                <StatusBadge status={p.status} />
                            </div>

                            {p.tagline && (
                                <p className="text-lg text-gray-600 mb-4">{p.tagline}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    ID #{p.id}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-xs">Hash: {p.hash}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={`/projects/${p.hash}`}
                                className="rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition"
                            >
                                👁️ View Live
                            </Link>
                            <button
                                onClick={doDeleteProject}
                                disabled={deleting || saving !== "idle"}
                                className="rounded-xl border-2 border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                                title="Delete project permanently"
                            >
                                {deleting ? "Deleting…" : "🗑️ Delete"}
                            </button>
                            <button
                                onClick={publishNow}
                                className="rounded-xl border-2 border-green-200 bg-white px-5 py-2.5 text-sm font-bold text-green-700 hover:border-green-500 hover:bg-green-50 transition"
                            >
                                ✓ Publish Now
                            </button>
                            <button
                                disabled={!canSave}
                                onClick={save}
                                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                {saving === "saving" ? "💾 Saving…" : "💾 Save Changes"}
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
                        {/* Basics Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Project Title *</span>
                                    <input
                                        value={p.name}
                                        onChange={(e) => merge("name", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="Enter project name"
                                    />
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Tagline</span>
                                    <input
                                        value={p.tagline || ""}
                                        onChange={(e) => merge("tagline", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="One-line description"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Funding Stage</span>
                                    <select
                                        value={p.stage || ""}
                                        onChange={(e) => merge("stage", (e.target.value || null) as FundingStage | null)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    >
                                        <option value="">Select stage</option>
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Founded</span>
                                    <input
                                        value={p.founded || ""}
                                        onChange={(e) => merge("founded", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="2023 or 2023-05 or 2023-05-01"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Team Size</span>
                                    <input
                                        type="number"
                                        value={p.teamSize ?? ""}
                                        onChange={(e) => merge("teamSize", e.target.value === "" ? null : Number(e.target.value))}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="Number of team members"
                                    />
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Categories</span>
                                    <input
                                        value={categoryText}
                                        onChange={(e) => merge("category", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                        placeholder="AI / ML, Developer Tools, ..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        list="all-categories"
                                    />
                                    <datalist id="all-categories">
                                        {CATEGORIES.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </label>
                            </div>
                        </div>

                        {/* Narrative Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Narrative & Pitch</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <RTE
                                    label="Elevator Pitch"
                                    v={p.elevatorPitch}
                                    set={(v) => merge("elevatorPitch", v)}
                                    placeholder="Short, punchy summary to hook investors…"
                                />

                                <RTE
                                    label="Problem Statement"
                                    v={p.problemStatement}
                                    set={(v) => merge("problemStatement", v)}
                                    placeholder="What pain or gap exists today?"
                                />

                                <RTE
                                    label="Solution"
                                    v={p.solution}
                                    set={(v) => merge("solution", v)}
                                    placeholder="How your product uniquely solves the problem"
                                />

                                <RTE
                                    label="Business Model"
                                    v={p.model}
                                    set={(v) => merge("model", v)}
                                    placeholder="Who pays, how much, and how often"
                                />

                                <RTE
                                    label="Traction & Metrics"
                                    v={p.traction}
                                    set={(v) => merge("traction", v)}
                                    placeholder="KPIs, revenue, users, growth, LOIs, pilots…"
                                />

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Demo Video URL</span>
                                    <input
                                        value={p.demoVideo || ""}
                                        onChange={(e) => merge("demoVideo", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="https://youtube.com/..."
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Funding Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Funding Details</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Num label="Funding Target (USD)" v={p.foundingTarget} set={(n) => merge("foundingTarget", n)} />
                                <Num label="Capital Committed (USD)" v={p.capitalSought} set={(n) => merge("capitalSought", n)} />
                                <Num label="Valuation (USD)" v={p.valuation} set={(n) => merge("valuation", n)} />
                                <Num label="Previous Funding Amount (USD)" v={p.previousAmountFunding} set={(n) => merge("previousAmountFunding", n)} />
                                <Num label="Current Funding Amount (USD)" v={p.currentFoundingAmount} set={(n) => merge("currentFoundingAmount", n)} />
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Previous Round Tag</span>
                                    <input
                                        value={p.previousRound || ""}
                                        onChange={(e) => merge("previousRound", e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="Seed, Series A, etc."
                                    />
                                </label>
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Iso label="Previous Round Date (ISO)" v={p.previousRoundDate} set={(s) => merge("previousRoundDate", s)} />
                                <Iso label="Publish Date Override (ISO)" v={p.publishDate} set={(s) => merge("publishDate", s)} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (1/3) */}
                    <div className="space-y-8">
                        {/* Admin Controls */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                                    <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Admin Controls</h3>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Status</span>
                                    <select
                                        value={p.status}
                                        onChange={(e) => merge("status", e.target.value as AdminStatus)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                                    </select>
                                </label>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 transition hover:border-blue-300 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">Featured (boost)</span>
                                        </div>
                                        <input type="checkbox" checked={p.boost} onChange={(e) => merge("boost", e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600" />
                                    </label>
                                    <Iso label="Boost Date" v={p.boostDate} set={(s) => merge("boostDate", s)} small />

                                    <label className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 transition hover:border-amber-300 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
                                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">Super Boost</span>
                                        </div>
                                        <input type="checkbox" checked={p.superBoost} onChange={(e) => merge("superBoost", e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-amber-600" />
                                    </label>
                                    <Iso label="Super Boost Date" v={p.superBoostDate} set={(s) => merge("superBoostDate", s)} small />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                                    <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Location</h3>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">Country</span>
                                    <select
                                        value={iso2}
                                        onChange={(e) => merge("location", { ...(p.location || {}), iso2: e.target.value.toUpperCase(), country: COUNTRY_OPTIONS.find(c => c.iso2 === e.target.value.toUpperCase())?.label || null, state: null })}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    >
                                        <option value="">Select country</option>
                                        {COUNTRY_OPTIONS.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">State / Province</span>
                                    <select
                                        value={p.location?.state || ""}
                                        onChange={(e) => merge("location", { ...(p.location || {}), state: e.target.value || null })}
                                        disabled={!iso2}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                                    >
                                        <option value="">{iso2 ? `All in ${countryLabel}` : "Select country first"}</option>
                                        {stateOptions.map(s => <option key={s.code} value={s.label}>{s.label}</option>)}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-gray-700">City</span>
                                    <input
                                        value={p.location?.city || ""}
                                        onChange={(e) => merge("location", { ...(p.location || {}), city: e.target.value || null })}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                        placeholder="City name"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                                    <svg className="h-4 w-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Links</h3>
                            </div>

                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-gray-700">URLs (JSON)</span>
                                <textarea
                                    value={urlsText}
                                    onChange={(e) => {
                                        try { merge("urls", JSON.parse(e.target.value || "{}")); } catch { }
                                    }}
                                    className="h-32 w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-xs text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    placeholder='{"website":"https://...","github":"https://..."}'
                                />
                            </label>

                            <label className="mt-4 block">
                                <span className="mb-2 block text-sm font-bold text-gray-700">Social (JSON)</span>
                                <textarea
                                    value={socialText}
                                    onChange={(e) => {
                                        try { merge("social", JSON.parse(e.target.value || "{}")); } catch { }
                                    }}
                                    className="h-32 w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-xs text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                                    placeholder='{"linkedin":"https://...","twitter":"https://..."}'
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Media Section - Full Width at Bottom */}
                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">Media & Assets</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Logo */}
                        <div>
                            <h3 className="mb-4 text-lg font-bold text-gray-900">Logo</h3>
                            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
                                <div className="mx-auto h-48 w-48 overflow-hidden rounded-2xl bg-white shadow-md">
                                    {mediaUrl(p.logo?.url) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={mediaUrl(p.logo?.url)} alt="logo" className="h-full w-full object-contain p-4" />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center text-gray-400">
                                            <div className="text-center">
                                                <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">No logo</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={removeLogo} onChange={(e) => setRemoveLogo(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600" />
                                        <span>Remove current logo</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Banner */}
                        <div>
                            <h3 className="mb-4 text-lg font-bold text-gray-900">Banner Image</h3>
                            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
                                <div className="h-48 w-full overflow-hidden rounded-2xl bg-white shadow-md">
                                    {mediaUrl(p.banner?.url) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={mediaUrl(p.banner?.url)} alt="banner" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center text-gray-400">
                                            <div className="text-center">
                                                <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">No banner</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={removeBanner} onChange={(e) => setRemoveBanner(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600" />
                                        <span>Remove current banner</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pitch Deck */}
                    <div className="mt-8">
                        <h3 className="mb-4 text-lg font-bold text-gray-900">Pitch Deck (PDF)</h3>
                        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {p.pitchDeck?.url ? (
                                                <a href={mediaUrl(p.pitchDeck.url)} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                    📥 Download Current Deck
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">No pitch deck uploaded</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={(e) => setPitchFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                                />
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={removePitchDeck} onChange={(e) => setRemovePitchDeck(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600" />
                                    <span>Remove current pitch deck</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="mt-8">
                        <h3 className="mb-4 text-lg font-bold text-gray-900">Gallery Images</h3>
                        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
                            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                {(p.gallery || []).map((m, i) => (
                                    <div key={i} className="aspect-square overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm">
                                        {mediaUrl(m?.url) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={mediaUrl(m?.url)} alt={`gallery-${i}`} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="grid h-full w-full place-items-center text-gray-400">—</div>
                                        )}
                                    </div>
                                ))}
                                {(!p.gallery || p.gallery.length === 0) && (
                                    <div className="col-span-full rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-500">No gallery images</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
                                />
                                <p className="text-xs text-gray-500">
                                    {galleryFiles.length > 0 ? `${galleryFiles.length} file(s) selected for upload` : "Select multiple images to add to gallery"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-10 mb-10 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <Link
                        href="/admin/projects"
                        className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                        ← Cancel
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/projects/${p.hash}`}
                            className="rounded-xl border-2 border-blue-200 bg-blue-50 px-6 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                        >
                            👁️ Preview Live
                        </Link>
                        <button
                            disabled={!canSave}
                            onClick={save}
                            className="rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                        >
                            {saving === "saving" ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                "💾 Save All Changes"
                            )}
                        </button>
                    </div>
                </div>
                <TeamMessenger
                    projectHash={p.hash}
                    defaultSubject="Quick sync"
                    defaultMessage="Hey team, sharing a brief update…"
                />
            </div>
        </div>
    );
}

/* ---------------- SMALL FIELDS ---------------- */
function TA({ label, v, set }: { label: string; v: string | null; set: (x: string | null) => void }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
            <textarea
                value={v || ""}
                onChange={(e) => set(e.target.value || null)}
                className="h-32 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-y"
                placeholder={`Enter ${label.toLowerCase()}...`}
            />
        </label>
    );
}

function Num({ label, v, set }: { label: string; v: number | null; set: (x: number | null) => void }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
            <input
                type="number"
                value={v ?? ""}
                onChange={(e) => set(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                placeholder="0"
            />
        </label>
    );
}

function Iso({ label, v, set, small }: { label: string; v: string | null; set: (x: string | null) => void; small?: boolean }) {
    return (
        <label className="block">
            <span className={`mb-2 block font-bold text-gray-700 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
            <input
                value={v || ""}
                onChange={(e) => set(e.target.value || null)}
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                className={`w-full rounded-xl border-2 border-gray-200 px-4 text-gray-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none ${small ? 'py-2 text-xs' : 'py-3 text-sm'}`}
            />
        </label>
    );
}

function RTE({
                 label,
                 v,
                 set,
                 placeholder,
             }: {
    label: string;
    v: string | null;
    set: (x: string | null) => void;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
            <RichTextEditor
                value={v || ""}
                onChange={(html) => set(html && html.trim() !== "" ? html : null)}
                placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
            />
        </label>
    );
}