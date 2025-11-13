"use client";

import React from "react";
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

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* HERO */}
            <section
                className="relative overflow-hidden border-b border-gray-200"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl" />

                <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
                    <h1 className="mb-3 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
                        Privacy Policy
                    </h1>
                    <p className="max-w-3xl text-sm md:text-base text-gray-700">
                        This Privacy Policy explains how MonkeysRaiser (“we”, “us”, “our”) collects, uses, stores, and
                        shares personal information. We comply with applicable laws including the U.S. Federal privacy
                        framework, the California Consumer Privacy Act / Privacy Rights Act (CCPA/CPRA), and the European
                        Union General Data Protection Regulation (GDPR).
                    </p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-12">
                <div className="mx-auto max-w-5xl space-y-10 px-6 text-sm md:text-base text-gray-700">

                    {/* Section */}
                    <div id="intro" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">1. Information We Collect</h2>
                        <p>We collect information in the following categories:</p>

                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Account information:</strong> name, email, password (hashed), profile details.</li>
                            <li><strong>Project data:</strong> descriptions, pitch decks, media uploads, fundraising details.</li>
                            <li><strong>Investor preferences:</strong> sectors, stages, geography.</li>
                            <li><strong>Usage data:</strong> pages visited, actions taken, IP address, timestamps.</li>
                            <li><strong>Communication data:</strong> messages sent through the platform.</li>
                            <li><strong>Cookies & tracking:</strong> essential cookies and analytics cookies.</li>
                        </ul>
                    </div>

                    {/* Section */}
                    <div id="sources" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">2. How We Collect Information</h2>

                        <ul className="list-disc pl-5 space-y-1">
                            <li>Directly from you when you register, update a profile, or create a project.</li>
                            <li>Automatically through logs, cookies, and analytics tools.</li>
                            <li>Through communications with other users (messaging).</li>
                            <li>Through voluntary submissions (e.g., contact forms, newsletters).</li>
                        </ul>
                    </div>

                    {/* Section */}
                    <div id="usage" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">3. How We Use Your Information</h2>

                        <ul className="list-disc pl-5 space-y-1">
                            <li>To operate and maintain the MonkeysRaiser platform.</li>
                            <li>To display your founder or project profile to investors.</li>
                            <li>To enable investor-to-founder messaging.</li>
                            <li>To send newsletters or updates (if you subscribe).</li>
                            <li>To improve functionality and prevent misuse or fraud.</li>
                        </ul>

                        <p className="text-xs text-gray-500">
                            Under **GDPR**, our lawful bases include: Legitimate Interest, Consent, Performance of a
                            Contract, and Compliance with Legal Obligations.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="sharing" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">4. How We Share Information</h2>

                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong>With investors:</strong> If you list a project, your profile, project data, media,
                                and fundraising details may be visible to investors.
                            </li>
                            <li><strong>With service providers:</strong> hosting, cloud storage, email services, analytics.</li>
                            <li><strong>Legal or regulatory requests:</strong> to comply with applicable law.</li>
                            <li><strong>No selling of data:</strong> We do <strong>not</strong> sell your personal information.</li>
                        </ul>

                        <p className="text-xs text-gray-500">
                            For California residents: We do not “sell” or “share” personal data within the meaning of
                            CCPA/CPRA.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="rights" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">5. Your Privacy Rights</h2>

                        <h3 className="font-semibold text-gray-900 pt-2">California (CCPA/CPRA)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Right to Know what personal data we collect.</li>
                            <li>Right to Delete your personal data.</li>
                            <li>Right to Correct inaccurate data.</li>
                            <li>Right to Opt-Out of sale or sharing (we do not sell).</li>
                            <li>Right to Non-Discrimination for exercising your rights.</li>
                        </ul>

                        <h3 className="font-semibold text-gray-900 pt-4">European Union (GDPR)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Right of Access to your data.</li>
                            <li>Right to Rectification of inaccurate data.</li>
                            <li>Right to Erasure (“Right to be Forgotten”).</li>
                            <li>Right to Restrict Processing.</li>
                            <li>Right to Data Portability.</li>
                            <li>Right to Object to certain processing.</li>
                            <li>Right to Withdraw Consent at any time.</li>
                        </ul>

                        <p className="text-xs text-gray-500 pt-2">
                            To exercise any rights, contact us at:{" "}
                            <span className="font-semibold">privacy@monkeys.cloud</span>
                        </p>
                    </div>

                    {/* Section */}
                    <div id="retention" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">6. Data Retention</h2>
                        <p>
                            We retain information for as long as needed to operate the platform, comply with legal
                            requirements, or as otherwise permitted by law. You may request deletion at any time.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="cookies" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">7. Cookies & Tracking</h2>
                        <p>
                            We use cookies to enable essential site functions and, optionally, analytics. You may block
                            or delete cookies via your browser settings.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="children" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">8. Children’s Privacy</h2>
                        <p>
                            MonkeysRaiser is not intended for children under 16. We do not knowingly collect personal
                            information from children.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="security" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">9. Data Security</h2>
                        <p>
                            We implement reasonable physical, organizational, and technical safeguards to protect your
                            data. However, no system is 100% secure.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="international" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">10. International Transfers</h2>
                        <p>
                            If you reside in Europe, your data may be transferred outside your country. We rely on
                            Standard Contractual Clauses (SCCs) or other safeguards where required by GDPR.
                        </p>
                    </div>

                    {/* Section */}
                    <div id="changes" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">11. Changes to this Policy</h2>
                        <p>We may update this Privacy Policy from time to time. The “Last Updated” date will always appear at the top of the page.</p>
                    </div>

                    {/* Section */}
                    <div id="contact" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">12. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy or wish to exercise your rights:</p>

                        <p className="text-sm text-gray-800">
                            <strong>Email:</strong> privacy@monkeys.cloud <br />
                            <strong>Company:</strong> MonkeysRaiser, USA <br />
                        </p>
                    </div>

                    {/* LINKS */}
                    <div className="pt-6">
                        <Link
                            href="/"
                            className="rounded-xl px-5 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                            style={{
                                background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                            }}
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
