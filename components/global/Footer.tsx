"use client";

import Link from "next/link";
import { useMemo, useState, FormEvent } from "react";
import Image from "next/image";

/** If you're using next-auth, you can pass session.user in via prop */
type UserLike = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: "founder" | "investor" | "admin" | string;
};

// Backend base URL (same pattern as other files)
const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

export default function Footer({ user }: { user?: UserLike | null }) {
    const year = useMemo(() => new Date().getFullYear(), []);

    const brand = {
        primary: "#0066CC",
        darkBlue: "#003D7A",
    };

    // Newsletter state
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState<string>("");

    async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmed = email.trim();
        if (!trimmed) {
            setStatus("error");
            setMessage("Please enter your email.");
            return;
        }

        // Very small client-side email sanity check
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
                // ignore json errors, we’ll still handle by status
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
            setMessage("You’re subscribed! 🎉");
            setEmail("");
        } catch (err) {
            console.error("[NEWSLETTER][SUBSCRIBE][ERR]", err);
            setStatus("error");
            setMessage("Network error while subscribing. Please try again.");
        }
    }

    return (
        <footer className="border-t bg-gray-50">
            {/* Top */}
            <div className="mx-auto max-w-7xl px-6 py-14">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand + blurb */}
                    <div className="lg:col-span-2">
                        <div className="mb-4 flex items-center gap-2">
                            <Image src="/logo.svg" alt="MonkeysRaiser" width={160} height={38} />
                        </div>
                        <p className="mb-6 max-w-md text-gray-600">
                            A curated directory connecting innovative founders with investors.
                            Browse projects by funding stage, category, and capital needs.
                        </p>

                        {/* Newsletter form */}
                        <form
                            className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-stretch"
                            onSubmit={handleSubscribe}
                        >
                            <input
                                type="email"
                                required
                                placeholder="Your email for updates"
                                className="
        w-full rounded-xl
        border border-gray-400
        bg-white
        px-4 py-3 text-sm
        text-gray-800
        placeholder-gray-500
        outline-none
        transition
        focus:border-blue-700
        focus:ring-2 focus:ring-blue-200
        shadow-sm
    "
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading'}
                            />
                            <button
                                type="submit"
                                className="rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                style={{
                                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                }}
                                disabled={status === "loading"}
                            >
                                {status === "loading" ? "Subscribing..." : "Subscribe"}
                            </button>
                        </form>

                        {message && (
                            <p
                                className={`mt-2 text-sm ${
                                    status === "success" ? "text-green-600" : "text-red-600"
                                }`}
                            >
                                {message}
                            </p>
                        )}

                        {/* Socials */}
                        <div className="mt-6 flex gap-4">
                            <Link
                                href="#"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-blue-600 hover:text-white"
                                aria-label="Twitter / X"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-blue-600 hover:text-white"
                                aria-label="LinkedIn"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Column: Investors */}
                    <nav>
                        <div className="mb-4 font-bold text-gray-900">For Investors</div>
                        <div className="space-y-3 text-sm">
                            <Link href="/projects" className="block text-gray-600 transition hover:text-blue-600">
                                Browse Projects
                            </Link>
                            <Link href="/newsletter" className="block text-gray-600 transition hover:text-blue-600">
                                Newsletter
                            </Link>
                            {/* Logged-in extras */}
                            {user && (
                                <>
                                    <Link href="/dashboard" className="block text-gray-600 transition hover:text-blue-600">
                                        Favorites
                                    </Link>
                                    <Link
                                        href="/dashboard/messages"
                                        className="block text-gray-600 transition hover:text-blue-600"
                                    >
                                        Messages
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Column: Founders (changes if logged in) */}
                    <nav>
                        <div className="mb-4 font-bold text-gray-900">For Founders</div>
                        <div className="space-y-3 text-sm">
                            {!user ? (
                                <>
                                    <Link href="/register" className="block text-gray-600 transition hover:text-blue-600">
                                        List Your Project
                                    </Link>
                                    <Link href="/pricing" className="block text-gray-600 transition hover:text-blue-600">
                                        Pricing
                                    </Link>
                                    <Link href="/guidelines" className="block text-gray-600 transition hover:text-blue-600">
                                        Guidelines
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/dashboard/projects/new"
                                        className="block text-gray-600 transition hover:text-blue-600"
                                    >
                                        New Project
                                    </Link>
                                    <Link
                                        href="/dashboard/projects"
                                        className="block text-gray-600 transition hover:text-blue-600"
                                    >
                                        My Projects
                                    </Link>
                                    <Link href="/dashboard" className="block text-gray-600 transition hover:text-blue-600">
                                        Dashboard
                                    </Link>
                                    <Link href="/dashboard/plans" className="block text-gray-600 transition hover:text-blue-600">
                                        Plans
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>

                {/* CTA row (changes by auth) */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row">
                    <div className="text-center md:text-left">
                        <div className="text-lg font-bold text-gray-900">
                            {user ? "Keep building momentum" : "Ready to get discovered?"}
                        </div>
                        <div className="text-sm text-gray-600">
                            {user
                                ? "Update your profile, publish progress, and reach more investors."
                                : "List your project and connect with active investors today."}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {!user ? (
                            <>
                                <Link
                                    href="/register"
                                    className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                    }}
                                >
                                    List Your Project
                                </Link>
                                <Link
                                    href="/login"
                                    className="rounded-xl border-2 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                                    style={{ borderColor: brand.primary }}
                                >
                                    Sign in
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/dashboard/projects/new"
                                    className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                    }}
                                >
                                    New Project
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="rounded-xl border-2 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                                    style={{ borderColor: brand.primary }}
                                >
                                    Go to Dashboard
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-200">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
                    <div className="text-sm text-gray-600">© {year} MonkeysRaiser. All rights reserved.</div>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <Link href="/privacy" className="transition hover:text-blue-600">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="transition hover:text-blue-600">
                            Terms of Service
                        </Link>
                        <Link href="/legal/disclaimer" className="transition hover:text-blue-600">
                            Disclaimer
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
