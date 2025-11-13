"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import CreatableSelect from "react-select/creatable";
import RichTextEditor from "@/components/global/RichTextEditor";
import { CATEGORY_OPTIONS, normalizeCategories } from "@/lib/taxonomies/categories";
import countriesData from "world-countries";
import { State } from "country-state-city";
import PageHeader from "@/components/dashboard/PageHeader";
import TeamThreadReplies from "@/components/dashboard/TeamThreadReplies";

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

type ExistingMedia = {
    logo: { url: string; hash: string } | null;
    banner: { url: string; hash: string } | null;
    pitchDeck: { url: string; hash: string } | null;
    gallery: Array<{ url: string; hash: string }>;
};

type Contributor = {
    id: number;
    fullName: string | null;
    email: string;
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
            type="button"
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
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

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const fromBE = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BE}/${String(path).replace(/^\/+/, "")}`;
};

const appBase = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, ""); // e.g. http://localhost:3000
const makePublicUrl = (hash: string) => {
    const path = `/projects/${encodeURIComponent(hash)}`;
    if (appBase) return `${appBase}${path}`;
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return path; // fallback (SSR won't hit because this is a client component)
};

const sanitizeEmails = (emails: string[]): string[] =>
    Array.from(
        new Set(
            emails
                .map((e) => e.trim().toLowerCase())
                .filter((e) => e !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        )
    );

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const hash = params?.hash as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // --- delete flow state ---
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");

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

    // existing media from server
    const [existingMedia, setExistingMedia] = useState<ExistingMedia>({
        logo: null,
        banner: null,
        pitchDeck: null,
        gallery: [],
    });

    // flags to remove existing media
    const [removeFlags, setRemoveFlags] = useState({
        logo: false,
        banner: false,
        pitchDeck: false,
    });

    // new media files to upload
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    // contributors state
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [authorEmail, setAuthorEmail] = useState<string | null>(null);
    const [addEmail, setAddEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [contribNotice, setContribNotice] = useState<string | null>(null);

    // Location (country/state)
    const [countryIso, setCountryIso] = useState<string>("");
    const [stateName, setStateName] = useState<string>("");

    // Country & state options
    const countryOptions = React.useMemo(
        () =>
            (countriesData as any[])
                .map((c: any) => ({ label: c.name?.common as string, value: c.cca2 as string }))
                .sort((a: any, b: any) => a.label.localeCompare(b.label)),
        []
    );

    const stateOptions = React.useMemo(
        () => (countryIso ? State.getStatesOfCountry(countryIso) : []),
        [countryIso]
    );

    // Fetch existing project data
    useEffect(() => {
        if (!hash) return;

        const fetchProject = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("auth_token") || "";
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(hash)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!res.ok) {
                    throw new Error("Failed to load project");
                }

                const data = await res.json();

                // --- Prefill location from API (object or string) ---
                let parsedCountry = "";
                let parsedState = "";

                const loc = data.location;
                if (loc && typeof loc === "object") {
                    parsedCountry = loc.country || "";
                    parsedState = loc.state || "";
                } else if (typeof loc === "string" && loc.trim() !== "") {
                    const parts = loc.split(",").map((x: string) => x.trim()).filter(Boolean);
                    if (parts.length === 2) {
                        parsedState = parts[0];
                        parsedCountry = parts[1];
                    } else {
                        parsedCountry = parts[0] || "";
                    }
                }
                // map country name -> ISO2 for the select
                if (parsedCountry) {
                    const hit = countryOptions.find(
                        (c) => c.label.toLowerCase() === parsedCountry.toLowerCase()
                    );
                    if (hit) setCountryIso(hit.value);
                }
                if (parsedState) setStateName(parsedState);
                console.log(data);
                setFormData({
                    name: data.name || "",
                    tagline: data.tagline || "",
                    stage: data.stage || "",
                    founded: data.founded || "",
                    category: data.category || [],
                    elevatorPitch: data.elevatorPitch || "",
                    problemStatement: data.problemStatement || "",
                    solution: data.solution || "",
                    model: data.model || "",
                    traction: data.traction || "",
                    urls: data.urls || {},
                    teamSize: data.teamSize,
                    capitalSought: data.capitalSought,
                    valuation: data.valuation,
                    foundingTarget: data.foundingTarget,
                    previousAmountFunding: data.previousAmountFunding,
                    previousRound: data.previousRound || "",
                    previousRoundDate: data.previousRoundDate ? data.previousRoundDate.split("T")[0] : "",
                });

                setExistingMedia({
                    logo: data.media?.logo || null,
                    banner: data.media?.banner || null,
                    pitchDeck: data.media?.pitchDeck || null,
                    gallery: data.media?.gallery || [],
                });

                // contributors + author for lock
                setContributors(
                    Array.isArray(data.contributors)
                        ? data.contributors
                            .filter((c: any) => c && typeof c === "object")
                            .map((c: any) => ({
                                id: c.id,
                                fullName: c.fullName ?? null,
                                email: c.email,
                            }))
                        : []
                );
                setAuthorEmail(data.author?.email ?? null);
            } catch (err) {
                console.error("[EDIT PROJECT] error:", err);
                setErrorMsg("Failed to load project data");
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [hash]);

    // --- helpers to update form ---
    const updateField = (field: keyof ProjectFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const updateUrlField = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            urls: { ...prev.urls, [field]: value },
        }));
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleRemoveFlag = (media: keyof typeof removeFlags) => {
        setRemoveFlags((prev) => ({ ...prev, [media]: !prev[media] }));
    };

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

    // --- save draft ---
    const handleSaveDraft = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!formData.name.trim() || !formData.tagline.trim()) {
            setErrorMsg("Project name and tagline are required to save a draft.");
            return;
        }

        setSaving(true);

        const countryName = countryOptions.find((c) => c.value === countryIso)?.label || "";
        const locationObj =
            countryIso
                ? {
                    country: countryName,   // e.g. "Costa Rica"
                    state: stateName || null, // e.g. "San José" (optional)
                    iso2: countryIso,       // e.g. "CR"
                }
                : null;
        try {
            const payload = {
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
                removeLogo: removeFlags.logo,
                removeBanner: removeFlags.banner,
                removePitchDeck: removeFlags.pitchDeck,
                location: locationObj,
            };

            const formDataUpload = new FormData();
            formDataUpload.append("data", JSON.stringify(payload));

            if (logoFile) formDataUpload.append("logo", logoFile);
            if (bannerFile) formDataUpload.append("banner", bannerFile);
            if (pitchDeckFile) formDataUpload.append("pitchDeck", pitchDeckFile);
            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => {
                    formDataUpload.append("gallery[]", file);
                });
            }

            const token = localStorage.getItem("auth_token") || "";

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${hash}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataUpload,
            });

            const responseJson = await res.json();

            if (res.status !== 200) {
                const msg = (responseJson && responseJson.message) || `Failed to save draft (status ${res.status})`;
                setErrorMsg(msg);
                setSaving(false);
                return;
            }

            setSuccessMsg("Draft saved successfully!");

            // reset transient state
            setLogoFile(null);
            setBannerFile(null);
            setPitchDeckFile(null);
            setGalleryFiles([]);
            setRemoveFlags({ logo: false, banner: false, pitchDeck: false });

            // sync media + contributors if backend returns them
            if (responseJson.media) {
                setExistingMedia({
                    logo: responseJson.media.logo || null,
                    banner: responseJson.media.banner || null,
                    pitchDeck: responseJson.media.pitchDeck || null,
                    gallery: responseJson.media.gallery || [],
                });
            }
            if (Array.isArray(responseJson.contributors)) {
                setContributors(
                    responseJson.contributors.map((c: any) => ({
                        id: c.id,
                        fullName: c.fullName ?? null,
                        email: c.email,
                    }))
                );
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error("[SAVE DRAFT] error:", err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // --- submit for review ---
    const handleSendForReview = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!validateForm()) return;

        setSaving(true);

        const countryName = countryOptions.find((c) => c.value === countryIso)?.label || "";
        const locationObj =
            countryIso
                ? {
                    country: countryName,   // e.g. "Costa Rica"
                    state: stateName || null, // e.g. "San José" (optional)
                    iso2: countryIso,       // e.g. "CR"
                }
                : null;
        try {
            const payload = {
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
                removeLogo: removeFlags.logo,
                removeBanner: removeFlags.banner,
                removePitchDeck: removeFlags.pitchDeck,
                location: locationObj,
            };

            const formDataUpload = new FormData();
            formDataUpload.append("data", JSON.stringify(payload));

            if (logoFile) formDataUpload.append("logo", logoFile);
            if (bannerFile) formDataUpload.append("banner", bannerFile);
            if (pitchDeckFile) formDataUpload.append("pitchDeck", pitchDeckFile);
            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => {
                    formDataUpload.append("gallery[]", file);
                });
            }

            const token = localStorage.getItem("auth_token") || "";

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${hash}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataUpload,
            });

            const responseJson = await res.json();

            if (res.status !== 200) {
                const msg =
                    (responseJson && responseJson.message) || `Failed to submit for review (status ${res.status})`;
                setErrorMsg(msg);
                setSaving(false);
                return;
            }

            router.push(`/dashboard/projects/${hash}`);
        } catch (err) {
            console.error("[SEND FOR REVIEW] error:", err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setDeleting(true);
        try {
            const token = localStorage.getItem("auth_token") || "";
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${encodeURIComponent(hash)}`,
                { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (res.status !== 204) {
                // try to read a message if any
                let msg = `Failed to delete (status ${res.status})`;
                try {
                    const j = await res.json();
                    if (j?.message) msg = j.message;
                } catch {}
                setErrorMsg(msg);
                return;
            }

            // success → navigate out and let the list revalidate
            router.push("/dashboard/projects");
        } catch (e) {
            console.error("[DELETE PROJECT] error:", e);
            setErrorMsg("Network error while deleting. Please try again.");
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
            setConfirmText("");
        }
    };

    // --- contributors: UI actions ---

    const addContributorByEmail = async () => {
        setContribNotice(null);
        const emails = sanitizeEmails([addEmail]);
        if (emails.length === 0) {
            setContribNotice("Enter a valid email.");
            return;
        }

        setAdding(true);
        try {
            const token = localStorage.getItem("auth_token") || "";
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${hash}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ addContributorEmails: emails }),
            });

            const json = await res.json();

            if (res.status !== 200) {
                setContribNotice(json?.message || "Failed to add contributor.");
                return;
            }

            if (Array.isArray(json.contributors)) {
                setContributors(
                    json.contributors.map((c: any) => ({
                        id: c.id,
                        fullName: c.fullName ?? null,
                        email: c.email,
                    }))
                );
            }

            if (json._warnings?.emails_not_found?.length) {
                setContribNotice(`Not found: ${json._warnings.emails_not_found.join(", ")}`);
            } else {
                setContribNotice("Contributor added.");
            }

            setAddEmail("");
        } catch (e) {
            setContribNotice("Network error adding contributor.");
        } finally {
            setAdding(false);
        }
    };

    const removeContributor = async (c: Contributor) => {
        if (authorEmail && c.email === authorEmail) return; // guard: owner cannot be removed
        setContribNotice(null);
        setRemovingId(c.id);

        try {
            const token = localStorage.getItem("auth_token") || "";
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${hash}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                // backend accepts id or email; sending by email keeps it simple
                body: JSON.stringify({ removeContributorEmails: [c.email] }),
            });

            const json = await res.json();

            if (res.status !== 200) {
                setContribNotice(json?.message || "Failed to remove contributor.");
                return;
            }

            if (Array.isArray(json.contributors)) {
                setContributors(
                    json.contributors.map((x: any) => ({
                        id: x.id,
                        fullName: x.fullName ?? null,
                        email: x.email,
                    }))
                );
            }

            setContribNotice("Contributor removed.");
        } catch (e) {
            setContribNotice("Network error removing contributor.");
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <div className="mt-4 text-gray-600">Loading project...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={`Edit Your Project ${formData.name ? `- ${formData.name}` : ""}`}
                subtitle="Edit and update your project details"
                ctaHref="/dashboard/projects/new"
                ctaLabel="New Project"
            />
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                <main className="mx-auto max-w-4xl px-6 py-12">
                    <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <button
                            onClick={() => router.push(`/projects/${encodeURIComponent(hash)}`)}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-5 w-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                            View Public Page
                        </button>

                        <p className="text-xs text-gray-500 sm:ml-auto">
                            Opens the public view of your project in a new tab.
                        </p>
                    </div>
                    {/* Success Message */}
                    {successMsg && (
                        <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                            <div className="flex items-start gap-3">
                                <svg className="h-5 w-5 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <p className="text-sm font-medium text-green-800">{successMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
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

                    {/* Form Card */}
                    <div className="rounded-3xl bg-white p-8 shadow-2xl mb-10">
                        <div className="space-y-4">
                            {/* Section 1: Basic Information */}
                            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                                <BlueLabelButton open={openSections.basic} onClick={() => toggleSection("basic")} title="Basic Information" />
                                {openSections.basic && (
                                    <div className="space-y-6 border-t-2 border-gray-100 p-6">
                                        <p className="text-gray-600">Tell us about your project</p>

                                        {/* Project Name */}
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

                                        {/* Tagline */}
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
                                                <select
                                                    value={countryIso}
                                                    onChange={(e) => {
                                                        setCountryIso(e.target.value);
                                                        setStateName(""); // reset state when country changes
                                                    }}
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                >
                                                    <option value="">Select country</option>
                                                    {countryOptions.map((c) => (
                                                        <option key={c.value} value={c.value}>
                                                            {c.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-gray-700">State / Province (optional)</label>
                                                <select
                                                    value={stateName}
                                                    onChange={(e) => setStateName(e.target.value)}
                                                    disabled={!countryIso}
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition disabled:opacity-50 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                >
                                                    <option value="">{countryIso ? "Select state/province" : "Select a country first"}</option>
                                                    {stateOptions.map((s) => (
                                                        <option key={s.isoCode} value={s.name}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Funding Stage */}
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Funding Stage</label>
                                            <select
                                                value={formData.stage}
                                                onChange={(e) => updateField("stage", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="">Select stage</option>
                                                {fundingStages.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Founded */}
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
                                                Tip: you can type <code>2023</code> and we'll store it as <code>2023-01-01</code>.
                                            </p>
                                        </div>

                                        {/* Categories */}
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Categories *</label>
                                            <p className="mb-3 text-xs text-gray-500">Search and select multiple. You can also create new categories.</p>

                                            <CreatableSelect
                                                isMulti
                                                options={CATEGORY_OPTIONS}
                                                value={formData.category.map((c) => ({ label: c, value: c }))}
                                                onChange={(vals) =>
                                                    updateField(
                                                        "category",
                                                        normalizeCategories(
                                                            (vals as Array<{ label: string; value: string }>).map((v) => v.value),
                                                            true
                                                        )
                                                    )
                                                }
                                                placeholder="Type to search…"
                                                formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                                classNamePrefix="rs"
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderRadius: 12,
                                                        borderColor: state.isFocused ? "#0066CC" : "#E5E7EB",
                                                        boxShadow: state.isFocused ? "0 0 0 4px rgba(0,102,204,0.15)" : "none",
                                                        minHeight: 48,
                                                        zIndex: 50,
                                                        fontSize: "0.875rem",
                                                        fontWeight: 500,
                                                        color: "#1F2937",
                                                    }),
                                                    valueContainer: (base) => ({ ...base, paddingTop: 6, paddingBottom: 6 }),
                                                    input: (base) => ({ ...base, color: "#1F2937", fontWeight: 500 }),
                                                    placeholder: (base) => ({ ...base, color: "#6B7280", fontWeight: 400 }),
                                                    singleValue: (base) => ({ ...base, color: "#1F2937", fontWeight: 600 }),
                                                    multiValue: (base) => ({
                                                        ...base,
                                                        backgroundColor: "#EBF5FF",
                                                        borderRadius: 8,
                                                        border: "1px solid rgba(0,102,204,0.15)",
                                                    }),
                                                    multiValueLabel: (base) => ({
                                                        ...base,
                                                        color: "#003D7A",
                                                        fontWeight: 600,
                                                        fontSize: "0.75rem",
                                                        paddingLeft: 6,
                                                    }),
                                                    multiValueRemove: (base) => ({
                                                        ...base,
                                                        borderRadius: "0 8px 8px 0",
                                                        ":hover": { backgroundColor: "#0066CC", color: "white" },
                                                    }),
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        borderRadius: 12,
                                                        border: "2px solid #E5E7EB",
                                                        boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25), 0 0 0 4px rgba(0,102,204,0.08)",
                                                        overflow: "hidden",
                                                    }),
                                                    menuList: (base) => ({
                                                        ...base,
                                                        maxHeight: 240,
                                                        paddingTop: 4,
                                                        paddingBottom: 4,
                                                        backgroundColor: "white",
                                                    }),
                                                    option: (base, state) => ({
                                                        ...base,
                                                        fontSize: "0.875rem",
                                                        fontWeight: state.isSelected ? 600 : 500,
                                                        color: state.isSelected ? "white" : state.isFocused ? "white" : "#1F2937",
                                                        backgroundColor: state.isSelected ? "#0066CC" : state.isFocused ? "#0066CC" : "transparent",
                                                        paddingTop: 8,
                                                        paddingBottom: 8,
                                                        paddingLeft: 12,
                                                        paddingRight: 12,
                                                        cursor: "pointer",
                                                    }),
                                                }}
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
                                            <label className="mb-2 block text-sm font-bold text-gray-700">Elevator Pitch * (30 seconds summary)</label>
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
                                            <select
                                                value={formData.previousRound}
                                                onChange={(e) => updateField("previousRound", e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="">Select round</option>
                                                {fundingStages.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
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
                                                Add by email. We’ll only list emails—no suggestion dropdowns. Unknown emails will be returned in{" "}
                                                <code>_warnings.emails_not_found</code> (not sent now; you’ll add invite flow later).
                                            </p>

                                            {/* Add form */}
                                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                                <input
                                                    type="email"
                                                    value={addEmail}
                                                    onChange={(e) => setAddEmail(e.target.value)}
                                                    placeholder="contributor@example.com"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addContributorByEmail}
                                                    disabled={adding}
                                                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {adding ? "Adding…" : "Add"}
                                                </button>
                                            </div>

                                            {contribNotice && <p className="text-xs text-gray-700">{contribNotice}</p>}

                                            {/* List */}
                                            <div className="mt-2 rounded-lg border border-gray-200">
                                                {contributors.length === 0 ? (
                                                    <div className="p-3 text-xs text-gray-500">No contributors yet.</div>
                                                ) : (
                                                    <ul className="divide-y divide-gray-200">
                                                        {contributors.map((c) => {
                                                            const isOwner = authorEmail && c.email === authorEmail;
                                                            return (
                                                                <li key={c.id} className="flex items-center justify-between px-3 py-2">
                                                                    <div className="min-w-0">
                                                                        <div className="truncate text-sm font-semibold text-gray-900">
                                                                            {c.fullName || "—"}
                                                                        </div>
                                                                        <div className="truncate text-xs text-gray-600">{c.email}</div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        {isOwner ? (
                                                                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-2 py-1 text-[11px] text-gray-600">
                                          <svg
                                              className="h-3.5 w-3.5"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                          >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2V9a6 6 0 10-12 0v2a2 2 0 00-2 2v6a2 2 0 002 2z"
                                            />
                                          </svg>
                                          Owner
                                        </span>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeContributor(c)}
                                                                                disabled={removingId === c.id}
                                                                                className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                                                                            >
                                                                                {removingId === c.id ? "Removing…" : "Remove"}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        {/* Media section */}
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-black text-gray-900">Media & Uploads</h3>

                                            {/* Logo */}
                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Project Logo</label>
                                                <p className="mb-3 text-xs text-gray-500">Square format works best (512x512 or larger)</p>

                                                {existingMedia.logo && !removeFlags.logo && (
                                                    <div className="mb-4 flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-blue-300 bg-white">
                                                            <img src={fromBE(existingMedia.logo.url)!} alt="Current logo" className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900">Current Logo</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRemoveFlag("logo")}
                                                                className="mt-2 text-xs font-bold text-red-600 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {removeFlags.logo && (
                                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                                        <p className="text-sm font-bold text-red-800">Logo will be removed when you save</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRemoveFlag("logo")}
                                                            className="mt-2 text-xs font-bold text-gray-600 hover:text-gray-700"
                                                        >
                                                            Undo
                                                        </button>
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] || null;
                                                        setLogoFile(f);
                                                        if (f) setRemoveFlags((prev) => ({ ...prev, logo: false }));
                                                    }}
                                                />

                                                {logoFile && (
                                                    <div className="mt-4 flex items-center gap-4">
                                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner">
                                                            <img src={URL.createObjectURL(logoFile)} alt="logo preview" className="h-full w-full object-cover" />
                                                        </div>
                                                        <p className="text-xs text-gray-600">
                                                            New: <span className="font-medium text-gray-900">{logoFile.name}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Banner */}
                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Banner Image</label>
                                                <p className="mb-3 text-xs text-gray-500">Wide format (1200x400 or larger). Displayed at the top of your project page.</p>

                                                {existingMedia.banner && !removeFlags.banner && (
                                                    <div className="mb-4 flex items-center gap-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                                                        <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border-2 border-purple-300 bg-white">
                                                            <img src={fromBE(existingMedia.banner.url)!} alt="Current banner" className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900">Current Banner</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRemoveFlag("banner")}
                                                                className="mt-2 text-xs font-bold text-red-600 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {removeFlags.banner && (
                                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                                        <p className="text-sm font-bold text-red-800">Banner will be removed when you save</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRemoveFlag("banner")}
                                                            className="mt-2 text-xs font-bold text-gray-600 hover:text-gray-700"
                                                        >
                                                            Undo
                                                        </button>
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-purple-700"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] || null;
                                                        setBannerFile(f);
                                                        if (f) setRemoveFlags((prev) => ({ ...prev, banner: false }));
                                                    }}
                                                />

                                                {bannerFile && (
                                                    <div className="mt-4 flex items-center gap-4">
                                                        <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner">
                                                            <img src={URL.createObjectURL(bannerFile)} alt="banner preview" className="h-full w-full object-cover" />
                                                        </div>
                                                        <p className="text-xs text-gray-600">
                                                            New: <span className="font-medium text-gray-900">{bannerFile.name}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pitch Deck PDF */}
                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Pitch Deck (PDF upload)</label>
                                                <p className="text-xs text-gray-500">We'll store this privately and make it available to vetted investors.</p>

                                                {existingMedia.pitchDeck && !removeFlags.pitchDeck && (
                                                    <div className="mb-4 mt-3 rounded-xl border border-gray-300 bg-gray-50 p-4">
                                                        <p className="text-sm font-bold text-gray-900">Current Pitch Deck</p>
                                                        <a
                                                            href={fromBE(existingMedia.pitchDeck.url)!}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-700"
                                                        >
                                                            View current file
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRemoveFlag("pitchDeck")}
                                                            className="mt-2 block text-xs font-bold text-red-600 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}

                                                {removeFlags.pitchDeck && (
                                                    <div className="mb-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                                                        <p className="text-sm font-bold text-red-800">Pitch deck will be removed when you save</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRemoveFlag("pitchDeck")}
                                                            className="mt-2 text-xs font-bold text-gray-600 hover:text-gray-700"
                                                        >
                                                            Undo
                                                        </button>
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    accept="application/pdf, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, .pdf,.ppt,.pptx"
                                                    className="mt-3 w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-black"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] || null;
                                                        setPitchDeckFile(f);
                                                        if (f) setRemoveFlags((prev) => ({ ...prev, pitchDeck: false }));
                                                    }}
                                                />

                                                {pitchDeckFile && (
                                                    <p className="mt-2 text-xs text-gray-600">
                                                        New: <span className="font-medium text-gray-900">{pitchDeckFile.name}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Gallery images */}
                                            <div className="rounded-xl border-2 border-gray-200 p-4">
                                                <label className="mb-1 block text-sm font-bold text-gray-700">Product / App Screenshots</label>
                                                <p className="text-xs text-gray-500">You can add multiple images. We'll show them in your gallery.</p>

                                                {existingMedia.gallery.length > 0 && (
                                                    <div className="my-4">
                                                        <p className="mb-3 text-xs font-medium text-gray-700">Current Gallery ({existingMedia.gallery.length} images)</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {existingMedia.gallery.map((img, i) => (
                                                                <div key={i} className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                                                                    <img src={fromBE(img.url)!} alt={`gallery-${i}`} className="h-full w-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500">Note: New gallery uploads will be added to existing images</p>
                                                    </div>
                                                )}

                                                <input
                                                    multiple
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-3 w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-green-700"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        setGalleryFiles(files as File[]);
                                                    }}
                                                />

                                                {galleryFiles.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-xs font-medium text-gray-700">
                                                            {galleryFiles.length} new file{galleryFiles.length === 1 ? "" : "s"} selected
                                                        </p>
                                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                                            {galleryFiles.map((imgFile, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-white shadow-inner"
                                                                >
                                                                    <img src={URL.createObjectURL(imgFile)} alt={`new-gallery-${i}`} className="h-full w-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Box */}
                                        <div className="rounded-XL border-2 border-blue-200 bg-blue-50 p-4">
                                            <div className="flex gap-3">
                                                <svg className="h-5 w-5 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-bold">Update your project</p>
                                                    <p className="mt-1">
                                                        You can save as a draft to continue later, or send for review when ready. Changes will be reflected after review.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={saving || deleting}
                                    className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    type="button"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save Draft
                                </button>

                                <button
                                    onClick={handleSendForReview}
                                    disabled={saving || deleting}
                                    className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ background: `linear-gradient(135deg, ${brand.accent}, #00A372)` }}
                                    type="button"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                                                <path className="opacity-75" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Update & Send for Review
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Danger Zone: Delete */}
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(true)}
                                disabled={saving || deleting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete this project permanently"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10" />
                                </svg>
                                {deleting ? "Deleting…" : "Delete Project"}
                            </button>
                        </div>
                    </div>
                    {/* Confirm Delete Modal */}
                    {confirmOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                                <h3 className="text-lg font-black text-gray-900">Delete Project</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    This action cannot be undone. Type <span className="font-semibold">
          {formData.name || "the project name"}
        </span> to confirm.
                                </p>

                                <input
                                    autoFocus
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" &&
                                            !deleting &&
                                            formData.name &&
                                            confirmText.trim().toLowerCase() === formData.name.trim().toLowerCase()
                                        ) {
                                            handleDelete();
                                        }
                                    }}
                                    placeholder={formData.name || "Project name"}
                                    className="mt-4 w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100"
                                />

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setConfirmOpen(false); setConfirmText(""); }}
                                        className="rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={
                                            deleting ||
                                            !formData.name ||
                                            confirmText.trim().toLowerCase() !== formData.name.trim().toLowerCase()
                                        }
                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {deleting ? "Deleting…" : "Confirm Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <TeamThreadReplies projectHash={hash} />

                </main>
            </div>
            </>
    );
}
