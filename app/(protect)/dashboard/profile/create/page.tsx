"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TimezoneSelect, { type ITimezone } from "react-timezone-select";
import Select, {type StylesConfig, type MultiValue, type SingleValue, type GroupBase} from "react-select";
import CreatableSelect from "react-select/creatable";
import countriesData from "world-countries";
import { State } from "country-state-city";
import { CATEGORY_OPTIONS, normalizeCategories } from "@/lib/taxonomies/categories";
import { useRouter } from "next/navigation";
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

const TZ_STYLES: StylesConfig<ITimezone, boolean, GroupBase<ITimezone>> = {
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
        backgroundColor: s.isSelected
            ? BRAND_COLORS.primary
            : s.isFocused
                ? BRAND_COLORS.primary
                : "transparent",
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

type UserRole = { id: number; name: string | null; slug: string | null };

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
    founder?: {
        yearsExpertise?: number | null;
        expertise?: string[] | null;
        notable?: string | null;
        personalWebsite?: string | null;
        fundingPreferences?: string[] | null;
        calendly?: string | null;
        hash?: string | null;
    } | null;
    investor?: {
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
    } | null;
    profileHash?: string | null;
    hash?: string | null;
    profile?: { hash?: string | null } | null;
    roles?: UserRole[] | null;
};

type UpsertPayload = {
    fullName: string;
    title: string;
    shortBio: string;
    longBio: string;
    type: ProfileType;
    social?: Record<string, string>;
    location?: { country?: string; state?: string };
    timeZone?: string;
    founder?: {
        yearsExpertise: number | null;
        expertise: string[];
        notable: string;
        personalWebsite: string;
        fundingPreferences: string[];
        calendly: string;
    };
    investor?: {
        foundName: string;
        fundWebsite: string;
        stageFocus: string[];
        sector: string[];
        ticketSizeStart: number | null;
        ticketSizeRangeEnd: number | null;
        geographicFocus: string[];
        avgCheckSize: number | null;
        assetsManagement: number | null;
        previousInvestments: string;
        leadInvestments: number | null;
        accreditation: string;
        personalWebsite: string;
        preferredPartner: string;
        pressLinks: string[];
    };
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

// ========== COMPONENTS ==========
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

function FileUpload({ label, onChange, selectedFile, accept = "image/*", buttonColor = "blue" }: {
    label: string;
    onChange: (file: File | null) => void;
    selectedFile: File | null;
    accept?: string;
    buttonColor?: "blue" | "purple";
}) {
    const bgColor = buttonColor === "blue" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700";

    return (
        <div>
            <span className="mb-1 block text-sm font-bold text-gray-700">{label}</span>
            <input
                type="file"
                accept={accept}
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className={`w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm file:me-4 file:cursor-pointer file:rounded-lg file:border-0 file:${bgColor} file:px-4 file:py-2 file:text-sm file:font-bold file:text-white`}
            />
            {selectedFile && <p className="mt-1 text-xs text-gray-600">Selected: {selectedFile.name}</p>}
        </div>
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

// ========== MAIN COMPONENT ==========
export default function ProfilePage() {
    const [me, setMe] = useState<UserMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "info" | "success" | "error"; message: string } | null>(null);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [selectedTimezone, setSelectedTimezone] = useState<ITimezone | string>("");
    const [countryIso, setCountryIso] = useState<string>("US");
    const [stateName, setStateName] = useState<string>("");
    const [type, setType] = useState<ProfileType>("founder");

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";

    const router = useRouter();

    // ---- role gates (computed every render, used by JSX/handlers) ----
    const roleSlugs = useMemo(
        () => (me?.roles ?? []).map(r => (r?.slug || "").toLowerCase()),
        [me?.roles]
    );
    const isAdmin = roleSlugs.includes("admin");
    const canSeeFounder = isAdmin || roleSlugs.includes("founder");
    const canSeeInvestor = isAdmin || roleSlugs.includes("investor");

    const safeSetType = (t: ProfileType) => {
        if ((t === "founder" && canSeeFounder) || (t === "investor" && canSeeInvestor)) {
            setType(t);
        }
    };

    const getProfileHash = (d: UserMe): string | null =>
        d?.profileHash ||
        d?.hash ||
        d?.profile?.hash ||
        d?.founder?.hash ||
        d?.investor?.hash ||
        null;

    // Load data
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

                setMe({
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
                    roles: d.roles ?? [],
                });

                // --- initial tab enforcement from server roles + existing profile ---
                const roleSlugsFromResp = (d.roles ?? []).map((r: any) => (r?.slug || "").toLowerCase());
                const respIsAdmin = roleSlugsFromResp.includes("admin");
                const respCanFounder = respIsAdmin || roleSlugsFromResp.includes("founder");
                const respCanInvestor = respIsAdmin || roleSlugsFromResp.includes("investor");

                const hasInvestor = !!d?.investor;
                const hasFounder = !!d?.founder;

                let enforced: ProfileType = "founder";
                if (respIsAdmin) {
                    enforced = hasInvestor ? "investor" : hasFounder ? "founder" : "founder";
                } else if (respCanInvestor && !respCanFounder) {
                    enforced = "investor";
                } else if (respCanFounder && !respCanInvestor) {
                    enforced = "founder";
                } else {
                    enforced = hasInvestor ? "investor" : hasFounder ? "founder" : "founder";
                }

                setType(enforced);
                if (d.timeZone) setSelectedTimezone(d.timeZone);
                if (d.location?.country) {
                    const match = (countriesData as Country[]).find((c) => c.name.common === d.location?.country);
                    if (match?.cca2) setCountryIso(match.cca2);
                }
                if (d.location?.state) setStateName(d.location.state);
            } else {
                setToast({ kind: "error", message: res.message });
            }
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [token]);

    const handleTimezoneChange = (tz: ITimezone | string) => {
        setSelectedTimezone(tz);
        const tzValue = typeof tz === "string" ? tz : tz.value;
        setMe((prev) => (prev ? { ...prev, timeZone: tzValue } : prev));
    };

    // Options
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

    // State helpers
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

    // Build unified upsert payload
    const buildUpsertPayload = (): Partial<UpsertPayload> => {
        // Enforce allowed type at save time as well
        const enforcedType: ProfileType =
            isAdmin ? type : (canSeeInvestor && !canSeeFounder) ? "investor" : "founder";

        const base: Partial<UpsertPayload> = {
            fullName: me?.fullName || "",
            title: me?.title || "",
            shortBio: me?.shortBio || "",
            longBio: me?.longBio || "",
            type: enforcedType,
        };

        // Social - only if has values
        const social = me?.social || {};
        if (Object.keys(social).some(k => (social as any)[k] && (social as any)[k].trim() !== "")) {
            base.social = social;
        }

        // Location - build from CURRENT selections
        const location: { country?: string; state?: string } = {};
        if (countryIso) {
            const countryData = (countriesData as Country[]).find((c) => c.cca2 === countryIso);
            if (countryData) {
                location.country = countryData.name.common;
            }
        }
        if (stateName) {
            location.state = stateName;
        }
        if (location.country || location.state) {
            base.location = location;
        }

        // Timezone - get from CURRENT selection
        if (selectedTimezone) {
            const tzValue = typeof selectedTimezone === "string"
                ? selectedTimezone
                : selectedTimezone.value;
            if (tzValue && tzValue.trim() !== "") {
                base.timeZone = tzValue;
            }
        }

        // Founder/Investor data
        if (enforcedType === "founder") {
            base.founder = {
                yearsExpertise: me?.founder?.yearsExpertise ?? null,
                expertise: me?.founder?.expertise ?? [],
                notable: me?.founder?.notable ?? "",
                personalWebsite: me?.founder?.personalWebsite ?? "",
                fundingPreferences: me?.founder?.fundingPreferences ?? [],
                calendly: me?.founder?.calendly ?? "",
            };
        } else {
            base.investor = {
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
            };
        }

        return base;
    };

    // Unified upsert caller -> POST /me/upsert (multipart if files present)
    const saveUpsert = async () => {
        if (!token) {
            setToast({ kind: "error", message: "You need to sign in to save changes." });
            return;
        }

        const hasFiles = !!pictureFile || !!bannerFile;
        const url = `${BE}/me/upsert`;

        if (hasFiles) {
            const form = new FormData();
            const payloadData = buildUpsertPayload();

            form.append("data", JSON.stringify(payloadData));

            if (pictureFile) {
                form.append("picture", pictureFile);
            }
            if (bannerFile) {
                form.append("banner", bannerFile);
            }

            const res = await safeJson<UserMe>(url, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            if (res.ok) {
                const d = res.data;

                setMe({
                    ...me!,
                    ...d,
                    founder: d.founder ?? null,
                    investor: d.investor ?? null,
                });
                setPictureFile(null);
                setBannerFile(null);

                const hash = getProfileHash(d);
                if (hash) {
                    router.push(`/profiles/${encodeURIComponent(hash)}`);
                    return;
                }

                setToast({ kind: "success", message: "Profile saved successfully!" });
            } else {
                setToast({ kind: "error", message: res.message });
            }
        } else {
            const res = await safeJson<UserMe>(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(buildUpsertPayload()),
            });

            if (res.ok) {
                const d = res.data;

                setMe({
                    ...me!,
                    ...d,
                    founder: d.founder ?? null,
                    investor: d.investor ?? null,
                });

                const hash = getProfileHash(d);
                if (hash) {
                    router.push(`/profiles/${encodeURIComponent(hash)}`);
                    return;
                }

                setToast({ kind: "success", message: "Profile saved successfully!" });
            } else {
                setToast({ kind: "error", message: res.message });
            }
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
                        Please <Link className="text-blue-600 underline" href="/login">log in</Link> to view and edit your profile.
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Toast */}
            <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
                {toast && <Toast kind={toast.kind} message={toast.message} />}
            </div>

            {/* Hero */}
            <section
                className="relative overflow-hidden py-20 border-b"
                style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.darkBlue}, ${BRAND_COLORS.primary})` }}
            >
                <div className="absolute inset-0 opacity-10 z-0">
                    <div
                        className="absolute h-full w-full"
                        style={{
                            backgroundImage: "radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)",
                            backgroundSize: "40px 40px",
                        }}
                    />
                </div>
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="text-4xl font-black text-white md:text-5xl">Create Your Profile</h1>
                    <p className="mt-3 text-lg" style={{ color: "#CFE6FF" }}>
                        Tell us about yourself and what you&#39;re looking for
                    </p>
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
                                <InputField
                                    label="Full name"
                                    value={me?.fullName || ""}
                                    onChange={(v) => setMeField("fullName", v)}
                                    placeholder="Jane Founder"
                                />
                                <InputField
                                    label="Title / Role"
                                    value={me?.title || ""}
                                    onChange={(v) => setMeField("title", v)}
                                    placeholder="CEO @ Example"
                                />
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
                                    <TimezoneSelect
                                        value={selectedTimezone}
                                        onChange={handleTimezoneChange}
                                        styles={TZ_STYLES}           // <- not SELECT_STYLES
                                        placeholder="Select your time zone…"
                                    />
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

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FileUpload
                                    label="Avatar"
                                    onChange={setPictureFile}
                                    selectedFile={pictureFile}
                                    buttonColor="blue"
                                />
                                <FileUpload
                                    label="Banner"
                                    onChange={setBannerFile}
                                    selectedFile={bannerFile}
                                    buttonColor="purple"
                                />
                            </div>
                        </SectionCard>

                        {/* Profile Type */}
                        {(isAdmin || (canSeeFounder && canSeeInvestor)) ? (
                            <SectionCard title="Choose Your Profile Type">
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {canSeeFounder && (
                                        <button
                                            type="button"
                                            onClick={() => safeSetType("founder")}
                                            className={cn(
                                                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition",
                                                type === "founder"
                                                    ? "border-blue-600 bg-blue-600 text-white shadow"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700"
                                            )}
                                        >
                                            Founder
                                        </button>
                                    )}
                                    {canSeeInvestor && (
                                        <button
                                            type="button"
                                            onClick={() => safeSetType("investor")}
                                            className={cn(
                                                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition",
                                                type === "investor"
                                                    ? "border-blue-600 bg-blue-600 text-white shadow"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700"
                                            )}
                                        >
                                            Investor
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Select your role to unlock tailored fields.
                                </p>
                            </SectionCard>
                        ) : (
                            // If only one is allowed, show a tiny badge instead of the picker
                            <SectionCard title="Profile Type">
                                <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                                    {canSeeInvestor && !canSeeFounder ? "Investor" : "Founder"}
                                </span>
                            </SectionCard>
                        )}

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
                                        onChange={(vals: MultiValue<SelectOption>) =>
                                            updateFounder({
                                                expertise: normalizeCategories(vals.map((v) => v.value), true),
                                            })
                                        }
                                        styles={SELECT_STYLES}
                                        placeholder="Select or type areas…"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Use the global taxonomy. You can also add a new tag if it&#39;s not listed.
                                    </p>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-bold text-gray-700">Funding preferences</span>
                                    <Select<SelectOption, true>
                                        isMulti
                                        options={FUNDING_OPTIONS}
                                        value={(me?.founder?.fundingPreferences || []).map((v) => ({ label: v, value: v }))}
                                        onChange={(vals: MultiValue<SelectOption>) =>
                                            updateFounder({ fundingPreferences: vals.map((v) => v.value) })
                                        }
                                        styles={SELECT_STYLES}
                                        placeholder="Choose stages…"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Select the stages you&#39;re open to (e.g., Seed, Series A).
                                    </p>
                                </label>

                                <InputField
                                    label="Calendly link"
                                    type="url"
                                    value={me?.founder?.calendly || ""}
                                    onChange={(v) => updateFounder({ calendly: v })}
                                    placeholder="https://calendly.com/username/meeting"
                                />

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

                                <div className="flex justify-end">
                                    <button
                                        onClick={saveUpsert}
                                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-8 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        Complete Profile
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {/* Investor Details */}
                        {type === "investor" && (
                            <SectionCard title="Investor Details">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InputField
                                        label="Fund / Firm name"
                                        value={me?.investor?.foundName || ""}
                                        onChange={(v) => updateInvestor({ foundName: v })}
                                        placeholder="Colibri Ventures"
                                    />
                                    <InputField
                                        label="Fund website"
                                        type="url"
                                        value={me?.investor?.fundWebsite || ""}
                                        onChange={(v) => updateInvestor({ fundWebsite: v })}
                                        placeholder="https://fund.example"
                                    />
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
                                        onChange={(vals: MultiValue<SelectOption>) =>
                                            updateInvestor({ stageFocus: vals.map((v) => v.value) })
                                        }
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
                                        onChange={(vals: MultiValue<SelectOption>) =>
                                            updateInvestor({
                                                sector: normalizeCategories(vals.map((v) => v.value), true),
                                            })
                                        }
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
                                    onChange={(v) =>
                                        updateInvestor({
                                            geographicFocus: v.split(",").map((x) => x.trim()).filter(Boolean),
                                        })
                                    }
                                    placeholder="LatAm, North America, EU"
                                />

                                <InputField
                                    label="Accreditation"
                                    value={me?.investor?.accreditation || ""}
                                    onChange={(v) => updateInvestor({ accreditation: v })}
                                    placeholder="Angel / Institutional / Family Office…"
                                />

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
                                    <InputField
                                        label="Personal website"
                                        type="url"
                                        value={me?.investor?.personalWebsite || ""}
                                        onChange={(v) => updateInvestor({ personalWebsite: v })}
                                        placeholder="https://me.example"
                                    />
                                    <InputField
                                        label="Preferred partner"
                                        value={me?.investor?.preferredPartner || ""}
                                        onChange={(v) => updateInvestor({ preferredPartner: v })}
                                        placeholder="What co-investors do you prefer to team with?"
                                    />
                                </div>

                                <InputField
                                    label="Press links (comma-separated URLs)"
                                    value={(me?.investor?.pressLinks || []).join(", ")}
                                    onChange={(v) =>
                                        updateInvestor({
                                            pressLinks: v.split(",").map((x) => x.trim()).filter(Boolean),
                                        })
                                    }
                                    placeholder="https://press1, https://press2"
                                />

                                <div className="flex justify-end">
                                    <button
                                        onClick={saveUpsert}
                                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-8 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        Complete Profile
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
                                <div className="text-gray-900">
                                    {[me?.location?.state, me?.location?.country].filter(Boolean).join(", ") || "Not set yet"}
                                </div>
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

                            <p className="text-xs text-gray-500">
                                This preview shows how your profile will appear to others. Fill in the fields to see it come to life.
                            </p>
                        </PreviewCard>

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
                            <div className="mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold uppercase tracking-wide">Getting Started</span>
                            </div>
                            Complete your basic information, then choose your profile type (Founder or Investor) to unlock additional fields tailored to your role.
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
