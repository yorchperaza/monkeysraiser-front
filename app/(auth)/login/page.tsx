"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// match brand palette
const brand = {
    primary: "#0066CC",
    darkBlue: "#003D7A",
};

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // where should we go after login?
    // e.g. /login?from=/dashboard
    const redirectTo =
        searchParams.get("from") && searchParams.get("from") !== "/login"
            ? searchParams.get("from")!
            : "/dashboard";

    // form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    // ui state
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }
        if (!password) {
            setErrorMsg("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data = await res.json().catch(() => ({} as any));

            if (res.ok && data.token) {
                localStorage.setItem("auth_token", data.token);
                document.cookie = `token=${data.token}; path=/; samesite=lax`;

                if (!data.hasProfile) {
                    router.push("/dashboard/profile/create");
                } else {
                    router.push(redirectTo);
                }

                // IMPORTANT: stop here so we don't fall through
                return;
            }

            // auth failure (400, 401, etc)
            const msg =
                (typeof data.message === "string" && data.message) ||
                "Invalid email or password.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            {/* LEFT SIDE: Marketing / Social Proof */}
            <aside className="flex flex-col justify-center">
                <div className="max-w-xl">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-lg">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="text-sm font-bold text-gray-700">
                            Founders are actively raising today
                        </span>
                    </div>

                    <h1 className="text-4xl font-black leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                        Welcome back,
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            let&apos;s keep building
                        </span>
                    </h1>

                    <p className="mt-6 text-lg leading-relaxed text-gray-600">
                        Access your dashboard, update your project profile, and
                        respond to new investor interest in real time.
                    </p>

                    <div className="mt-8 grid gap-4">
                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg
                                    className="h-5 w-5 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">
                                    Manage investor outreach
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Reply to intros, send updates, and keep
                                    momentum warm
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg
                                    className="h-5 w-5 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M2.003 5.884l8 4.8a1 1 0 00.994 0l8-4.8A1 1 0 0018 4H2a1 1 0 00.003 1.884z" />
                                    <path d="M18 8.118l-7 4.2-7-4.2V14a1 1 0 001 1h12a1 1 0 001-1V8.118z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">
                                    Pitch with confidence
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Keep your raise details and traction
                                    current — investors see freshness
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <svg
                                    className="h-5 w-5 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M13 7H7v6h6V7z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">
                                    Stay visible to capital
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    High-signal startups surface first to
                                    relevant investors
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-10 grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-3xl font-black text-gray-900">
                                250+
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Active projects
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">
                                $2.4M+
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Capital raised
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">
                                500+
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Registered investors
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* RIGHT SIDE: Login Form */}
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                        {/* Header */}
                        <div
                            className="relative overflow-hidden p-8 text-center"
                            style={{
                                background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                            }}
                        >
                            <div className="absolute inset-0 opacity-10">
                                <div
                                    className="absolute h-full w-full"
                                    style={{
                                        backgroundImage:
                                            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                                        backgroundSize: "40px 40px",
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <h2 className="text-3xl font-black text-white">
                                    Sign In
                                </h2>
                                <p className="mt-2 text-blue-100">
                                    Access your founder dashboard
                                </p>
                            </div>
                        </div>

                        {/* Error message */}
                        {errorMsg && (
                            <div className="mx-6 mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                                <div className="flex items-start gap-3">
                                    <svg
                                        className="h-5 w-5 shrink-0 text-red-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <p className="text-sm font-medium text-red-800">
                                        {errorMsg}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 p-8"
                        >
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                    placeholder="founder@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-20 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="Your password"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPass(!showPass)
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        {showPass ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="flex justify-end">
                                <a
                                    href="/forgot-password"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="h-5 w-5 animate-spin text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            />
                                        </svg>
                                        <span>Signing in…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <span className="transition-transform group-hover:translate-x-1">
                                            🔐
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Register link */}
                            <p className="text-center text-sm text-gray-600">
                                Don&apos;t have an account?{" "}
                                <a
                                    href="/register"
                                    className="font-bold text-blue-600 transition hover:text-blue-700"
                                >
                                    Create one
                                </a>
                            </p>
                        </form>

                        {/* Trust badges */}
                        <div className="px-8 pb-8">
                            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="font-medium">
                                        Secure
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M2.003 5.884l8 4.8a1 1 0 00.994 0l8-4.8A1 1 0 0018 4H2a1 1 0 00.003 1.884z" />
                                        <path d="M18 8.118l-7 4.2-7-4.2V14a1 1 0 001 1h12a1 1 0 001-1V8.118z" />
                                    </svg>
                                    <span className="font-medium">
                                        Verified
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="font-medium">
                                        Free Setup
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtext under card (optional) */}
                    <p className="mt-8 text-center text-xs leading-relaxed text-gray-500">
                        By signing in you agree to our{" "}
                        <a
                            href="/terms"
                            className="font-medium text-blue-600 hover:underline"
                        >
                            Terms
                        </a>{" "}
                        and{" "}
                        <a
                            href="/privacy"
                            className="font-medium text-blue-600 hover:underline"
                        >
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Default export: wrap useSearchParams usage in Suspense
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-sm text-gray-500">
                    Loading login…
                </div>
            }
        >
            <LoginPageInner />
        </Suspense>
    );
}
