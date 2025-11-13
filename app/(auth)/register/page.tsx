"use client";

import React, { useEffect, useState } from "react";
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

export default function RegisterPage() {
    const router = useRouter();
    const qs = useSearchParams();

    // role state (founder by default, overridden by ?type=investor)
    const [role, setRole] = useState<"founder" | "investor">("founder");
    useEffect(() => {
        const t = (qs.get("type") || "").toLowerCase();
        if (t === "investor" || t === "founder") setRole(t as "founder" | "investor");
    }, [qs]);

    // form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    // ui state
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

        if (!fullName.trim()) return setErrorMsg("Please enter your full name.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return setErrorMsg("Please enter a valid email address.");
        if (password.length < 8) return setErrorMsg("Password must be at least 8 characters.");

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName, email, password, role }),
                }
            );

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

    const RoleCard = ({
                          value,
                          title,
                          description,
                          icon,
                      }: {
        value: "founder" | "investor";
        title: string;
        description: string;
        icon: React.ReactNode;
    }) => {
        const selected = role === value;
        return (
            <button
                type="button"
                onClick={() => setRole(value)}
                className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
                    selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                aria-pressed={selected}
            >
                <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
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
                    <div className="mt-1 text-sm text-gray-600">{description}</div>
                </div>
            </button>
        );
    };

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            {/* LEFT SIDE: Value Prop */}
            <aside className="flex flex-col justify-center">
                <div className="max-w-xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-lg">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="text-sm font-bold text-gray-700">
              Investors actively reviewing projects
            </span>
                    </div>

                    <h1 className="text-4xl font-black leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                        {role === "founder" ? "Get discovered by " : "Discover and back "}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {role === "founder" ? "serious investors" : "top startups"}
            </span>
                    </h1>

                    <p className="mt-6 text-lg leading-relaxed text-gray-600">
                        {role === "founder"
                            ? "Create your founder profile, list your project, and start getting inbound interest from qualified investors. You control what they see."
                            : "Create your investor profile to review startups by stage, traction and sector. Reach out directly when a project fits your thesis."}
                    </p>

                    {/* 🔥 RESTORED: Feature cards block */}
                    <div className="mt-8 grid gap-4">
                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">Showcase your traction</div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Display your pitch, funding stage, and raise details in a structured investor-friendly format
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884l8 4.8a1 1 0 00.994 0l8-4.8A1 1 0 0018 4H2a1 1 0 00.003 1.884z" />
                                    <path d="M18 8.118l-7 4.2-7-4.2V14a1 1 0 001 1h12a1 1 0 001-1V8.118z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">Direct investor contact</div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Qualified investors can reach out directly. You decide who to engage with
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 7H7v6h6V7z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">Premier placement</div>
                                <div className="mt-1 text-sm text-gray-600">
                                    High-traction projects get featured placement and newsletter spotlights
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🔥 RESTORED: Stats tiles */}
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
            </aside>

            {/* RIGHT SIDE: Form */}
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                        {/* Header */}
                        <div
                            className="relative overflow-hidden p-8 text-center"
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
                                <h2 className="text-3xl font-black text-white">Create Account</h2>
                                <p className="mt-2 text-blue-100">
                                    Join the directory and connect {role === "founder" ? "with investors" : "with founders"}
                                </p>
                            </div>
                        </div>

                        {/* Error */}
                        {errorMsg && (
                            <div className="mx-6 mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
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

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 p-8">
                            {/* Role selector */}
                            <fieldset>
                                <legend className="mb-2 block text-sm font-bold text-gray-700">I am a…</legend>
                                <div className="grid gap-3">
                                    <RoleCard
                                        value="founder"
                                        title="Founder"
                                        description="Create a startup profile and showcase your raise."
                                        icon={
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 2a6 6 0 016 6v1h1a1 1 0 110 2h-1v1a6 6 0 11-12 0v-1H3a1 1 0 110-2h1V8a6 6 0 016-6z" />
                                            </svg>
                                        }
                                    />
                                    <RoleCard
                                        value="investor"
                                        title="Investor"
                                        description="Review startups and contact founders directly."
                                        icon={
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm9-3a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                            </svg>
                                        }
                                    />
                                </div>
                            </fieldset>

                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-gray-700">
                                    Full Name *
                                </label>
                                <input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                    placeholder="Jane Founder"
                                    autoComplete="name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">
                                    Work Email *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                    placeholder="jane@company.com"
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-20 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="Min. 8 characters"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        {showPass ? "Hide" : "Show"}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                <div className="mt-3">
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                                    passScore > i ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Use at least 8 characters. Longer &amp; mixed = stronger.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        <span>Creating account…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <span className="transition-transform group-hover:translate-x-1">🚀</span>
                                    </>
                                )}
                            </button>

                            {/* Sign in link */}
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <a href="/login" className="font-bold text-blue-600 transition hover:text-blue-700">
                                    Sign in
                                </a>
                            </p>

                            {/* Legal */}
                            <p className="text-center text-xs leading-relaxed text-gray-500">
                                By creating an account you agree to our{" "}
                                <a href="/terms" className="font-medium text-blue-600 hover:underline">Terms</a>{" "}
                                and{" "}
                                <a href="/privacy" className="font-medium text-blue-600 hover:underline">Privacy Policy</a>
                            </p>
                        </form>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884l8 4.8a1 1 0 00.994 0l8-4.8A1 1 0 0018 4H2a1 1 0 00.003 1.884z" />
                                <path d="M18 8.118l-7 4.2-7-4.2V14a1 1 0 001 1h12a1 1 0 001-1V8.118z" />
                            </svg>
                            <span className="font-medium">Verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">Free Setup</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
