"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

/* ---------------- TYPES (match BE summarizeProjectForList) ---------------- */
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
    image: { id: number | null; url: string | null; type: string | null; hash: string | null } | null;
    boost?: boolean;
    superBoost?: boolean;
    location?: { country?: string | null; state?: string | null; iso2?: string | null } | string | null;
};

type PagedProjects = {
    page: number;
    perPage: number;
    total: number;
    pages: number;
    items: ProjectSummary[];
};

/* -------- MASTER CATEGORY LIST (for "See all") -------- */
const ALL_CATEGORIES = [
    "AI / ML","Analytics / BI","AR / VR / XR","Blockchain / Web3","ClimateTech",
    "Aerospace / SpaceTech","Autonomous Systems","Robotics","Drones",
    "Clean Energy / Renewables","Energy Storage / Batteries","Carbon / Offsets / MRV",
    "Agriculture / AgTech","FoodTech","BioTech","Synthetic Biology","HealthTech",
    "Digital Health / Telemedicine","MedTech / Devices","Pharma / Drug Discovery",
    "FinTech","DeFi / Crypto Finance","InsurTech","PropTech / Real Estate",
    "ConstructionTech","Manufacturing / Industry 4.0","Advanced Materials",
    "Semiconductors / Chips","IoT / Embedded","Edge Computing","Networking / 5G",
    "Cybersecurity","Privacy / Compliance","Developer Tools","SaaS / Productivity",
    "SaaS / Infrastructure","Cloud / DevOps / Platform","Open Source","Open Science",
    "Data Infrastructure / Databases","MLOps / DataOps","E-commerce","Marketplaces",
    "RetailTech / POS","Logistics / Supply Chain","Mobility / Transportation",
    "Automotive / EV","Aviation","Maritime","Media / Entertainment","Gaming",
    "Creator Economy","AdTech / MarTech","SalesTech / RevOps","HRTech / Future of Work",
    "EdTech","GovTech / Public Sector","LegalTech","Civic / Social Impact",
    "Security / Defense","Travel / Hospitality","Sports / Fitness","Consumer Social",
    "Communication / Collaboration","Financial Services (Traditional)",
    "Nonprofit / Philanthropy","Localization / Translation","Quantum Tech","Wearables",
    "Home / Smart Home","PetTech","Fashion / BeautyTech","Gaming Infrastructure",
    "Digital Identity","NFTs / Digital Assets","Search / Recommendations",
    "Personalization","Other"
] as const;

/* ---------------- CONSTANTS / HELPERS ---------------- */
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const stageColors: Record<FundingStage, { bg: string; text: string; border: string }> = {
    "Pre-seed": { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
    Seed: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
    "Series A": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
    "Series B": { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
    "Series C": { bg: "#FCE7F3", text: "#831843", border: "#EC4899" },
    Growth: { bg: "#E9D5FF", text: "#581C87", border: "#A855F7" },
};

const currency = (n: number | null | undefined) =>
    n == null
        ? "—"
        : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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

/* ---------------- UI: CARD (works with ProjectSummary) ---------------- */
function ProjectCard({ project }: { project: ProjectSummary }) {
    const stageStyle = stageColors[project.stage];
    const imageUrl = fromBE(project.image?.url);
    const detailHref = `/projects/${project.hash}`;
    const pct = project.foundingTarget && project.capitalSought
        ? Math.max(0, Math.min(100, (project.capitalSought / project.foundingTarget) * 100))
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
                    <span className="absolute right-4 top-4 z-30 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">⭐ Super Boost</span>
                )}
                {!project.superBoost && project.boost && (
                    <span className="absolute right-4 top-4 z-30 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">⭐ Featured</span>
                )}

                {project.categories && project.categories.length > 0 && (
                    <div className="absolute left-4 bottom-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm" style={{ color: brand.primary }}>
                        {project.categories[0]}
                    </div>
                )}

                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>

            <div className="flex flex-1 flex-col p-5">
                <div
                    className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                    style={{ backgroundColor: stageStyle.bg, color: stageStyle.text, borderColor: stageStyle.border }}
                >
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
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: brand.accent }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{pct.toFixed(0)}% funded</span>
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

/* --------------- CATEGORY EXPLORER --------------- */
function CategoryExplorer({
                              projects,
                              allCategories = ALL_CATEGORIES,
                              activeCategory,
                              onChangeCategory,
                          }: {
    projects: ProjectSummary[];
    allCategories?: readonly string[];
    activeCategory: string | null;
    onChangeCategory: (cat: string | null) => void;
}) {
    const [showAll, setShowAll] = useState(false);
    const [q, setQ] = useState("");

    // counts per category (from listed projects)
    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const p of projects) {
            (p.categories || []).forEach((cat) => m.set(cat, (m.get(cat) ?? 0) + 1));
        }
        return m;
    }, [projects]);

    const present = useMemo(
        () => Array.from(counts.keys()).sort((a, b) => counts.get(b)! - counts.get(a)!),
        [counts]
    );

    const grid = useMemo(() => {
        const base = showAll ? [...allCategories] : present;
        const term = q.trim().toLowerCase();
        const filtered = term ? base.filter((c) => c.toLowerCase().includes(term)) : base;
        if (showAll) {
            filtered.sort((a, b) => {
                const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
                return diff !== 0 ? diff : a.localeCompare(b);
            });
        }
        return filtered;
    }, [showAll, q, allCategories, present, counts]);

    return (
        <section className="mt-12">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm font-semibold text-gray-500">Browse by category</span>

                <button
                    onClick={() => setShowAll((s) => !s)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-blue-600 hover:text-blue-600"
                >
                    {showAll ? "Show present only" : "See all"}
                </button>

                {showAll && (
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search categories…"
                        className="w-56 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 outline-none transition focus:border-blue-600"
                    />
                )}

                {activeCategory && (
                    <Link
                        href="/projects"
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-blue-600 hover:text-blue-600"
                    >
                        Clear filter
                    </Link>
                )}
            </div>

            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
                {grid.length ? (
                    grid.map((cat) => {
                        const isActive = activeCategory === cat;
                        const className = [
                            "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                            isActive
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-600 hover:text-blue-600",
                        ].join(" ");
                        return (
                            <Link
                                key={cat}
                                href={{ pathname: "/projects", query: { category: cat } }}
                                className={className}
                                title={`${counts.get(cat) ?? 0} project(s)`}
                                onClick={() => onChangeCategory(cat)}
                            >
                                <span>{cat}</span>
                                {(counts.get(cat) ?? 0) > 0 && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 group-hover:bg-blue-600 group-hover:text-white">
                    {counts.get(cat)}
                  </span>
                                )}
                            </Link>
                        );
                    })
                ) : (
                    <div className="text-sm text-gray-500">No categories match your search.</div>
                )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-500">
                Showing {showAll ? "all categories" : "only categories with listed projects"}.
            </p>
        </section>
    );
}

type Role = "founder" | "investor";

function RoleCard({
                      value,
                      selected,
                      onSelect,
                      title,
                      description,
                      icon,
                  }: {
    value: Role;
    selected: boolean;
    onSelect: (v: Role) => void;
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
                selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
            }`}
            aria-pressed={selected}
        >
            <div
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    selected ? "bg-blue-100" : "bg-gray-100"
                }`}
            >
                <span className={selected ? "text-blue-600" : "text-gray-600"}>{icon}</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-900">{title}</div>
                    <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                        }`}
                    >
            {selected && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            )}
          </span>
                </div>
                <div className="mt-1 text-xs text-gray-600">{description}</div>
            </div>
        </button>
    );
}

/* --------------- REGISTRATION FORM COMPONENT --------------- */
function RegistrationForm() {
    const router = useRouter();

    // NEW: role (default founder)
    const [role, setRole] = useState<Role>("founder");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const passScore = (() => {
        let s = 0;
        if (password.length >= 10) s++;
        if (/[a-z]/.test(password)) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return Math.min(s, 4);
    })();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (!fullName.trim()) {
            setErrorMsg("Please enter your full name.");
            return;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }
        if (password.length < 8) {
            setErrorMsg("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password, role }), // 👈 send role
            });

            const data = await res.json().catch(() => ({} as any));

            if (res.status === 201) {
                router.push("/login?registered=1");
                return;
            }

            const msg =
                (typeof data.message === "string" && data.message) ||
                (typeof data.error === "string" && data.error) ||
                "Registration failed. Please try again.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div
                    className="relative overflow-hidden p-6 text-center"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                >
                    <div className="absolute inset-0 opacity-10">
                        <div
                            className="absolute h-full w-full"
                            style={{
                                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                                backgroundSize: "40px 40px",
                            }}
                        />
                    </div>
                    <div className="relative">
                        <h2 className="text-2xl font-black text-white">Create Account</h2>
                        <p className="mt-1 text-sm text-blue-100">
                            {role === "founder" ? "Join and connect with investors" : "Discover and connect with founders"}
                        </p>
                    </div>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="mx-6 mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                            <svg className="h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-xs font-medium text-red-800">{errorMsg}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {/* Role selector */}
                    <fieldset>
                        <legend className="mb-2 block text-xs font-bold text-gray-700">I am a…</legend>
                        <div className="grid gap-2">
                            <RoleCard
                                value="founder"
                                selected={role === "founder"}
                                onSelect={setRole}
                                title="Founder"
                                description="Create a startup profile and showcase your raise."
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2a6 6 0 016 6v1h1a1 1 0 110 2h-1v1a6 6 0 11-12 0v-1H3a1 1 0 110-2h1V8a6 6 0 016-6z" />
                                    </svg>
                                }
                            />
                            <RoleCard
                                value="investor"
                                selected={role === "investor"}
                                onSelect={setRole}
                                title="Investor"
                                description="Review startups and contact founders directly."
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm9-3a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                    </svg>
                                }
                            />
                        </div>
                    </fieldset>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="mb-1 block text-xs font-bold text-gray-700">
                            Full Name *
                        </label>
                        <input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            placeholder="Jane Founder"
                            autoComplete="name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="mb-1 block text-xs font-bold text-gray-700">
                            Work Email *
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            placeholder="jane@company.com"
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="mb-1 block text-xs font-bold text-gray-700">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 pr-16 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                                {showPass ? "Hide" : "Show"}
                            </button>
                        </div>

                        <div className="mt-2">
                            <div className="flex gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all ${
                                            passScore > i ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-200"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                <span>Creating…</span>
                            </>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <span className="transition-transform group-hover:translate-x-1">🚀</span>
                            </>
                        )}
                    </button>

                    {/* Links */}
                    <p className="text-center text-xs text-gray-600">
                        Already have an account?{" "}
                        <a href="/login" className="font-bold text-blue-600 transition hover:text-blue-700">
                            Sign in
                        </a>
                    </p>

                    <p className="text-center text-xs leading-relaxed text-gray-500">
                        By creating an account you agree to our{" "}
                        <a href="/terms" className="font-medium text-blue-600 hover:underline">
                            Terms
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="font-medium text-blue-600 hover:underline">
                            Privacy Policy
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}

/* --------------- HIGH-TRACTION / SUPERBOOST SECTION --------------- */
function HighTractionSection({
                                 items,
                                 loading,
                                 fallback,
                                 title = "High-Traction Projects",
                                 label = "Premier Showcase",
                             }: {
    items: ProjectSummary[];
    loading: boolean;
    fallback: ProjectSummary[];
    title?: string;
    label?: string;
}) {
    const pool = items.length ? items : fallback.slice(0, 2);

    return (
        <section
            className="relative overflow-hidden py-20"
            style={{ background: `linear-gradient(135deg, ${brand.darkBlue}, ${brand.primary})` }}
        >
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute h-full w-full"
                    style={{
                        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-6">
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
                        <span className="text-2xl">🚀</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-white">{label}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white sm:text-5xl">{title}</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
                        Ventures demonstrating exceptional traction, clear vision, and strong founding teams
                    </p>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/20" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {pool.map((p) => {
                            const s = stageColors[p.stage];
                            const img = fromBE(p.image?.url) ?? "";
                            return (
                                <div
                                    key={p.hash}
                                    className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-blue-500/50"
                                >
                                    <div className="absolute right-4 top-4 z-30 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 text-xs font-bold uppercase text-white shadow-lg">
                                        🏆 Premier
                                    </div>

                                    <div className="flex flex-col gap-6 md:flex-row">
                                        <div className="relative aspect-video w-full overflow-hidden rounded-xl md:w-48">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={img}
                                                alt={p.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div
                                                className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-xs font-bold shadow backdrop-blur-sm"
                                                style={{ color: brand.primary }}
                                            >
                                                {(p.categories && p.categories[0]) || "—"}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div
                                                className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                                                style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                                            >
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: s.border }} />
                                                {p.stage}
                                            </div>

                                            <h3 className="mb-2 text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                                                <Link href={`/projects/${p.hash}`}>{p.title}</Link>
                                            </h3>

                                            <p className="mb-4 text-sm text-gray-600">{p.tagline || "—"}</p>

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div>
                                                    <span className="font-semibold text-gray-500">Seeking: </span>
                                                    <span className="text-lg font-bold text-gray-900">{currency(p.foundingTarget)}</span>
                                                </div>
                                                <span className="text-gray-400">•</span>
                                                <div>
                                                    <span className="font-semibold text-gray-500">Committed: </span>
                                                    <span className="text-lg font-bold" style={{ color: brand.accent }}>
                            {currency(p.capitalSought)}
                          </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <Link
                                                    href={`/projects/${p.hash}`}
                                                    className="rounded-lg px-4 py-2 text-sm font-bold text-white transition"
                                                    style={{ background: brand.primary }}
                                                >
                                                    View Details
                                                </Link>
                                                <Link
                                                    href={`/projects/${p.hash}#contact`}
                                                    className="rounded-lg border-2 px-4 py-2 text-sm font-bold transition hover:bg-gray-50"
                                                    style={{ borderColor: brand.primary, color: brand.primary }}
                                                >
                                                    Contact Founder
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

/* ---------------- PAGE (Dynamic) ---------------- */
export default function HomePage() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const [premier, setPremier] = useState<ProjectSummary[]>([]);
    const [featured, setFeatured] = useState<ProjectSummary[]>([]);
    const [recent, setRecent] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJSON = useCallback(async <T,>(url: string): Promise<T> => {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                const superBoostUrl = `${BE}/projects/superboosted?limit=2`;
                const boostUrl = `${BE}/projects/boosted?limit=8`;
                const recentUrl = `${BE}/projects?sort=recent&perPage=12`;

                const [superBoosted, boosted, recentPaged] = await Promise.all([
                    fetchJSON<ProjectSummary[]>(superBoostUrl),
                    fetchJSON<ProjectSummary[]>(boostUrl),
                    fetchJSON<PagedProjects>(recentUrl),
                ]);

                setPremier(superBoosted || []);
                setFeatured(boosted || []);
                setRecent(recentPaged.items || []);
            } catch (e) {
                console.error("Homepage fetch error:", e);
                setPremier([]);
                setFeatured([]);
                setRecent([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [fetchJSON]);

    const featuredFiltered = useMemo(
        () =>
            activeCategory
                ? featured.filter((p) => (p.categories || []).includes(activeCategory))
                : featured,
        [featured, activeCategory]
    );

    const allFiltered = useMemo(
        () =>
            activeCategory
                ? recent.filter((p) => (p.categories || []).includes(activeCategory))
                : recent,
        [recent, activeCategory]
    );

    const explorerPool = useMemo(() => {
        const seen = new Map<string, ProjectSummary>();
        [...premier, ...featured, ...recent].forEach(p => { if (!seen.has(p.hash)) seen.set(p.hash, p); });
        return Array.from(seen.values());
    }, [premier, featured, recent]);

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero with Registration Form */}
            <section
                className="relative overflow-hidden py-20"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                        {/* LEFT: Value Prop */}
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-lg">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                <span className="text-sm font-bold text-gray-700">
                  Discover high-quality projects and connect with founders
                </span>
                            </div>
                            <h1 className="max-w-4xl text-5xl font-black leading-tight text-gray-900 sm:text-6xl">
                                Connect with
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Innovative Founders
                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                                A curated directory of ambitious startups seeking funding. Discover projects by stage, category, and funding needs.
                            </p>
                            <div className="mt-10 flex flex-wrap items-center gap-4">
                                <Link
                                    href="/projects"
                                    className="rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                >
                                    Browse All Projects
                                </Link>
                                <Link
                                    href="/investors"
                                    className="rounded-xl border-2 bg-white px-8 py-4 text-base font-bold transition-all duration-300 hover:bg-gray-50"
                                    style={{ borderColor: brand.primary, color: brand.primary }}
                                >
                                    For Investors
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="mt-10 grid grid-cols-3 gap-6">
                                <div>
                                    <div className="text-3xl font-black text-gray-900">500+</div>
                                    <div className="mt-1 text-sm text-gray-600">Active investors</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-gray-900">$2.4M+</div>
                                    <div className="mt-1 text-sm text-gray-600">Capital raised</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-gray-900">85%</div>
                                    <div className="mt-1 text-sm text-gray-600">Get contacted</div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Registration Form */}
                        <div className="flex items-center justify-center lg:justify-end">
                            <RegistrationForm />
                        </div>
                    </div>

                    {/* Category Explorer */}
                    <CategoryExplorer
                        projects={explorerPool}
                        activeCategory={activeCategory}
                        onChangeCategory={setActiveCategory}
                    />
                </div>
            </section>

            {/* Funding Stages Filter Bar */}
            <section className="border-b bg-white py-4">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto">
                        <span className="text-sm font-semibold text-gray-700">Filter by stage:</span>
                        <div className="flex gap-2">
                            {(Object.keys(stageColors) as FundingStage[]).map((stage) => {
                                const s = stageColors[stage];
                                return (
                                    <Link
                                        key={stage}
                                        href={{ pathname: "/projects", query: { stage } }}
                                        className="whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                                        title={`Show ${stage} projects`}
                                    >
                                        {stage}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Premier Showcase */}
            <HighTractionSection
                items={premier}
                loading={loading}
                fallback={recent}
                title="High-Traction Projects"
                label="Premier Showcase"
            />

            {/* Featured Projects */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-gray-900">
                                {activeCategory ? `Featured in ${activeCategory}` : "Featured Projects"}
                            </h2>
                            <p className="mt-2 text-lg text-gray-600">Handpicked ventures with strong founding teams</p>
                        </div>
                    </div>

                    {loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {(featuredFiltered.length ? featuredFiltered : featured.slice(0, 4)).map((p) => (
                                <ProjectCard key={p.hash} project={p} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* All Projects */}
            <section className="py-20" style={{ backgroundColor: brand.lightBlue }}>
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">
                                {activeCategory ? `All Projects in ${activeCategory}` : "All Projects"}
                            </h2>
                            <p className="mt-1 text-gray-600">
                                {allFiltered.length} active {allFiltered.length === 1 ? "opportunity" : "opportunities"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/projects"
                                className="rounded-xl border-2 bg-white px-8 py-3 text-base font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                                style={{ borderColor: brand.primary, color: brand.primary }}
                            >
                                Explore More
                            </Link>
                        </div>
                    </div>

                    {loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {allFiltered.map((p) => (
                                <ProjectCard key={p.hash} project={p} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* For Founders CTA */}
            <section
                className="relative overflow-hidden py-24"
                style={{ background: `linear-gradient(135deg, ${brand.white}, ${brand.lightBlue})` }}
            >
                <div className="absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-6xl px-6">
                    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-1 shadow-2xl">
                        <div className="rounded-[22px] bg-white p-12">
                            <div className="grid gap-12 lg:grid-cols-2">
                                <div>
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
                                        <span className="text-lg">🚀</span>
                                        <span className="text-sm font-bold uppercase tracking-wider text-blue-700">For Founders</span>
                                    </div>
                                    <h3 className="mb-4 text-4xl font-black leading-tight text-gray-900">
                                        Get Your Project in Front of Investors
                                    </h3>
                                    <p className="mb-6 text-lg leading-relaxed text-gray-600">
                                        Join our curated directory and connect with investors actively looking for opportunities like yours.
                                        Control your narrative, showcase your traction, and get funded.
                                    </p>
                                    <div className="mb-8 grid gap-4">
                                        {["Direct investor access","Professional showcase","Manage inquiries"].map((label, i) => (
                                            <div className="flex items-start gap-3" key={i}>
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{label}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {i === 0 && "Get discovered by qualified investors searching by stage and category"}
                                                        {i === 1 && "Display your project with funding stage, goals, and current progress"}
                                                        {i === 2 && "Receive and manage investor contacts through our platform"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href="/register"
                                            className="inline-flex items-center rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                                        >
                                            List Your Project
                                        </Link>
                                        <Link
                                            href="/pricing"
                                            className="inline-flex items-center rounded-xl border-2 bg-white px-8 py-4 text-base font-bold transition-all duration-300 hover:bg-gray-50"
                                            style={{ borderColor: brand.primary, color: brand.primary }}
                                        >
                                            View Pricing
                                        </Link>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                                    <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-600">Success Stories</h4>
                                    <div className="space-y-6">
                                        <div className="rounded-xl bg-white p-5 shadow-sm">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                </div>
                                                <div className="font-bold text-gray-900">$850K raised</div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                "Listed our SaaS project and connected with 3 angel investors within 2 weeks. Closed our seed round in 45 days."
                                            </p>
                                            <p className="mt-2 text-xs font-medium text-gray-500">— TechFlow AI, Series A</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-5 shadow-sm">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                </div>
                                                <div className="font-bold text-gray-900">12 inquiries</div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                "The platform helped us get serious traction. Premier placement brought quality leads from VCs."
                                            </p>
                                            <p className="mt-2 text-xs font-medium text-gray-500">— GreenGrid Energy, Seed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20" style={{ backgroundColor: brand.primary }}>
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center">
                        <h2 className="mb-4 text-4xl font-black text-white">Connecting Innovation with Capital</h2>
                        <p className="mb-12 text-lg text-blue-100">Join founders and investors</p>
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
                                <div className="mb-2 text-5xl font-black text-white">—</div>
                                <div className="text-blue-100">Total Capital Raised</div>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
                                <div className="mb-2 text-5xl font-black text-white">{explorerPool.length}</div>
                                <div className="text-blue-100">Visible Projects</div>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
                                <div className="mb-2 text-5xl font-black text-white">—</div>
                                <div className="text-blue-100">Registered Investors</div>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
                                <div className="mb-2 text-5xl font-black text-white">85%</div>
                                <div className="text-blue-100">Connection Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}