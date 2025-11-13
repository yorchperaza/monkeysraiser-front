"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

type Props = {
    /** Where to go after a successful signup (default: /login?registered=1) */
    redirectTo?: string;
    /** Header title (e.g., "Create Account") */
    title?: string;
    /** Small helper copy under the title; if omitted we show a role-based subtitle */
    subtitle?: string;
    /** Pre-fill email if you pass it (e.g., from querystring) */
    presetEmail?: string;
    /** Compact mode slightly reduces paddings */
    compact?: boolean;
};

type Role = "founder" | "investor";

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

/* ---------- Small role picker card ---------- */
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

export default function FounderRegister({
                                            redirectTo = "/login?registered=1",
                                            title = "Create Account",
                                            subtitle = "", // let it be dynamic if not provided
                                            presetEmail = "",
                                            compact = false,
                                        }: Props) {
    const router = useRouter();
    const qs = useSearchParams();

    // NEW: role selector (Founder pre-selected)
    const [role, setRole] = useState<Role>("founder");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState(presetEmail || (qs.get("email") ?? ""));
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Simple strength meter (0..4)
    const passScore = useMemo(() => {
        let s = 0;
        if (password.length >= 10) s++;
        if (/[a-z]/.test(password)) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return Math.min(s, 4);
    }, [password]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        const name = fullName.trim();
        const mail = email.trim();

        if (!name) return setErrorMsg("Please enter your full name.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setErrorMsg("Please enter a valid email address.");
        if (password.length < 8) return setErrorMsg("Password must be at least 8 characters.");

        setLoading(true);
        try {
            const res = await fetch(`${BE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: name,
                    email: mail,
                    password,
                    role,            // 👈 send chosen role ("founder" | "investor")
                    source: "pricing",
                }),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                /* ignore */
            }

            if (res.status === 201) {
                router.push(redirectTo);
                return;
            }

            const msg =
                (typeof data?.message === "string" && data.message) ||
                (typeof data?.error === "string" && data.error) ||
                (Array.isArray(data?.errors) && data.errors.join(", ")) ||
                "Registration failed. Please try again.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const computedSubtitle =
        subtitle ||
        (role === "founder" ? "Join and connect with investors" : "Discover and connect with founders");

    return (
        <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div
                    className="relative overflow-hidden text-center"
                    style={{
                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                        padding: compact ? "18px" : "24px",
                    }}
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
                        <h2 className="text-2xl font-black text-white">{title}</h2>
                        {computedSubtitle && <p className="mt-1 text-sm text-blue-100">{computedSubtitle}</p>}
                    </div>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="mx-6 mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                            <svg className="h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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

                        {/* Strength meter */}
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
