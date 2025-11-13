"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";

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

// Backend base URL (same pattern you use elsewhere)
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type Status = "idle" | "loading" | "success" | "error";

/* ---------------- PAGE ---------------- */
export default function NewsletterPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string>("");

    async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmed = email.trim();
        if (!trimmed) {
            setStatus("error");
            setMessage("Please enter your email.");
            return;
        }

        // Simple email sanity check
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const endpoint = BE ? `${BE}/newsletter/subscribe` : "/newsletter/subscribe";

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
                // ignore JSON parse errors
            }

            if (!res.ok) {
                const apiMessage =
                    (payload && (payload.message || payload.error)) ||
                    "Could not subscribe. Please try again.";
                setStatus("error");
                setMessage(apiMessage);
                return;
            }

            setStatus("success");
            setMessage("You’re subscribed to the MonkeysRaiser newsletter! 🎉");
            setEmail("");
        } catch (err) {
            console.error("[NEWSLETTER][SUBSCRIBE][ERR]", err);
            setStatus("error");
            setMessage("Network error while subscribing. Please try again.");
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero / main section */}
            <section
                className="relative overflow-hidden"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6 py-20">
                    <div className="grid items-start gap-12 md:grid-cols-2">
                        {/* Left: text */}
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                                MonkeysRaiser Newsletter
                            </div>
                            <h1 className="mb-4 text-5xl font-black leading-tight text-gray-900">
                                Stay ahead of founders & deals
                            </h1>
                            <p className="mb-4 text-lg text-gray-600">
                                Get a curated snapshot of standout startups, funding stages, and investor-relevant updates
                                from the MonkeysRaiser community—directly in your inbox.
                            </p>
                            <ul className="mb-6 space-y-2 text-sm text-gray-700">
                                <li>• Hand-picked startups by category and stage.</li>
                                <li>• Highlights on traction, milestones, and fundraising rounds.</li>
                                <li>• Occasional insights on deal flow trends and founder stories.</li>
                            </ul>
                            <p className="text-xs text-gray-500">
                                No spam. Just periodic, high-signal updates. Unsubscribe anytime.
                            </p>
                        </div>

                        {/* Right: subscription card */}
                        <div className="flex items-center justify-center">
                            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                                <h2 className="mb-2 text-xl font-black text-gray-900">
                                    Subscribe to the investor & founder newsletter
                                </h2>
                                <p className="mb-4 text-sm text-gray-600">
                                    Drop your email and we’ll keep you informed when new projects and spotlight campaigns go live.
                                </p>

                                <form className="space-y-3" onSubmit={handleSubscribe}>
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
                                            background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                        }}
                                        disabled={status === "loading"}
                                    >
                                        {status === "loading" ? "Subscribing..." : "Subscribe"}
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
                                        By subscribing you agree to our{" "}
                                        <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
                                            Privacy Policy
                                        </Link>{" "}
                                        and{" "}
                                        <Link href="/terms" className="font-medium text-blue-600 hover:underline">
                                            Terms of Service
                                        </Link>
                                        .
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Secondary section with links */}
                    <div className="mx-auto mt-16 max-w-4xl text-center">
                        <h2 className="text-2xl font-black text-gray-900">Already exploring MonkeysRaiser?</h2>
                        <p className="mt-2 text-gray-600 text-sm md:text-base">
                            Combine the newsletter with in-platform browsing to keep a real-time pulse on founders, projects, and funding momentum.
                        </p>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href="/projects"
                                className="rounded-xl border-2 bg-white px-5 py-3 text-sm font-bold transition hover:bg-gray-50"
                                style={{ borderColor: brand.primary, color: brand.primary }}
                            >
                                Browse Projects
                            </Link>
                            <Link
                                href="/investors"
                                className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                            >
                                Investor Onboarding
                            </Link>
                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Want to stop receiving emails later? Every newsletter includes a one-click unsubscribe link.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
