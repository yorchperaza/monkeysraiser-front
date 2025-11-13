"use client";

import React, { useState, useEffect, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

// Backend base URL (same pattern as other files)
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type Status = "idle" | "loading" | "success" | "error";

/* ---------------- INNER PAGE (uses useSearchParams) ---------------- */
function NewsletterUnsubscribeInner() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string>("");

    // Prefill from ?email= in URL if present
    useEffect(() => {
        const paramEmail = searchParams.get("email");
        if (paramEmail && !email) {
            setEmail(paramEmail);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    async function handleUnsubscribe(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmed = email.trim();
        if (!trimmed) {
            setStatus("error");
            setMessage("Please enter your email.");
            return;
        }

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const endpoint = BE ? `${BE}/newsletter/unsubscribe` : "/newsletter/unsubscribe";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: trimmed }),
            });

            let payload: any = null;
            try {
                payload = await res.json();
            } catch {
                // ignore
            }

            if (!res.ok) {
                const apiMessage =
                    (payload && (payload.message || payload.error)) ||
                    "Could not unsubscribe. Please try again.";
                setStatus("error");
                setMessage(apiMessage);
                return;
            }

            // We don't care if it was actually subscribed or not, just show generic success.
            setStatus("success");
            setMessage("You’ve been unsubscribed from the MonkeysRaiser newsletter.");
        } catch (err) {
            console.error("[NEWSLETTER][UNSUBSCRIBE][ERR]", err);
            setStatus("error");
            setMessage("Network error while unsubscribing. Please try again.");
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <section
                className="relative overflow-hidden"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-3xl px-6 py-20">
                    <div className="mb-10 text-center">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                            Manage newsletter preferences
                        </div>
                        <h1 className="mb-3 text-4xl font-black leading-tight text-gray-900">
                            Unsubscribe from updates
                        </h1>
                        <p className="text-sm text-gray-600 md:text-base">
                            We’re sorry to see you go. Enter your email below and we’ll stop sending you MonkeysRaiser
                            newsletter updates. You can always subscribe again later.
                        </p>
                    </div>

                    <div className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                        <form className="space-y-3" onSubmit={handleUnsubscribe}>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="
                                        w-full rounded-xl
                                        border border-gray-500
                                        bg-white
                                        px-4 py-3 text-sm
                                        text-gray-900
                                        placeholder-gray-600
                                        outline-none
                                        transition
                                        focus:border-blue-800
                                        focus:ring-2 focus:ring-blue-300
                                        shadow-sm
                                    "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === "loading"}
                                />
                            </div>

                            <button
                                type="submit"
                                className="flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                style={{
                                    background: `linear-gradient(135deg, #DC2626, #7F1D1D)`, // red gradient for unsubscribe
                                }}
                                disabled={status === "loading"}
                            >
                                {status === "loading" ? "Processing..." : "Unsubscribe"}
                            </button>

                            {message && (
                                <p
                                    className={`text-sm ${
                                        status === "success" ? "text-green-600" : "text-red-600"
                                    }`}
                                >
                                    {message}
                                </p>
                            )}

                            <p className="pt-2 text-xs text-gray-500">
                                This only affects the MonkeysRaiser newsletter. Transactional emails related to your
                                account or projects may still be sent where necessary.
                            </p>
                        </form>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
                            <span>Changed your mind?</span>
                            <div className="flex gap-3">
                                <Link href="/newsletter" className="font-semibold text-blue-600 hover:underline">
                                    Subscribe again
                                </Link>
                                <Link href="/projects" className="font-semibold text-gray-700 hover:underline">
                                    Browse projects
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ---------------- DEFAULT EXPORT: wrap in Suspense ---------------- */
export default function NewsletterUnsubscribePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                    Loading unsubscribe page…
                </div>
            }
        >
            <NewsletterUnsubscribeInner />
        </Suspense>
    );
}
