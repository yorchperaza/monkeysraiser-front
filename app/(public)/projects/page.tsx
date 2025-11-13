"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

/* ---------------- TYPES ---------------- */
type FundingStage = "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C" | "Growth";

type ProjectSummary = {
    hash: string;
    title: string;
    tagline: string | null;
    categories: string[] | null;
    founded: string | null;
    stage: FundingStage;
    foundingTarget: number | null;
    capitalSought: number | null;
    image: {
        id: number | null;
        url: string | null;
        type: string | null;
        hash: string | null;
    } | null;
    boost?: boolean;
    superBoost?: boolean;
    location?: { country?: string | null; state?: string | null; iso2?: string | null } | string | null;
};

type ProjectsResponse = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: ProjectSummary[];
};

/* ---------------- CONSTANTS ---------------- */
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const STAGES: FundingStage[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];

const CATEGORIES = [
    "AI / ML", "Analytics / BI", "AR / VR / XR", "Blockchain / Web3", "ClimateTech",
    "Aerospace / SpaceTech", "Autonomous Systems", "Robotics", "Drones",
    "Clean Energy / Renewables", "Energy Storage / Batteries", "Carbon / Offsets / MRV",
    "Agriculture / AgTech", "FoodTech", "BioTech", "Synthetic Biology", "HealthTech",
    "Digital Health / Telemedicine", "MedTech / Devices", "Pharma / Drug Discovery",
    "FinTech", "DeFi / Crypto Finance", "InsurTech", "PropTech / Real Estate",
    "ConstructionTech", "Manufacturing / Industry 4.0", "Advanced Materials",
    "Semiconductors / Chips", "IoT / Embedded", "Edge Computing", "Networking / 5G",
    "Cybersecurity", "Privacy / Compliance", "Developer Tools", "SaaS / Productivity",
    "SaaS / Infrastructure", "Cloud / DevOps / Platform", "Open Source", "Open Science",
    "Data Infrastructure / Databases", "MLOps / DataOps", "E-commerce", "Marketplaces",
    "RetailTech / POS", "Logistics / Supply Chain", "Mobility / Transportation",
    "Automotive / EV", "Aviation", "Maritime", "Media / Entertainment", "Gaming",
    "Creator Economy", "AdTech / MarTech", "SalesTech / RevOps", "HRTech / Future of Work",
    "EdTech", "GovTech / Public Sector", "LegalTech", "Civic / Social Impact",
    "Security / Defense", "Travel / Hospitality", "Sports / Fitness", "Consumer Social",
    "Communication / Collaboration", "Financial Services (Traditional)",
    "Nonprofit / Philanthropy", "Localization / Translation", "Quantum Tech", "Wearables",
    "Home / Smart Home", "PetTech", "Fashion / BeautyTech", "Gaming Infrastructure",
    "Digital Identity", "NFTs / Digital Assets", "Search / Recommendations",
    "Personalization", "Other"
];

const SORT_OPTIONS = [
    { value: "boost", label: "Featured First" },
    { value: "recent", label: "Most Recent" },
    { value: "alpha-asc", label: "A → Z" },
    { value: "alpha-desc", label: "Z → A" },
];

const stageColors: Record<FundingStage, { bg: string; text: string; border: string }> = {
    "Pre-seed": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
    Seed: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
    "Series A": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
    "Series B": { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
    "Series C": { bg: "#FCE7F3", text: "#831843", border: "#EC4899" },
    Growth: { bg: "#E9D5FF", text: "#581C87", border: "#A855F7" },
};

/* ---------------- HELPERS ---------------- */
const currency = (n: number | null | undefined) =>
    n == null ? "—" : new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);

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

const formatLocation = (loc: ProjectSummary["location"]) => {
    if (!loc) return "—";
    if (typeof loc === "string") return loc.trim() || "—";
    const parts = [loc.state || "", loc.country || ""].filter(Boolean).join(", ");
    const flag = iso2ToFlag(loc.iso2 || "");
    return parts ? `${flag ? flag + " " : ""}${parts}` : "—";
};

const COUNTRY_OPTIONS = countriesData
    .map(c => ({
        label: c.name.common,
        iso2: (c.cca2 || c.cca3 || "").toUpperCase().slice(0, 2),
    }))
    .filter(c => c.iso2.length === 2)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const getStateOptions = (iso2?: string) => {
    if (!iso2 || iso2.length !== 2) return [];
    return (State.getStatesOfCountry(iso2) || [])
        .map(s => ({ label: s.name, code: s.isoCode }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
};

/* ---------------- COMPONENTS ---------------- */

function ProjectCard({ project }: { project: ProjectSummary }) {
    const stageStyle = stageColors[project.stage];
    const imageUrl = fromBE(project.image?.url);
    const detailHref = `/projects/${project.hash}`;

    const fundingPercentage = project.foundingTarget && project.capitalSought
        ? (project.capitalSought / project.foundingTarget) * 100
        : 0;

    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <Link href={detailHref} className="relative block aspect-[16/9] w-full overflow-hidden" aria-label={`Open ${project.title}`}>
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                        <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {project.superBoost && (
                    <span className="absolute right-4 top-4 z-20 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">⭐ Super Boost</span>
                )}
                {!project.superBoost && project.boost && (
                    <span className="absolute right-4 top-4 z-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">⭐ Featured</span>
                )}

                {project.categories && project.categories.length > 0 && (
                    <div className="absolute left-4 bottom-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm" style={{ color: brand.primary }}>
                        {project.categories[0]}
                    </div>
                )}

                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: stageStyle.bg, color: stageStyle.text, borderColor: stageStyle.border }}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: stageStyle.border }} />
                    {project.stage}
                </div>

                <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900">
                    <Link href={detailHref} className="inline-block transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded">
                        {project.title}
                    </Link>
                </h3>

                <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {formatLocation(project.location)}
                    </span>
                    <span>•</span>
                    <span>{project.founded ? `Founded ${new Date(project.founded).getFullYear()}` : "—"}</span>
                </div>

                <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-600">
                    {project.tagline || "—"}
                </p>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-sm font-semibold text-gray-500">Seeking</div>
                            <div className="text-2xl font-bold text-gray-900">{currency(project.foundingTarget)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-gray-500">Committed</div>
                            <div className="text-xl font-bold" style={{ color: brand.accent }}>{currency(project.capitalSought)}</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(fundingPercentage, 100)}%`, background: brand.accent }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{fundingPercentage.toFixed(0)}% funded</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <Link href={detailHref} className="flex-1 rounded-xl px-5 py-3 text-center text-sm font-bold text-white transition-all duration-300 hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}>
                        View Project
                    </Link>
                    <Link href={`/projects/${project.hash}#contact`} className="rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-300 hover:bg-blue-50" style={{ borderColor: brand.primary, color: brand.primary }} title="Contact Founder">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    );
}

function FilterSidebar({
                           selectedStages,
                           selectedCategories,
                           countryIso2,
                           stateCode,
                           loc,
                           onStageToggle,
                           onCategoryToggle,
                           onCountryChange,
                           onStateChange,
                           onLocChange,
                           onClearAll,
                       }: {
    selectedStages: Set<string>;
    selectedCategories: Set<string>;
    countryIso2: string;
    stateCode: string;
    loc: string;
    onStageToggle: (stage: string) => void;
    onCategoryToggle: (category: string) => void;
    onCountryChange: (iso2: string) => void;
    onStateChange: (code: string) => void;
    onLocChange: (value: string) => void;
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
    const stateOptions = useMemo(() => getStateOptions(countryIso2), [countryIso2]);
    const countryLabel = useMemo(() => {
        if (!countryIso2) return "";
        const hit = COUNTRY_OPTIONS.find(c => c.iso2 === countryIso2);
        return hit?.label || "";
    }, [countryIso2]);

    const hasFilters = selectedStages.size > 0 || selectedCategories.size > 0 || countryIso2 || stateCode || loc;

    return (
        <aside className="space-y-6">
            {hasFilters && (
                <button onClick={onClearAll} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600">
                    Clear All Filters
                </button>
            )}

            {/* Location Filter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Location</h3>

                <div className="mb-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Country</label>
                    <div className="relative">
                        <select value={countryIso2} onChange={(e) => onCountryChange(e.target.value.toUpperCase())} className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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
                        <select value={stateCode} onChange={(e) => onStateChange(e.target.value)} disabled={!countryIso2} className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500">
                            <option value="">{countryIso2 ? `All in ${countryLabel}` : "Select country first"}</option>
                            {stateOptions.map((s) => (
                                <option key={s.code} value={s.code}>{s.label}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {(countryIso2 || stateCode || loc) && (
                    <button onClick={() => { onCountryChange(""); onStateChange(""); onLocChange(""); }} className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
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
                                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: isSelected ? stageStyle.bg : "transparent", color: stageStyle.text, borderColor: stageStyle.border }}>
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
                        <input type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Search categories..." className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
                    <button onClick={() => setShowAllCategories(!showAllCategories)} className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                        {showAllCategories ? "Show Less" : `Show All (${CATEGORIES.length})`}
                    </button>
                )}
            </div>
        </aside>
    );
}

export default function DiscoverProjectsPage() {
    const searchParams = useSearchParams();

    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, perPage: 24, total: 0, pages: 0 });

    const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
    const [selectedSort, setSelectedSort] = useState(searchParams?.get("sort") || "boost");
    const [selectedStages, setSelectedStages] = useState<Set<string>>(
        new Set(searchParams?.get("stage")?.split(",").filter(Boolean) || [])
    );
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
        new Set(searchParams?.get("category")?.split(",").filter(Boolean) || [])
    );
    const [countryIso2, setCountryIso2] = useState((searchParams?.get("iso2") || "").toUpperCase().slice(0, 2));
    const [stateCode, setStateCode] = useState(searchParams?.get("state") || "");
    const [loc, setLoc] = useState(searchParams?.get("loc") || "");
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.get("page") || "1"));
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", currentPage.toString());
            params.set("perPage", "24");

            if (selectedSort === "recent") params.set("sort", "recent");
            else if (selectedSort === "boost") params.set("sort", "boost");

            if (selectedStages.size > 0) params.set("stage", Array.from(selectedStages).join(","));
            if (selectedCategories.size > 0) params.set("category", Array.from(selectedCategories).join(","));
            if (searchQuery.trim()) params.set("q", searchQuery.trim());
            if (loc.trim()) params.set("loc", loc.trim());
            if (countryIso2) params.set("iso2", countryIso2);
            if (stateCode.trim()) params.set("state", stateCode.trim());

            const url = `${BE}/projects?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch projects");

            const data: ProjectsResponse = await res.json();
            let items = data.items;

            if (selectedSort === "alpha-asc") {
                items = [...items].sort((a, b) => a.title.localeCompare(b.title));
            } else if (selectedSort === "alpha-desc") {
                items = [...items].sort((a, b) => b.title.localeCompare(a.title));
            }

            setProjects(items);
            setPagination({ page: data.page, perPage: data.perPage, total: data.total, pages: data.pages });
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedSort, selectedStages, selectedCategories, searchQuery, loc, countryIso2, stateCode]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set("page", currentPage.toString());
        if (selectedSort !== "boost") params.set("sort", selectedSort);
        if (selectedStages.size > 0) params.set("stage", Array.from(selectedStages).join(","));
        if (selectedCategories.size > 0) params.set("category", Array.from(selectedCategories).join(","));
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (loc.trim()) params.set("loc", loc.trim());
        if (countryIso2) params.set("iso2", countryIso2);
        if (stateCode.trim()) params.set("state", stateCode.trim());

        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
    }, [currentPage, selectedSort, selectedStages, selectedCategories, searchQuery, loc, countryIso2, stateCode]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleStageToggle = (stage: string) => {
        setSelectedStages((prev) => {
            const next = new Set(prev);
            next.has(stage) ? next.delete(stage) : next.add(stage);
            return next;
        });
        setCurrentPage(1);
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            next.has(category) ? next.delete(category) : next.add(category);
            return next;
        });
        setCurrentPage(1);
    };

    const handleCountryChange = (iso2: string) => {
        setCountryIso2(iso2);
        setStateCode("");
        setCurrentPage(1);
    };

    const handleStateChange = (code: string) => {
        setStateCode(code);
        setCurrentPage(1);
    };

    const handleLocChange = (value: string) => {
        setLoc(value);
        setCurrentPage(1);
    };

    const handleClearAll = () => {
        setSelectedStages(new Set());
        setSelectedCategories(new Set());
        setSearchQuery("");
        setCountryIso2("");
        setStateCode("");
        setLoc("");
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const activeFiltersCount = selectedStages.size + selectedCategories.size + (searchQuery ? 1 : 0) + (loc ? 1 : 0) + (countryIso2 ? 1 : 0) + (stateCode ? 1 : 0);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <section className="relative overflow-hidden py-12" style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}>
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mb-8">
                        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">Discover Projects</h1>
                        <p className="text-lg text-gray-600">Browse {pagination.total} innovative startups seeking funding</p>
                    </div>

                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects by name, description, or keywords..." className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-14 pr-32 text-base text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" />
                            <svg className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6 py-2 text-sm font-bold text-white transition hover:opacity-90" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}>
                                Search
                            </button>
                        </div>
                    </form>

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 lg:hidden">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {activeFiltersCount > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{activeFiltersCount}</span>}
                        </button>

                        <div className="relative">
                            <select value={selectedSort} onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }} className="appearance-none rounded-xl border-2 border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-bold text-gray-700 outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {Array.from(selectedStages).map((stage) => (
                            <button key={stage} onClick={() => handleStageToggle(stage)} className="flex items-center gap-2 rounded-full border-2 border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 transition hover:border-blue-400">
                                {stage}
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ))}

                        {Array.from(selectedCategories).slice(0, 3).map((cat) => (
                            <button key={cat} onClick={() => handleCategoryToggle(cat)} className="flex items-center gap-2 rounded-full border-2 border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-bold text-purple-700 transition hover:border-purple-400">
                                {cat}
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ))}

                        {selectedCategories.size > 3 && (
                            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">+{selectedCategories.size - 3} more</span>
                        )}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="flex gap-8">
                    <div className="hidden w-80 shrink-0 lg:block">
                        <div className="sticky top-24">
                            <FilterSidebar
                                selectedStages={selectedStages}
                                selectedCategories={selectedCategories}
                                countryIso2={countryIso2}
                                stateCode={stateCode}
                                loc={loc}
                                onStageToggle={handleStageToggle}
                                onCategoryToggle={handleCategoryToggle}
                                onCountryChange={handleCountryChange}
                                onStateChange={handleStateChange}
                                onLocChange={handleLocChange}
                                onClearAll={handleClearAll}
                            />
                        </div>
                    </div>

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
                                <FilterSidebar
                                    selectedStages={selectedStages}
                                    selectedCategories={selectedCategories}
                                    countryIso2={countryIso2}
                                    stateCode={stateCode}
                                    loc={loc}
                                    onStageToggle={handleStageToggle}
                                    onCategoryToggle={handleCategoryToggle}
                                    onCountryChange={handleCountryChange}
                                    onStateChange={handleStateChange}
                                    onLocChange={handleLocChange}
                                    onClearAll={handleClearAll}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * pagination.perPage + 1}</span> - <span className="font-bold text-gray-900">{Math.min(currentPage * pagination.perPage, pagination.total)}</span> of <span className="font-bold text-gray-900">{pagination.total}</span> projects
                            </p>
                        </div>

                        {loading && (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: brand.primary }} />
                                    <p className="mt-4 text-gray-600">Loading projects...</p>
                                </div>
                            </div>
                        )}

                        {!loading && projects.length === 0 && (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-4 text-xl font-bold text-gray-900">No projects found</h3>
                                    <p className="mt-2 text-gray-600">Try adjusting your filters or search query</p>
                                    <button onClick={handleClearAll} className="mt-4 rounded-xl border-2 px-6 py-3 text-sm font-bold transition hover:bg-gray-50" style={{ borderColor: brand.primary, color: brand.primary }}>
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && projects.length > 0 && (
                            <>
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {projects.map((project) => <ProjectCard key={project.hash} project={project} />)}
                                </div>

                                {pagination.pages > 1 && (
                                    <div className="mt-12 flex items-center justify-center gap-2">
                                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 disabled:opacity-50 disabled:hover:border-gray-200">
                                            Previous
                                        </button>

                                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                            .filter((page) => page === 1 || page === pagination.pages || Math.abs(page - currentPage) <= 2)
                                            .map((page, idx, arr) => {
                                                const prevPage = arr[idx - 1];
                                                const showEllipsis = prevPage && page - prevPage > 1;
                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                                        <button onClick={() => handlePageChange(page)} className={`rounded-lg border-2 px-4 py-2 text-sm font-bold transition ${currentPage === page ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-700 hover:border-blue-500"}`}>
                                                            {page}
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.pages} className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 disabled:opacity-50 disabled:hover:border-gray-200">
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}