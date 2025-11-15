"use client";

import React, { useState, useEffect } from "react";

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
                    Get back into{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        your MonkeysRaiser account
                    </span>
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-gray-600">
                    Secure password recovery so you can continue reviewing projects,
                    talking with investors and founders, and tracking your raises.
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
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">
                                Secure by design
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Time-limited tokens and one-time reset links keep
                                your account protected.
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
                                Email-based recovery
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                We’ll send a reset link to the address associated
                                with your account.
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
                                Back to deal flow
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Quickly regain access to conversations and project
                                pipelines.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function ForgotPasswordInner() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    // resend control
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!sent) return;

        if (secondsLeft <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setTimeout(() => {
            setSecondsLeft((s) => s - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [sent, secondsLeft]);

    async function requestResetLink() {
        setErrorMsg(null);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/password/forgot`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({} as any));
                const msg =
                    (typeof data.message === "string" && data.message) ||
                    (typeof data.error === "string" && data.error) ||
                    "Something went wrong. Please try again.";
                setErrorMsg(msg);
            } else {
                setSent(true);
                setCanResend(false);
                setSecondsLeft(30); // 30s until they can request a new link
            }
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await requestResetLink();
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            {/* LEFT SIDE */}
            <AuthLeftAside />

            {/* RIGHT SIDE: Card */}
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
                                    Forgot Password
                                </h2>
                                <p className="mt-2 text-blue-100">
                                    Enter your email and we&apos;ll send you a reset link.
                                </p>
                            </div>
                        </div>

                        <div className="p-8">
                            {errorMsg && (
                                <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4">
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

                            {sent ? (
                                <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                                    <p className="text-sm font-medium text-green-700">
                                        If an account exists for{" "}
                                        <span className="font-semibold">{email}</span>, a reset
                                        link has been sent.
                                    </p>
                                    <p className="text-xs text-green-800">
                                        Please check your inbox and also your{" "}
                                        <span className="font-semibold">Spam / Junk</span> folder.
                                    </p>

                                    <div className="pt-2 text-xs text-gray-700">
                                        {canResend ? (
                                            <button
                                                type="button"
                                                onClick={requestResetLink}
                                                disabled={loading}
                                                className="font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-60"
                                            >
                                                {loading ? "Sending new link…" : "Send a new reset link"}
                                            </button>
                                        ) : (
                                            <span>
                                                You can request a new link in{" "}
                                                <span className="font-semibold">
                                                    {secondsLeft}s
                                                </span>
                                                .
                                            </span>
                                        )}
                                    </div>

                                    <p className="pt-2 text-xs text-gray-500">
                                        Used the wrong email? You can go back and try again from the
                                        login screen.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-sm font-bold text-gray-700"
                                        >
                                            Email address *
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                        />
                                    </div>

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
                                                <span>Sending link…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send reset link</span>
                                                <span className="transition-transform group-hover:translate-x-1">
                                                    📩
                                                </span>
                                            </>
                                        )}
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

export default function ForgotPasswordPage() {
    return <ForgotPasswordInner />;
}
