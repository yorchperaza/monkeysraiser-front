"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TimezoneSelect, { type ITimezone } from "react-timezone-select";
import Select, { type StylesConfig, type MultiValue, type SingleValue, type GroupBase } from "react-select";
import CreatableSelect from "react-select/creatable";
import countriesData from "world-countries";
import { State } from "country-state-city";
import { CATEGORY_OPTIONS, normalizeCategories } from "@/lib/taxonomies/categories";
import { useParams, useRouter } from "next/navigation";
import RichTextEditor from "@/components/global/RichTextEditor";

// ========== CONSTANTS ==========
const BRAND_COLORS = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
} as const;

const FUNDING_STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"] as const;
const FUNDING_OPTIONS = FUNDING_STAGES.map((s) => ({ label: s, value: s }));

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

// --- Image helpers ---
const joinUrl = (u?: string | null) => {
    if (!u) return "";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${BE}${u.startsWith("/") ? "" : "/"}${u}`;
};
const bust = (u?: string | null) => (u ? `${u}${u.includes("?") ? "&" : "?"}t=${Date.now()}` : "");

// ========== TYPES ==========
type ProfileType = "founder" | "investor";

type Country = {
    cca2: string;
    name: {
        common: string;
    };
    flag: string;
};

type SelectOption = {
    label: string;
    value: string;
};

type ApiResponse<T = unknown> = {
    ok: true;
    status: number;
    data: T;
} | {
    ok: false;
    status: number;
    message: string;
    data: unknown;
};

type UserMe = {
    id: number;
    email: string;
    fullName?: string | null;
    title?: string | null;
    shortBio?: string | null;
    longBio?: string | null;
    social?: Record<string, string> | null;
    timeZone?: string | null;
    location?: { country?: string; state?: string } | null;
    picture?: { url: string | null } | null;
    banner?: { url: string | null } | null;
    founder?:
        | {
        id?: number | null;
        yearsExpertise?: number | null;
        expertise?: string[] | null;
        notable?: string | null;
        personalWebsite?: string | null;
        fundingPreferences?: string[] | null;
        calendly?: string | null;
        hash?: string | null;
    }
        | null;
    investor?:
        | {
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
        hash?: string | null;
    }
        | null;
};

// ========== UTILITIES ==========
const cn = (...classes: Array<string | boolean | undefined | null>) => classes.filter(Boolean).join(" ");

const currency = (n?: number | null) => {
    if (n == null) return "—";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(n);
    } catch {
        return String(n);
    }
};

async function safeJson<T = unknown>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(url, init);
        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data: unknown = isJson ? await res.json().catch(() => ({})) : null;

        if (!res.ok) {
            const errorData = data as { message?: string };
            const friendly =
                res.status === 401
                    ? "Please sign in to continue."
                    : res.status === 403
                        ? "You don't have permission to view this profile."
                        : res.status === 404
                            ? "We couldn't find your profile."
                            : res.status >= 500
                                ? "We're having trouble right now. Please try again."
                                : errorData?.message || "Something went wrong.";
            return { ok: false as const, status: res.status, message: friendly, data };
        }
        return { ok: true as const, status: res.status, data: data as T };
    } catch {
        return {
            ok: false as const,
            status: 0,
            message: "Network error. Check your connection and try again.",
            data: null,
        };
    }
}

// ========== STYLES ==========
const SELECT_STYLES: StylesConfig<SelectOption, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: 46,
        borderWidth: 2,
        borderRadius: 12,
        borderColor: state.isFocused ? BRAND_COLORS.primary : "#E5E7EB",
        boxShadow: state.isFocused ? "0 0 0 4px rgba(0,102,204,.15)" : "none",
        ":hover": { borderColor: state.isFocused ? BRAND_COLORS.primary : "#D1D5DB" },
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
        backgroundColor: state.isSelected
            ? BRAND_COLORS.primary
            : state.isFocused
                ? BRAND_COLORS.primary
                : "transparent",
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
    menuList: (base) => ({
        ...base,
        maxHeight: 240,
        paddingTop: 4,
        paddingBottom: 4,
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: BRAND_COLORS.lightBlue,
        borderRadius: 8,
        border: "1px solid rgba(0,102,204,0.15)",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: BRAND_COLORS.darkBlue,
        fontWeight: 600,
        fontSize: "0.75rem",
        paddingLeft: 6,
    }),
    multiValueRemove: (base) => ({
        ...base,
        borderRadius: "0 8px 8px 0",
        ":hover": {
            backgroundColor: BRAND_COLORS.primary,
            color: "white",
        },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const TZ_SELECT_STYLES: StylesConfig<ITimezone, boolean, GroupBase<ITimezone>> = {
    control: (base, state) => ({
        ...base,
        minHeight: 46,
        borderWidth: 2,
        borderRadius: 12,
        borderColor: state.isFocused ? BRAND_COLORS.primary : "#E5E7EB",
        boxShadow: state.isFocused ? "0 0 0 4px rgba(0,102,204,.15)" : "none",
        ":hover": { borderColor: state.isFocused ? BRAND_COLORS.primary : "#D1D5DB" },
        fontSize: "0.875rem",
        fontWeight: 500,
    }),
    singleValue: (b) => ({ ...b, color: "#111827", fontWeight: 600 }),
    input: (b) => ({ ...b, color: "#111827", fontWeight: 500 }),
    placeholder: (b) => ({ ...b, color: "#6B7280" }),
    option: (b, s) => ({
        ...b,
        fontSize: "0.875rem",
        fontWeight: s.isSelected ? 600 : 500,
        color: s.isSelected ? "white" : s.isFocused ? "white" : "#1F2937",
        backgroundColor: s.isSelected ? BRAND_COLORS.primary : s.isFocused ? BRAND_COLORS.primary : "transparent",
        paddingTop: 8,
        paddingBottom: 8,
        cursor: "pointer",
    }),
    menu: (b) => ({
        ...b,
        borderRadius: 12,
        border: "2px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25), 0 0 0 4px rgba(0,102,204,0.08)",
    }),
    menuList: (b) => ({ ...b, maxHeight: 240, paddingTop: 4, paddingBottom: 4 }),
    menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

// ========== SMALL UI COMPONENTS ==========
function Toast({ kind = "info", message }: { kind?: "info" | "success" | "error"; message: string }) {
    const color = kind === "success" ? "bg-emerald-600" : kind === "error" ? "bg-red-600" : "bg-blue-600";
    return (
        <div className={cn("pointer-events-auto inline-flex max-w-xl items-center gap-2 rounded-xl px-3 py-2 text-white shadow-lg", color)}>
            <span className="text-xs font-bold uppercase tracking-wide">{kind}</span>
            <span className="text-sm">{message}</span>
        </div>
    );
}

function InputField({
                        label,
                        value,
                        onChange,
                        placeholder,
                        type = "text",
                        ...props
                    }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    [key: string]: unknown;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-bold text-gray-700">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder={placeholder}
                {...props}
            />
        </label>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h2 className="text-lg font-black text-gray-900">{title}</h2>
            </div>
            <div className="p-6 space-y-6">{children}</div>
        </div>
    );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">{children}</div>
        </div>
    );
}

// --- ImagePicker (one column: image on top, controls below)
function ImagePicker({
                         label,
                         currentUrl,
                         file,
                         onFile,
                         onRemoveToggle,
                         removed,
                         aspect = "square",
                     }: {
    label: string;
    currentUrl?: string | null;
    file: File | null;
    onFile: (f: File | null) => void;
    onRemoveToggle: (val: boolean) => void;
    removed: boolean;
    aspect?: "square" | "wide";
}) {
    // Derive the preview URL from `file` (no setState in an effect)
    const preview = React.useMemo<string | null>(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    // Revoke the object URL when it changes/unmounts
    React.useEffect(() => {
        if (!preview) return;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    const info =
        removed
            ? "Marked for removal"
            : preview
                ? "New file selected (not saved yet)"
                : currentUrl
                    ? "Current"
                    : "No image";

    const previewWrapper =
        aspect === "wide"
            ? "w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
            : "h-32 w-32 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 mx-auto";

    const imgClass =
        aspect === "wide" ? "h-40 w-full object-cover md:h-48" : "h-32 w-32 object-cover";

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">{label}</span>
                <span className="text-xs font-semibold text-gray-500 break-words">{info}</span>
            </div>

            {/* Preview */}
            <div className={previewWrapper}>
                {removed ? (
                    <div className="grid h-full w-full place-items-center p-4 text-xs text-gray-500">
                        Removed (will apply on save)
                    </div>
                ) : preview ? (
                    <img src={preview} alt="Preview" className={imgClass} />
                ) : currentUrl ? (
                    <img src={currentUrl} alt="Current" className={imgClass} />
                ) : (
                    <div className="grid h-full w-full place-items-center p-4 text-xs text-gray-400">
                        No image
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="space-y-2 min-w-0">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFile(e.target.files?.[0] || null)}
                    disabled={removed}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm file:me-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onFile(null)}
                        disabled={removed && !file}
                        className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Revert selection
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemoveToggle(!removed)}
                        className={cn(
                            "rounded-lg px-3 py-1.5 text-sm font-bold",
                            removed
                                ? "border-2 border-emerald-600 text-emerald-700 bg-emerald-50"
                                : "border-2 border-red-600 text-red-700 bg-red-50"
                        )}
                    >
                        {removed ? "Undo remove" : "Remove image"}
                    </button>
                </div>

                <p className="text-xs text-gray-500 break-words">
                    JPG/PNG recommended. Removing hides the image after you save.
                </p>
            </div>
        </div>
    );
}

// ========== MAIN COMPONENT ==========
export default function ProfileEditPage() {
    const [me, setMe] = useState<UserMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "info" | "success" | "error"; message: string } | null>(null);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [removePicture, setRemovePicture] = useState(false);
    const [removeBanner, setRemoveBanner] = useState(false);
    const [selectedTimezone, setSelectedTimezone] = useState<string>("");
    const [countryIso, setCountryIso] = useState<string>("");
    const [stateName, setStateName] = useState<string>("");
    const [type, setType] = useState<ProfileType>("founder");

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
    const router = useRouter();
    // Read route hash
    const params = useParams<{ hash?: string }>();
    const routeHash = (params?.hash ?? "").toString().trim().toLowerCase();

    const myFounderHash = (me?.founder?.hash ?? "").trim().toLowerCase();
    const myInvestorHash = (me?.investor?.hash ?? "").trim().toLowerCase();
    const myAnyHash = myFounderHash || myInvestorHash;

    const isOwnProfile = !routeHash || routeHash === myFounderHash || routeHash === myInvestorHash;
    const getPublicHash = (d: UserMe | null): string | null => d?.founder?.hash || d?.investor?.hash || null;

    // Load /me
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await safeJson<UserMe>(`${BE}/me`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            if (!mounted) return;
            if (res.ok) {
                const d = res.data;

                const next: UserMe = {
                    id: d.id,
                    email: d.email,
                    fullName: d.fullName || "",
                    title: d.title || "",
                    shortBio: d.shortBio || "",
                    longBio: d.longBio || "",
                    social: d.social || {},
                    timeZone: d.timeZone || "",
                    location: d.location || {},
                    picture: d.picture ?? null,
                    banner: d.banner ?? null,
                    founder: d.founder ?? null,
                    investor: d.investor ?? null,
                };

                // 1 synchronous update
                setMe(next);

                // Defer the rest (avoids “synchronous setState in effect”)
                const defer = (fn: () => void) =>
                    typeof queueMicrotask === "function" ? queueMicrotask(fn) : Promise.resolve().then(fn);

                defer(() => {
                    const nextType: ProfileType = d?.investor ? "investor" : d?.founder ? "founder" : "founder";
                    setType(nextType);

                    setSelectedTimezone(d.timeZone ?? ""); // always string
                    const match = (countriesData as Country[]).find(c => c.name.common === d.location?.country);
                    setCountryIso(match?.cca2 ?? "");      // always string
                    setStateName(d.location?.state ?? ""); // always string
                });
            } else {
                setToast({ kind: "error", message: res.message });
            }

            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [token]);

    // Sync timezone -> me
    const handleTimezoneChange = (tz: ITimezone | string) => {
        const value = typeof tz === "string" ? tz : tz.value;
        setSelectedTimezone(value);
        setMe(prev => (prev ? { ...prev, timeZone: value } : prev));
    };

    const countryOptions = useMemo(
        () =>
            (countriesData as Country[])
                .map((c) => ({ value: c.cca2, label: `${c.flag} ${c.name.common}` }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        []
    );

    const stateOptions = useMemo(() => {
        if (!countryIso) return [] as SelectOption[];
        const states = State.getStatesOfCountry(countryIso) || [];
        return states.map((s) => ({ value: s.name, label: s.name })).sort((a, b) => a.label.localeCompare(b.label));
    }, [countryIso]);

    const setMeField = <K extends keyof UserMe>(key: K, value: UserMe[K]) => {
        setMe((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const updateFounder = (partial: Partial<NonNullable<UserMe["founder"]>>) => {
        setMe((prev) =>
            prev
                ? {
                    ...prev,
                    founder: { ...(prev.founder || {}), ...partial },
                    investor: type === "founder" ? null : prev.investor,
                }
                : prev
        );
    };

    const updateInvestor = (partial: Partial<NonNullable<UserMe["investor"]>>) => {
        setMe((prev) =>
            prev
                ? {
                    ...prev,
                    investor: { ...(prev.investor || {}), ...partial },
                    founder: type === "investor" ? null : prev.founder,
                }
                : prev
        );
    };

    // ---------- SAVE: PATCH /me ----------
    const patchMe = async () => {
        if (!token) {
            setToast({ kind: "error", message: "You need to sign in to save changes." });
            return;
        }

        const url = `${BE}/me`;
        const hasFiles = !!pictureFile || !!bannerFile;

        // Build base payload
        const location: { country?: string; state?: string } = {};
        if (countryIso) {
            const countryData = (countriesData as Country[]).find((c) => c.cca2 === countryIso);
            if (countryData) location.country = countryData.name.common;
        }
        if (stateName) location.state = stateName;

        const dataPayload: Record<string, unknown> = {
            fullName: me?.fullName ?? null,
            title: me?.title ?? null,
            shortBio: me?.shortBio ?? null,
            longBio: me?.longBio ?? null,
            social: me?.social && Object.values(me?.social).some((v) => (v || "").trim() !== "") ? me?.social : null,
            timeZone: me?.timeZone ?? null,
            location: Object.keys(location).length ? location : null,
            removePicture: removePicture || undefined,
            removeBanner: removeBanner || undefined,
        };

        if (hasFiles) {
            const form = new FormData();
            form.append("data", JSON.stringify(dataPayload));
            if (pictureFile && !removePicture) form.append("picture", pictureFile);
            if (bannerFile && !removeBanner) form.append("banner", bannerFile);

            const res = await safeJson<UserMe>(url, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            if (res.ok) {
                const d = res.data;
                setMe((prev) => (prev ? { ...prev, ...d } : d));
                setPictureFile(null);
                setBannerFile(null);
                setRemovePicture(false);
                setRemoveBanner(false);
                setToast({ kind: "success", message: "Basic info updated." });
            } else {
                setToast({ kind: "error", message: res.message });
            }
        } else {
            const res = await safeJson<UserMe>(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataPayload),
            });

            if (res.ok) {
                const d = res.data;
                setMe((prev) => (prev ? { ...prev, ...d } : d));
                setRemovePicture(false);
                setRemoveBanner(false);
                setToast({ kind: "success", message: "Basic info updated." });
            } else {
                setToast({ kind: "error", message: res.message });
            }
        }
    };

    // ---------- SAVE: PATCH /me/founder ----------
    const saveFounder = async () => {
        if (!token) {
            setToast({ kind: "error", message: "Sign in required." });
            return;
        }
        const res = await safeJson<UserMe>(`${BE}/me/founder`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                founder: {
                    yearsExpertise: me?.founder?.yearsExpertise ?? null,
                    expertise: me?.founder?.expertise ?? [],
                    notable: me?.founder?.notable ?? "",
                    personalWebsite: me?.founder?.personalWebsite ?? "",
                    fundingPreferences: me?.founder?.fundingPreferences ?? [],
                    calendly: me?.founder?.calendly ?? "",
                },
            }),
        });

        if (res.ok) {
            const d = res.data;
            setMe((prev) => (prev ? { ...prev, ...d } : d));
            setType("founder");
            setToast({ kind: "success", message: "Founder profile updated." });
        } else {
            setToast({ kind: "error", message: res.message });
        }
    };

    // ---------- SAVE: PATCH /me/investor ----------
    const saveInvestor = async () => {
        if (!token) {
            setToast({ kind: "error", message: "Sign in required." });
            return;
        }
        const res = await safeJson<UserMe>(`${BE}/me/investor`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                investor: {
                    foundName: me?.investor?.foundName ?? "",
                    fundWebsite: me?.investor?.fundWebsite ?? "",
                    stageFocus: me?.investor?.stageFocus ?? [],
                    sector: me?.investor?.sector ?? [],
                    ticketSizeStart: me?.investor?.ticketSizeStart ?? null,
                    ticketSizeRangeEnd: me?.investor?.ticketSizeRangeEnd ?? null,
                    geographicFocus: me?.investor?.geographicFocus ?? [],
                    avgCheckSize: me?.investor?.avgCheckSize ?? null,
                    assetsManagement: me?.investor?.assetsManagement ?? null,
                    previousInvestments: me?.investor?.previousInvestments ?? "",
                    leadInvestments: me?.investor?.leadInvestments ?? null,
                    accreditation: me?.investor?.accreditation ?? "",
                    personalWebsite: me?.investor?.personalWebsite ?? "",
                    preferredPartner: me?.investor?.preferredPartner ?? "",
                    pressLinks: me?.investor?.pressLinks ?? [],
                },
            }),
        });

        if (res.ok) {
            const d = res.data;
            setMe((prev) => (prev ? { ...prev, ...d } : d));
            setType("investor");
            setToast({ kind: "success", message: "Investor profile updated." });
        } else {
            setToast({ kind: "error", message: res.message });
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <section className="mx-auto max-w-5xl px-6 py-16">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-64 rounded-xl bg-gray-100" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="h-64 rounded-2xl bg-gray-100" />
                            <div className="h-64 rounded-2xl bg-gray-100" />
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Signed out state
    if (!token) {
        return (
            <div className="min-h-screen bg-white">
                <section className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h1 className="text-3xl font-black text-gray-900">Sign in required</h1>
                    <p className="mt-3 text-gray-600">
                        Please{" "}
                        <Link className="text-blue-600 underline" href="/login">
                            log in
                        </Link>{" "}
                        to view and edit your profile.
                    </p>
                </section>
            </div>
        );
    }

    const publicHash = getPublicHash(me);

    // If the user is viewing a profile that isn’t theirs
    if (!isOwnProfile && routeHash) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
                <p className="mt-2 text-gray-600">
                    You can only edit your own profile.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Go to dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Toast */}
            <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">{toast && <Toast kind={toast.kind} message={toast.message} />}</div>

            {/* Hero */}
            <section
                className="relative overflow-hidden border-b py-20"
                style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.darkBlue}, ${BRAND_COLORS.primary})` }}
            >
                <div className="absolute inset-0 z-0 opacity-10">
                    <div
                        className="absolute h-full w-full"
                        style={{
                            backgroundImage: "radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)",
                            backgroundSize: "40px 40px",
                        }}
                    />
                </div>
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="text-4xl font-black text-white md:text-5xl">Edit Your Profile</h1>
                    <p className="mt-3 text-lg" style={{ color: "#CFE6FF" }}>
                        Update your basic information and founder/investor details
                    </p>
                    {publicHash && (
                        <p className="mt-4">
                            <Link href={`/profiles/${encodeURIComponent(publicHash)}`} className="font-semibold text-white underline">
                                View public profile
                            </Link>
                        </p>
                    )}
                </div>
            </section>

            {/* Body */}
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Basic Information */}
                        <SectionCard title="Basic Information">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InputField label="Full name" value={me?.fullName || ""} onChange={(v) => setMeField("fullName", v)} placeholder="Jane Founder" />
                                <InputField label="Title / Role" value={me?.title || ""} onChange={(v) => setMeField("title", v)} placeholder="CEO @ Example" />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Short bio
                                </label>
                                <RichTextEditor
                                    value={me?.shortBio || ""}
                                    onChange={(v) => setMeField("shortBio", v)}
                                    placeholder="One-liner about your background and focus."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    About
                                </label>
                                <RichTextEditor
                                    value={me?.longBio || ""}
                                    onChange={(v) => setMeField("longBio", v)}
                                    placeholder="Share your story, highlights, interests, and the kind of connections you seek."
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Country</span>
                                    <Select<SelectOption>
                                        instanceId="country"
                                        styles={SELECT_STYLES}
                                        options={countryOptions}
                                        value={countryOptions.find((o) => o.value === countryIso) || null}
                                        onChange={(opt: SingleValue<SelectOption>) => {
                                            const iso = opt?.value || "";
                                            setCountryIso(iso);
                                            const readable = (countriesData as Country[]).find((c) => c.cca2 === iso)?.name.common || "";
                                            setStateName("");
                                            setMeField("location", { country: readable, state: "" });
                                        }}
                                        placeholder="Select a country…"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">State / Province</span>
                                    <Select<SelectOption>
                                        instanceId="state"
                                        styles={SELECT_STYLES}
                                        isDisabled={!countryIso}
                                        options={stateOptions}
                                        value={stateOptions.find((o) => o.value === stateName) || null}
                                        onChange={(opt: SingleValue<SelectOption>) => {
                                            const name = opt?.value || "";
                                            setStateName(name);
                                            setMeField("location", { ...(me?.location || {}), state: name });
                                        }}
                                        placeholder={countryIso ? "Select a state/province…" : "Select a country first…"}
                                    />
                                </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Time zone</span>
                                    <TimezoneSelect value={selectedTimezone} onChange={handleTimezoneChange} styles={TZ_SELECT_STYLES} />
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="LinkedIn"
                                        type="url"
                                        value={me?.social?.linkedin || ""}
                                        onChange={(v) => setMeField("social", { ...(me?.social || {}), linkedin: v })}
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                    <InputField
                                        label="Website"
                                        type="url"
                                        value={me?.social?.website || ""}
                                        onChange={(v) => setMeField("social", { ...(me?.social || {}), website: v })}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            {/* Image pickers with current image + preview + remove */}
                            <div className="grid grid-cols-1 gap-6">
                                <ImagePicker
                                    label="Avatar"
                                    aspect="square"
                                    currentUrl={bust(joinUrl(me?.picture?.url || ""))}
                                    file={pictureFile}
                                    onFile={(f) => {
                                        setPictureFile(f);
                                        if (f) setRemovePicture(false);
                                    }}
                                    removed={removePicture}
                                    onRemoveToggle={(val) => {
                                        setRemovePicture(val);
                                        if (val) setPictureFile(null);
                                    }}
                                />
                                <ImagePicker
                                    label="Banner"
                                    aspect="wide"
                                    currentUrl={bust(joinUrl(me?.banner?.url || ""))}
                                    file={bannerFile}
                                    onFile={(f) => {
                                        setBannerFile(f);
                                        if (f) setRemoveBanner(false);
                                    }}
                                    removed={removeBanner}
                                    onRemoveToggle={(val) => {
                                        setRemoveBanner(val);
                                        if (val) setBannerFile(null);
                                    }}
                                />
                            </div>


                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-gray-500">Tip: you can upload new images and also mark remove to clear existing ones.</p>
                                <button
                                    onClick={patchMe}
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    Save Basic Info
                                </button>
                            </div>
                        </SectionCard>

                        {/* Profile Type */}
                        <SectionCard title="Choose Your Profile Type">
                            <div className="mb-4 flex flex-wrap gap-2">
                                {(["founder", "investor"] as ProfileType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "rounded-xl border-2 px-4 py-2 text-sm font-bold transition",
                                            type === t ? "border-blue-600 bg-blue-600 text-white shadow" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700"
                                        )}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">Select your role to unlock tailored fields. Saving either section updates your role server-side.</p>
                        </SectionCard>

                        {/* Founder Details */}
                        {type === "founder" && (
                            <SectionCard title="Founder Details">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Years of expertise"
                                        type="number"
                                        value={me?.founder?.yearsExpertise ?? ""}
                                        onChange={(v) => updateFounder({ yearsExpertise: v ? parseInt(v) : null })}
                                        placeholder="8"
                                        min={0}
                                    />
                                    <InputField
                                        label="Personal website"
                                        type="url"
                                        value={me?.founder?.personalWebsite || ""}
                                        onChange={(v) => updateFounder({ personalWebsite: v })}
                                        placeholder="https://me.example"
                                    />
                                </div>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Expertise</span>
                                    <CreatableSelect<SelectOption, true>
                                        isMulti
                                        options={CATEGORY_OPTIONS}
                                        value={(me?.founder?.expertise || []).map((c) => ({ label: c, value: c }))}
                                        onChange={(vals: MultiValue<SelectOption>) => updateFounder({ expertise: normalizeCategories(vals.map((v) => v.value), true) })}
                                        styles={SELECT_STYLES}
                                        placeholder="Select or type areas…"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Use the global taxonomy. You can also add a new tag if it&#39;s not listed.</p>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Funding preferences</span>
                                    <Select<SelectOption, true>
                                        isMulti
                                        options={FUNDING_OPTIONS}
                                        value={(me?.founder?.fundingPreferences || []).map((v) => ({ label: v, value: v }))}
                                        onChange={(vals: MultiValue<SelectOption>) => updateFounder({ fundingPreferences: vals.map((v) => v.value) })}
                                        styles={SELECT_STYLES}
                                        placeholder="Choose stages…"
                                    />
                                </label>

                                <InputField label="Calendly link" type="url" value={me?.founder?.calendly || ""} onChange={(v) => updateFounder({ calendly: v })} placeholder="https://calendly.com/username/meeting" />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Notable achievements
                                    </label>
                                    <RichTextEditor
                                        value={me?.founder?.notable || ""}
                                        onChange={(v) => updateFounder({ notable: v })}
                                        placeholder="Awards, exits, patents, key milestones…"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">Saving here will set your role to Founder and remove any Investor profile.</div>
                                    <button
                                        onClick={saveFounder}
                                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-8 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        Save Founder
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {/* Investor Details */}
                        {type === "investor" && (
                            <SectionCard title="Investor Details">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField label="Fund / Firm name" value={me?.investor?.foundName || ""} onChange={(v) => updateInvestor({ foundName: v })} placeholder="Colibri Ventures" />
                                    <InputField label="Fund website" type="url" value={me?.investor?.fundWebsite || ""} onChange={(v) => updateInvestor({ fundWebsite: v })} placeholder="https://fund.example" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Ticket size (start)"
                                        type="number"
                                        value={me?.investor?.ticketSizeStart ?? ""}
                                        onChange={(v) => updateInvestor({ ticketSizeStart: v ? parseInt(v) : null })}
                                        placeholder="50000"
                                        min={0}
                                    />
                                    <InputField
                                        label="Ticket size (end)"
                                        type="number"
                                        value={me?.investor?.ticketSizeRangeEnd ?? ""}
                                        onChange={(v) => updateInvestor({ ticketSizeRangeEnd: v ? parseInt(v) : null })}
                                        placeholder="500000"
                                        min={0}
                                    />
                                </div>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Stage focus</span>
                                    <Select<SelectOption, true>
                                        isMulti
                                        options={FUNDING_OPTIONS}
                                        value={(me?.investor?.stageFocus || []).map((v) => ({ label: v, value: v }))}
                                        onChange={(vals: MultiValue<SelectOption>) => updateInvestor({ stageFocus: vals.map((v) => v.value) })}
                                        styles={SELECT_STYLES}
                                        placeholder="Choose stages…"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Sector focus</span>
                                    <CreatableSelect<SelectOption, true>
                                        isMulti
                                        options={CATEGORY_OPTIONS}
                                        value={(me?.investor?.sector || []).map((c) => ({ label: c, value: c }))}
                                        onChange={(vals: MultiValue<SelectOption>) => updateInvestor({ sector: normalizeCategories(vals.map((v) => v.value), true) })}
                                        styles={SELECT_STYLES}
                                    />
                                </label>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Avg check size"
                                        type="number"
                                        value={me?.investor?.avgCheckSize ?? ""}
                                        onChange={(v) => updateInvestor({ avgCheckSize: v ? parseInt(v) : null })}
                                        placeholder="150000"
                                        min={0}
                                    />
                                    <InputField
                                        label="AUM (assets under mgmt)"
                                        type="number"
                                        value={me?.investor?.assetsManagement ?? ""}
                                        onChange={(v) => updateInvestor({ assetsManagement: v ? parseInt(v) : null })}
                                        placeholder="5000000"
                                        min={0}
                                    />
                                </div>

                                <InputField
                                    label="Geographic focus (comma-separated)"
                                    value={(me?.investor?.geographicFocus || []).join(", ")}
                                    onChange={(v) => updateInvestor({ geographicFocus: v.split(",").map((x) => x.trim()).filter(Boolean) })}
                                    placeholder="LatAm, North America, EU"
                                />

                                <InputField label="Accreditation" value={me?.investor?.accreditation || ""} onChange={(v) => updateInvestor({ accreditation: v })} placeholder="Angel / Institutional / Family Office…" />

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Previous investments
                                    </label>
                                    <RichTextEditor
                                        value={me?.investor?.previousInvestments || ""}
                                        onChange={(v) => updateInvestor({ previousInvestments: v })}
                                        placeholder="Name notable portfolio companies, rounds, co-investors…"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField label="Personal website" type="url" value={me?.investor?.personalWebsite || ""} onChange={(v) => updateInvestor({ personalWebsite: v })} placeholder="https://me.example" />
                                    <InputField label="Preferred partner" value={me?.investor?.preferredPartner || ""} onChange={(v) => updateInvestor({ preferredPartner: v })} placeholder="What co-investors do you prefer to team with?" />
                                </div>

                                <InputField
                                    label="Press links (comma-separated URLs)"
                                    value={(me?.investor?.pressLinks || []).join(", ")}
                                    onChange={(v) => updateInvestor({ pressLinks: v.split(",").map((x) => x.trim()).filter(Boolean) })}
                                    placeholder="https://press1, https://press2"
                                />

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">Saving here will set your role to Investor and remove any Founder profile.</div>
                                    <button
                                        onClick={saveInvestor}
                                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-8 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        Save Investor
                                    </button>
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    {/* Right Column - Preview */}
                    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                        <PreviewCard title="Profile Preview">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Name</div>
                                <div className="text-gray-900">{me?.fullName || me?.email}</div>
                            </div>
                            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-purple-700">Role</div>
                                <div className="text-gray-900">{me?.title || "Not set yet"}</div>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Location</div>
                                <div className="text-gray-900">{[me?.location?.state, me?.location?.country].filter(Boolean).join(", ") || "Not set yet"}</div>
                            </div>

                            {type === "founder" && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Founder Info</div>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-900">
                                        <li>Expertise: {(me?.founder?.expertise || []).join(", ") || "Not set yet"}</li>
                                        <li>Years: {me?.founder?.yearsExpertise ?? "Not set yet"}</li>
                                        <li>Preferences: {(me?.founder?.fundingPreferences || []).join(", ") || "Not set yet"}</li>
                                    </ul>
                                </div>
                            )}

                            {type === "investor" && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Investor Info</div>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-900">
                                        <li>Fund: {me?.investor?.foundName || "Not set yet"}</li>
                                        <li>Stage: {(me?.investor?.stageFocus || []).join(", ") || "Not set yet"}</li>
                                        <li>Sector: {(me?.investor?.sector || []).join(", ") || "Not set yet"}</li>
                                        <li>
                                            Ticket: {currency(me?.investor?.ticketSizeStart)}–{currency(me?.investor?.ticketSizeRangeEnd)}
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <p className="text-xs text-gray-500">This preview shows how your profile will appear to others. Fill in the fields to see it come to life.</p>
                        </PreviewCard>

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
                            <div className="mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold uppercase tracking-wide">Tips</span>
                            </div>
                            Save <span className="font-semibold">Basic Information</span> first, then update your <span className="font-semibold">Founder</span> or{" "}
                            <span className="font-semibold">Investor</span> section. Your role switches automatically when you save one of those sections.
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}