"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import CreatableSelect from "react-select/creatable";
import RichTextEditor from "@/components/global/RichTextEditor";
import { CATEGORY_OPTIONS, normalizeCategories } from "@/lib/taxonomies/categories";
import countriesData from "world-countries";
import { State } from "country-state-city";
import PageHeader from "@/components/dashboard/PageHeader";

// --- Brand palette ---
const brand = {
    lightBlue: "#EBF5FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

// Funding stages
const fundingStages = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];
const FUNDING_OPTIONS = fundingStages.map((s) => ({ label: s, value: s }));

type SelectOption = { label: string; value: string };
type Country = { cca2: string; name: { common: string }; flag: string };

type ProjectFormData = {
    // Basic Info
    name: string;
    tagline: string;
    stage: string;
    founded: string;
    category: string[];

    // Pitch
    elevatorPitch: string;
    problemStatement: string;
    solution: string;
    model: string;
    traction: string;

    // Details
    urls: {
        website?: string;
        deck?: string;
        demo?: string;
        linkedin?: string;
        twitter?: string;
    };
    teamSize: number | null;
    capitalSought: number | null;
    valuation: number | null;
    foundingTarget: number | null;
    previousAmountFunding: number | null;
    previousRound: string;
    previousRoundDate: string;
};

function normalizeFounded(input: string | null | undefined) {
    if (!input) return null;
    const val = input.trim();
    if (/^\d{4}$/.test(val)) return `${val}-01-01`;
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(val)) return `${val}-01`;
    if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(val)) return val;
    return val;
}

// Reusable gradient + dotted overlay label button
function BlueLabelButton({
                             open,
                             onClick,
                             title,
                         }: {
    open: boolean;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            className="relative flex w-full items-center justify-between p-4 text-left text-white transition"
            style={{ background: "linear-gradient(135deg, #003D7A, #0066CC)" }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div
                    className="absolute h-full w-full"
                    style={{
                        backgroundImage: "radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)",
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>
            <h2 className="relative z-10 text-xl font-black">{title}</h2>
            <svg
                className={`relative z-10 h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );
}

/** === Shared SELECT styles (same as Create Profile) === */
const SELECT_STYLES: StylesConfig<SelectOption, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: 46,
        borderWidth: 2,
        borderRadius: 12,
        borderColor: state.isFocused ? brand.primary : "#E5E7EB",
        boxShadow: state.isFocused ? "0 0 0 4px rgba(0,102,204,.15)" : "none",
        ":hover": { borderColor: state.isFocused ? brand.primary : "#D1D5DB" },
        fontSize: "0.875rem",
        fontWeight: 500,
    }),
    singleValue: (base) => ({ ...base, color: "#111827", fontWeight: 600 }),
    input: (base) => ({ ...base, color: "#111827", fontWeight: 500 }),
    placeholder: (base) => ({ ...base, color: "#6B7280" }),
    option: (base, state) => ({
        ...base,
        fontSize: "0.875rem",
        fontWeight: state.isSelected ? 600 : 500,
        color: state.isSelected ? "white" : state.isFocused ? "white" : "#1F2937",
        backgroundColor: state.isSelected ? brand.primary : state.isFocused ? brand.primary : "transparent",
        paddingTop: 8,
        paddingBottom: 8,
        cursor: "pointer",
    }),
    menu: (base) => ({
        ...base,
        borderRadius: 12,
        border: "2px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25), 0 0 0 4px rgba(0,102,204,0.08)",
    }),
    menuList: (base) => ({ ...base, maxHeight: 240, paddingTop: 4, paddingBottom: 4 }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: brand.lightBlue,
        borderRadius: 8,
        border: "1px solid rgba(0,102,204,0.15)",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: brand.darkBlue,
        fontWeight: 600,
        fontSize: "0.75rem",
        paddingLeft: 6,
    }),
    multiValueRemove: (base) => ({
        ...base,
        borderRadius: "0 8px 8px 0",
        ":hover": { backgroundColor: brand.primary, color: "white" },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function CreateProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Accordion sections state
    const [openSections, setOpenSections] = useState({
        basic: true,
        pitch: false,
        traction: false,
        funding: false,
    });

    // form data
    const [formData, setFormData] = useState<ProjectFormData>({
        name: "",
        tagline: "",
        stage: "",
        founded: "",
        category: [],
        elevatorPitch: "",
        problemStatement: "",
        solution: "",
        model: "",
        traction: "",
        urls: {},
        teamSize: null,
        capitalSought: null,
        valuation: null,
        foundingTarget: null,
        previousAmountFunding: null,
        previousRound: "",
        previousRoundDate: "",
    });

    // Location UI state
    const [countryIso, setCountryIso] = useState<string>("US"); // preselect United States
    const [stateName, setStateName] = useState<string>("");

    // Country & state options (with flags, same feel as profile)
    const countryOptions = useMemo(
        () =>
            (countriesData as Country[])
                .map((c) => ({ label: `${c.flag} ${c.name.common}`, value: c.cca2 }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        []
    );

    const stateOptions: SelectOption[] = useMemo(() => {
        if (!countryIso) return [];
        const states = State.getStatesOfCountry(countryIso) || [];
        return states.map((s) => ({ value: s.name, label: s.name })).sort((a, b) => a.label.localeCompare(b.label));
    }, [countryIso]);

    // contributors state
    const [contribEmails, setContribEmails] = useState<string[]>([]);
    const [emailDraft, setEmailDraft] = useState("");

    // media state
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    // --- helpers to update form ---
    const updateField = (field: keyof ProjectFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const updateUrlField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, urls: { ...prev.urls, [field]: value } }));
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const addEmailsFromString = (text: string) => {
        const emails = sanitizeEmails(text.split(/[,\s;]+/));
        if (emails.length) {
            setContribEmails((prev) => Array.from(new Set([...prev, ...emails])));
        }
    };

    const commitDraft = () => {
        if (!emailDraft.trim()) return;
        addEmailsFromString(emailDraft);
        setEmailDraft("");
    };

    const handleEmailKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (["Enter", "Tab", ",", " "].includes(e.key)) {
            e.preventDefault();
            commitDraft();
        } else if (e.key === "Backspace" && emailDraft === "" && contribEmails.length) {
            setContribEmails((prev) => prev.slice(0, -1));
        }
    };

    const handleEmailPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
        const text = e.clipboardData.getData("text");
        if (text && /[,;\s]/.test(text)) {
            e.preventDefault();
            addEmailsFromString(text);
        }
    };

    const removeEmail = (email: string) => setContribEmails((prev) => prev.filter((e) => e !== email));

    const isDraftValid =
        emailDraft.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim().toLowerCase());

    const sanitizeEmails = (emails: string[]): string[] =>
        Array.from(
            new Set(
                emails
                    .map((e) => e.trim().toLowerCase())
                    .filter((e) => e !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
            )
        );

    // --- validation ---
    const validateForm = (): boolean => {
        if (!formData.name.trim() || !formData.tagline.trim()) {
            setErrorMsg("Project name and tagline are required");
            return false;
        }
        if (formData.category.length === 0) {
            setErrorMsg("Please select at least one category");
            return false;
        }
        if (!formData.elevatorPitch.trim()) {
            setErrorMsg("Elevator pitch is required");
            return false;
        }
        return true;
    };

    // Build location object with readable country name (no flag in payload)
    const countryName =
        (countriesData as Country[]).find((c) => c.cca2 === countryIso)?.name.common || "";
    const locationObj = countryIso
        ? { country: countryName, state: stateName || null, iso2: countryIso }
        : null;

    // --- save draft ---
    const handleSaveDraft = async () => {
        setErrorMsg(null);
        if (!formData.name.trim() || !formData.tagline.trim()) {
            setErrorMsg("Project name and tagline are required to save a draft.");
            return;
        }

        setLoading(true);

        try {
            const payload: any = {
                name: formData.name,
                tagline: formData.tagline,
                stage: formData.stage || null,
                founded: normalizeFounded(formData.founded),
                category: formData.category,
                elevatorPitch: formData.elevatorPitch || null,
                problemStatement: formData.problemStatement || null,
                solution: formData.solution || null,
                model: formData.model || null,
                traction: formData.traction || null,
                urls: Object.keys(formData.urls).length > 0 ? formData.urls : null,
                teamSize: formData.teamSize,
                capitalSought: formData.capitalSought,
                valuation: formData.valuation,
                status: "draft",
                foundingTarget: formData.foundingTarget,
                previousAmountFunding: formData.previousAmountFunding,
                previousRound: formData.previousRound || null,
                previousRoundDate: formData.previousRoundDate || null,
                location: locationObj,
            };

            // contributors (IDs + Emails) at create time
            const emails = sanitizeEmails(contribEmails);
            if (emails.length > 0) payload.contributorsEmails = emails;

            const formDataUpload = new FormData();
            formDataUpload.append("data", JSON.stringify(payload));
            if (logoFile) formDataUpload.append("logo", logoFile);
            if (bannerFile) formDataUpload.append("banner", bannerFile);
            if (pitchDeckFile) formDataUpload.append("pitchDeck", pitchDeckFile);
            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => formDataUpload.append("gallery[]", file));
            }

            const token = localStorage.getItem("auth_token") || "";

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataUpload,
            });

            const responseJson = await res.json();
            if (res.status !== 201) {
                const msg = (responseJson && responseJson.message) || `Failed to save draft (status ${res.status})`;
                setErrorMsg(msg);
                setLoading(false);
                return;
            }
            router.push(`/dashboard/projects/${responseJson.hash}`);
        } catch (err) {
            console.error("[SAVE DRAFT] error:", err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- submit for review ---
    const handleSendForReview = async () => {
        setErrorMsg(null);
        if (!validateForm()) return;

        setLoading(true);

        try {
            const payload: any = {
                name: formData.name,
                tagline: formData.tagline,
                stage: formData.stage || null,
                founded: normalizeFounded(formData.founded),
                category: formData.category,
                elevatorPitch: formData.elevatorPitch || null,
                problemStatement: formData.problemStatement || null,
                solution: formData.solution || null,
                model: formData.model || null,
                traction: formData.traction || null,
                urls: Object.keys(formData.urls).length > 0 ? formData.urls : null,
                teamSize: formData.teamSize,
                capitalSought: formData.capitalSought,
                valuation: formData.valuation,
                status: "pending_review",
                foundingTarget: formData.foundingTarget,
                previousAmountFunding: formData.previousAmountFunding,
                previousRound: formData.previousRound || null,
                previousRoundDate: formData.previousRoundDate || null,
                location: locationObj,
            };

            const emails = sanitizeEmails(contribEmails);
            if (emails.length > 0) payload.contributorsEmails = emails;

            const formDataUpload = new FormData();
            formDataUpload.append("data", JSON.stringify(payload));
            if (logoFile) formDataUpload.append("logo", logoFile);
            if (bannerFile) formDataUpload.append("banner", bannerFile);
            if (pitchDeckFile) formDataUpload.append("pitchDeck", pitchDeckFile);
            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => formDataUpload.append("gallery[]", file));
            }

            const token = localStorage.getItem("auth_token") || "";

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataUpload,
            });

            const responseJson = await res.json();
            if (res.status !== 201) {
                const msg = (responseJson && responseJson.message) || `Failed to submit for review (status ${res.status})`;
                setErrorMsg(msg);
                setLoading(false);
                return;
            }
            router.push(`/dashboard/projects/${responseJson.hash}`);
        } catch (err) {
            console.error("[SEND FOR REVIEW] error:", err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title={`Create Your Project`}
                subtitle="Fill out the details below to get started."
                ctaHref="/dashboard/projects/new"
                ctaLabel="New Project"
            />
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <main className="mx-auto max-w-4xl px-6 py-12">
                    {errorMsg && (
                        <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <svg className="h-5 w-5 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="space-y-4">
                            {/* Section 1: Basic Information */}
                            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                                <BlueLabelButton open={openSections.basic} onClick={() => toggleSection("basic")} title="Basic Information" />
                                {openSections.basic && (
                                    <div className="space-y-6 border-t-2 border-gray-100 p-6">
                                        <p className="text-gray-600">Tell us about your project</p>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Project Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                required
                                                onChange={(e) => updateField("name", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                placeholder="AeroClean Systems"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Tagline *</label>
                                            <input
                                                type="text"
                                                value={formData.tagline}
                                                required
                                                onChange={(e) => updateField("tagline", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                placeholder="One sentence describing your project"
                                            />
                                        </div>

                                        {/* Location */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-gray-700">Country</label>
                                                <Select<SelectOption>
                                                    instanceId="country"
                                                    styles={SELECT_STYLES}
                                                    options={countryOptions}
                                                    value={countryOptions.find((o) => o.value === countryIso) || null}
                                                    onChange={(opt: SingleValue<SelectOption>) => {
                                                        const iso = opt?.value || "";
                                                        setCountryIso(iso);
                                                        setStateName("");
                                                    }}
                                                    placeholder="Select a country…"
                                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                    menuPosition="fixed"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-gray-700">State / Province (optional)</label>
                                                <Select<SelectOption>
                                                    instanceId="state"
                                                    styles={SELECT_STYLES}
                                                    isDisabled={!countryIso}
                                                    options={stateOptions}
                                                    value={stateOptions.find((o) => o.value === stateName) || null}
                                                    onChange={(opt: SingleValue<SelectOption>) => setStateName(opt?.value || "")}
                                                    placeholder={countryIso ? "Select a state/province…" : "Select a country first…"}
                                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                    menuPosition="fixed"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Funding Stage</label>
                                            <Select<SelectOption, false>
                                                instanceId="stage"
                                                styles={SELECT_STYLES}
                                                options={FUNDING_OPTIONS}
                                                value={FUNDING_OPTIONS.find((o) => o.value === formData.stage) || null}
                                                onChange={(opt) => updateField("stage", (opt as SelectOption | null)?.value || "")}
                                                placeholder="Select stage"
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                isClearable
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Founded</label>
                                            <input
                                                type="date"
                                                value={formData.founded || ""}
                                                onChange={(e) => updateField("founded", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                placeholder="YYYY-MM-DD"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Tip: you can type <code>2023</code> and we’ll store it as <code>2023-01-01</code>.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Categories *</label>
                                            <p className="mb-3 text-xs text-gray-500">Search and select multiple. You can also create new categories.</p>
                                            <CreatableSelect<SelectOption, true>
                                                isMulti
                                                options={CATEGORY_OPTIONS}
                                                value={formData.category.map((c) => ({ label: c, value: c }))}
                                                onChange={(vals) =>
                                                    updateField(
                                                        "category",
                                                        normalizeCategories((vals as Array<{ label: string; value: string }>).map((v) => v.value), true)
                                                    )
                                                }
                                                placeholder="Type to search…"
                                                formatCreateLabel={(inputValue) => `Add “${inputValue}”`}
                                                classNamePrefix="rs"
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={SELECT_STYLES}
                                            />
                                            <p className="mt-2 text-xs text-gray-500">{formData.category.length} selected</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Your Pitch */}
                            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                                <BlueLabelButton open={openSections.pitch} onClick={() => toggleSection("pitch")} title="Your Pitch" />
                                {openSections.pitch && (
                                    <div className="space-y-6 border-t-2 border-gray-100 p-6">
                                        <p className="text-gray-600">Explain your vision and value proposition</p>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                                Elevator Pitch * (30 seconds summary)
                                            </label>
                                            <RichTextEditor
                                                value={formData.elevatorPitch}
                                                onChange={(val) => updateField("elevatorPitch", val)}
                                                placeholder="How does your product actually solve the problem?"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Problem Statement</label>
                                            <RichTextEditor
                                                value={formData.problemStatement}
                                                onChange={(val) => updateField("problemStatement", val)}
                                                placeholder="What problem are you solving?"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Solution</label>
                                            <RichTextEditor
                                                value={formData.solution}
                                                onChange={(val) => updateField("solution", val)}
                                                placeholder="How does your product/service solve this problem?"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Business Model</label>
                                            <RichTextEditor
                                                value={formData.model}
                                                onChange={(val) => updateField("model", val)}
                                                placeholder="How do you make money? (e.g., SaaS subscription, marketplace commission, etc.)"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Traction & Metrics */}
                            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                                <BlueLabelButton open={openSections.traction} onClick={() => toggleSection("traction")} title="Traction & Metrics" />
                                {openSections.traction && (
                                    <div className="space-y-6 border-t-2 border-gray-100 p-6">
                                        <p className="text-gray-600">Show your progress and achievements</p>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Current Traction</label>
                                            <RichTextEditor
                                                value={formData.traction}
                                                onChange={(val) => updateField("traction", val)}
                                                placeholder="Key metrics, customers, revenue, partnerships, milestones achieved..."
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Include numbers: users, revenue, growth rate, customers, etc.</p>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Team Size</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.teamSize || ""}
                                                onChange={(e) => updateField("teamSize", e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                placeholder="4"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-gray-700">Links & Resources</label>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">Website</label>
                                                <input
                                                    type="url"
                                                    value={formData.urls.website || ""}
                                                    onChange={(e) => updateUrlField("website", e.target.value)}
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    placeholder="https://yourproject.com"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">Pitch Deck (link)</label>
                                                <input
                                                    type="url"
                                                    value={formData.urls.deck || ""}
                                                    onChange={(e) => updateUrlField("deck", e.target.value)}
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">Demo Video</label>
                                                <input
                                                    type="url"
                                                    value={formData.urls.demo || ""}
                                                    onChange={(e) => updateUrlField("demo", e.target.value)}
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    placeholder="https://youtube.com/..."
                                                />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">LinkedIn</label>
                                                    <input
                                                        type="url"
                                                        value={formData.urls.linkedin || ""}
                                                        onChange={(e) => updateUrlField("linkedin", e.target.value)}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                        placeholder="https://linkedin.com/company/..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">Twitter</label>
                                                    <input
                                                        type="url"
                                                        value={formData.urls.twitter || ""}
                                                        onChange={(e) => updateUrlField("twitter", e.target.value)}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                        placeholder="https://twitter.com/..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Funding Details + Media + Contributors */}
                            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                                <BlueLabelButton open={openSections.funding} onClick={() => toggleSection("funding")} title="Funding Details & Media" />
                                {openSections.funding && (
                                    <div className="space-y-10 border-t-2 border-gray-100 p-6">
                                        {/* Funding section */}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="mb-2 text-lg font-black text-gray-900">Funding Details</h3>
                                                <p className="text-gray-600">Tell investors about your funding needs</p>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-gray-700">Capital Sought (USD)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1000"
                                                        value={formData.capitalSought || ""}
                                                        onChange={(e) => updateField("capitalSought", e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full rounded-xl border-2 border-gray-200 py-3 pl-8 pr-4 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                        placeholder="500000"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Current Valuation (USD)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="10000"
                                                        value={formData.valuation || ""}
                                                        onChange={(e) => updateField("valuation", e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full rounded-xl border-2 border-gray-200 py-3 pl-8 pr-4 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                        placeholder="3000000"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700">Founding Target (USD)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="10000"
                                                    value={formData.foundingTarget || ""}
                                                    onChange={(e) => updateField("foundingTarget", e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-8 pr-4 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    placeholder="3000000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700">Previous Amount Funding (USD)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="10000"
                                                    value={formData.previousAmountFunding || ""}
                                                    onChange={(e) =>
                                                        updateField("previousAmountFunding", e.target.value ? parseInt(e.target.value) : null)
                                                    }
                                                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-8 pr-4 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                    placeholder="3000000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Previous Round</label>
                                            <Select<SelectOption, false>
                                                instanceId="previousRound"
                                                styles={SELECT_STYLES}
                                                options={FUNDING_OPTIONS}
                                                value={FUNDING_OPTIONS.find((o) => o.value === formData.previousRound) || null}
                                                onChange={(opt) => updateField("previousRound", (opt as SelectOption | null)?.value || "")}
                                                placeholder="Select round"
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                isClearable
                                            />
                                            <p className="mt-1 text-xs text-gray-500">What was the last round you closed?</p>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Previous Round Date</label>
                                            <input
                                                type="date"
                                                value={formData.previousRoundDate}
                                                onChange={(e) => updateField("previousRoundDate", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                placeholder="2024-08-15"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">When did that round close?</p>
                                        </div>

                                        {/* Contributors */}
                                        <div className="space-y-4 rounded-xl border-2 border-gray-200 p-4">
                                            <h3 className="text-base font-bold text-gray-900">Contributors</h3>
                                            <p className="text-xs text-gray-500">
                                                Add team members who can help manage this project. You can use user IDs (CSV) and/or emails.
                                            </p>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">Contributor Emails</label>

                                                <div className="rounded-xl border-2 border-gray-200 p-2">
                                                    {/* chips */}
                                                    {contribEmails.length > 0 && (
                                                        <div className="mb-2 flex flex-wrap gap-2">
                                                            {contribEmails.map((em) => (
                                                                <span
                                                                    key={em}
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900"
                                                                >
                                  {em}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeEmail(em)}
                                                                        className="rounded-md p-0.5 text-blue-700 hover:bg-blue-100"
                                                                        aria-label={`Remove ${em}`}
                                                                        title="Remove"
                                                                    >
                                    ×
                                  </button>
                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* input */}
                                                    <input
                                                        type="email"
                                                        inputMode="email"
                                                        value={emailDraft}
                                                        onChange={(e) => setEmailDraft(e.target.value)}
                                                        onKeyDown={handleEmailKeyDown}
                                                        onPaste={handleEmailPaste}
                                                        onBlur={commitDraft}
                                                        placeholder="type email and press Enter…"
                                                        className={`w-full rounded-lg border-2 px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                                            isDraftValid ? "border-gray-200 focus:border-blue-500" : "border-red-300 focus:border-red-500"
                                                        }`}
                                                    />
                                                </div>

                                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                                    <p className="text-gray-500">
                                                        Press <strong>Enter</strong>, <strong>Tab</strong>, comma, or space to add. Paste multiple with commas/spaces.
                                                    </p>
                                                    <p className="text-gray-500">{contribEmails.length} added</p>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                <ul className="list-disc space-y-1 pl-5">
                                                    <li>The owner is added automatically and will not be duplicated.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Media section */}
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-black text-gray-900">Media & Uploads</h3>

                                            <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 p-4">
                                                <div className="flex-1">
                                                    <label className="mb-1 block text-sm font-bold text-gray-700">Project Logo</label>
                                                    <p className="mb-3 text-xs text-gray-500">Square format works best (512x512 or larger)</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
                                                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                                    />
                                                    {logoFile && (
                                                        <p className="mt-2 text-xs text-gray-600">
                                                            Selected: <span className="font-medium text-gray-900">{logoFile.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                {logoFile && (
                                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner">
                                                        <img src={URL.createObjectURL(logoFile)} alt="logo preview" className="h-full w-full object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 p-4">
                                                <div className="flex-1">
                                                    <label className="mb-1 block text-sm font-bold text-gray-700">Banner Image</label>
                                                    <p className="mb-3 text-xs text-gray-500">Wide format (1200x400 or larger). Displayed at the top.</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-purple-700"
                                                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                                                    />
                                                    {bannerFile && (
                                                        <p className="mt-2 text-xs text-gray-600">
                                                            Selected: <span className="font-medium text-gray-900">{bannerFile.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                {bannerFile && (
                                                    <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner">
                                                        <img src={URL.createObjectURL(bannerFile)} alt="banner preview" className="h-full w-full object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Pitch Deck (PDF upload)</label>
                                                <p className="text-xs text-gray-500">We&#39;ll store this privately for vetted investors.</p>
                                                <input
                                                    type="file"
                                                    accept="application/pdf, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, .pdf,.ppt,.pptx"
                                                    className="mt-3 w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-black"
                                                    onChange={(e) => setPitchDeckFile(e.target.files?.[0] || null)}
                                                />
                                                {pitchDeckFile && (
                                                    <p className="mt-2 text-xs text-gray-600">
                                                        Selected: <span className="font-medium text-gray-900">{pitchDeckFile.name}</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Product / App Screenshots</label>
                                                <p className="text-xs text-gray-500">You can add multiple images. We&#39;ll show them in your gallery.</p>
                                                <input
                                                    multiple
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-3 w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-green-700"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        setGalleryFiles(files as File[]);
                                                    }}
                                                />
                                                {galleryFiles.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-xs font-medium text-gray-700">
                                                            {galleryFiles.length} file{galleryFiles.length === 1 ? "" : "s"} selected
                                                        </p>
                                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                                            {galleryFiles.map((imgFile, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner"
                                                                >
                                                                    <img src={URL.createObjectURL(imgFile)} alt={`gallery-${i}`} className="h-full w-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary Card */}
                                        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                                            <h3 className="mb-4 text-lg font-bold text-gray-900">Project Summary</h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Project Name:</span>
                                                    <span className="font-bold text-gray-900">{formData.name || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Stage:</span>
                                                    <span className="font-bold text-gray-900">{formData.stage || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Categories:</span>
                                                    <span className="font-bold text-gray-900">
                            {formData.category.length > 0 ? formData.category.length : "—"}
                          </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Team Size:</span>
                                                    <span className="font-bold text-gray-900">{formData.teamSize || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Contributors:</span>
                                                    <span className="font-bold text-gray-900">{sanitizeEmails(contribEmails).length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Seeking:</span>
                                                    <span className="font-bold text-gray-900">
                            {formData.capitalSought ? `$${formData.capitalSought.toLocaleString()}` : "—"}
                          </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                                            <div className="flex gap-3">
                                                <svg className="h-5 w-5 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-bold">Ready to submit?</p>
                                                    <p className="mt-1">
                                                        You can save as a draft to continue later, or send for review when ready. Our team will review it
                                                        before it goes live.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex items-center justify-between border-t pt-6">
                            <button
                                onClick={handleSaveDraft}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Save Draft
                            </button>

                            <button
                                onClick={handleSendForReview}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${brand.accent}, #00A372)` }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                                            <path className="opacity-75" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" />
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Send for Review
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
