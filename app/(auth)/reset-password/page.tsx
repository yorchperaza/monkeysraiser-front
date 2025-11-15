"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

function AuthLeftAside() {
    return (
        <aside className="flex flex-col justify-center">
            <div className="max-w-xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="text-sm font-bold text-gray-700">
                        Investors actively reviewing projects
                    </span>
                </div>

                <h1 className="text-4xl font-black leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                    Set a{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        stronger password
                    </span>
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-gray-600">
                    Choose a new password to keep your MonkeysRaiser account secure
                    and get back to founders, investors, and conversations.
                </p>

                {/* Feature cards */}
                <div className="mt-8 grid gap-4">
                    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                            <svg
                                className="h-5 w-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 2a6 6 0 016 6v1h1a1 1 0 110 2h-1v1a6 6 0 11-12 0v-1H3a1 1 0 110-2h1V8a6 6 0 016-6z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">
                                One-time secure link
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Your reset token is time-limited and can only be used once.
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
                                <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm9-3a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">
                                Stronger credentials
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Using a unique password helps protect your investor and
                                founder data.
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
                                Back to business
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Once updated, you can log in again and continue where
                                you left off.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function ResetPasswordInner() {
    const qs = useSearchParams();
    const router = useRouter();

    const token = qs.get("token") || "";

    const [loadingInfo, setLoadingInfo] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [emailMask, setEmailMask] = useState<string | null>(null);

    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const passScore = (() => {
        let s = 0;
        if (password.length >= 10) s++;
        if (/[a-z]/.test(password)) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return Math.min(s, 4);
    })();

    useEffect(() => {
        if (!token) {
            setLoadingInfo(false);
            setTokenValid(false);
            return;
        }

        async function fetchTokenInfo() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/password/token-info?token=${encodeURIComponent(
                        token
                    )}`
                );
                const data = await res.json().catch(() => ({} as any));

                if (res.ok) {
                    setTokenValid(true);
                    setEmailMask(data.emailMask ?? null);
                } else {
                    setTokenValid(false);
                }
            } catch {
                setTokenValid(false);
            } finally {
                setLoadingInfo(false);
            }
        }

        fetchTokenInfo();
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (password.length < 8) {
            setErrorMsg("Password must be at least 8 characters.");
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/password/reset`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password }),
                }
            );

            const data = await res.json().catch(() => ({} as any));

            if (!res.ok) {
                const msg =
                    (typeof data.message === "string" && data.message) ||
                    (typeof data.error === "string" && data.error) ||
                    "Invalid or expired token.";
                setErrorMsg(msg);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login?reset=1");
            }, 1500);
        } catch {
            setErrorMsg("Network error. Please try again.");
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            {/* LEFT SIDE */}
            <AuthLeftAside />

            {/* RIGHT SIDE */}
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
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
                                    Reset Password
                                </h2>
                                <p className="mt-2 text-blue-100 text-sm">
                                    {loadingInfo
                                        ? "Validating reset link…"
                                        : tokenValid
                                            ? emailMask
                                                ? `For ${emailMask}`
                                                : "Enter a new password for your account."
                                            : "This reset link is invalid or has expired."}
                                </p>
                            </div>
                        </div>

                        <div className="p-8">
                            {loadingInfo ? (
                                <p className="text-center text-sm text-gray-500">
                                    Loading…
                                </p>
                            ) : !tokenValid ? (
                                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center">
                                    <p className="text-sm font-medium text-red-700">
                                        The password reset link is invalid or has expired.
                                    </p>
                                    <p className="mt-2 text-xs text-gray-600">
                                        You can request a new one from the{" "}
                                        <a
                                            href="/forgot-password"
                                            className="font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            Forgot Password
                                        </a>{" "}
                                        page.
                                    </p>
                                </div>
                            ) : success ? (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                                    <p className="text-sm font-medium text-green-700">
                                        Password updated successfully. Redirecting to login…
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {errorMsg && (
                                        <div className="mx-0 rounded-xl border-2 border-red-200 bg-red-50 p-4">
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

                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="mb-2 block text-sm font-bold text-gray-700"
                                        >
                                            New Password *
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
                                                placeholder="Min. 8 characters"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPass((v) => !v)}
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
                                                            passScore > i
                                                                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                                                : "bg-gray-200"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Use at least 8 characters. Longer and mixed
                                                characters make it stronger.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                        }}
                                    >
                                        <span>Update password</span>
                                        <span className="transition-transform group-hover:translate-x-1">
                                            ✅
                                        </span>
                                    </button>

                                    <p className="text-center text-sm text-gray-600">
                                        Remembered your password?{" "}
                                        <a
                                            href="/login"
                                            className="font-bold text-blue-600 transition hover:text-blue-700"
                                        >
                                            Back to Sign in
                                        </a>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-sm text-gray-500">
                    Loading reset page…
                </div>
            }
        >
            <ResetPasswordInner />
        </Suspense>
    );
}
