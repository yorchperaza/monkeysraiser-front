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

export default function TermsPage() {
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
                        Terms of Service
                    </h1>
                    <p className="max-w-3xl text-sm md:text-base text-gray-700">
                        These Terms govern your use of MonkeysRaiser (“we”, “our”, “the Platform”). By using this site or creating an account, you agree to these conditions.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">Last updated: {new Date().getFullYear()}</p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-12">
                <div className="mx-auto max-w-5xl space-y-10 px-6 text-sm md:text-base text-gray-700">

                    {/* INTRO */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using MonkeysRaiser, you confirm that you are at least 18 years old and have
                            the legal capacity to enter into these Terms. If you do not agree, please discontinue use
                            of the Platform immediately.
                        </p>
                    </div>

                    {/* ACCOUNTS */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">2. Accounts & Responsibilities</h2>
                        <p>When you create an account, you agree to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Provide accurate and truthful information.</li>
                            <li>Maintain confidentiality of your login credentials.</li>
                            <li>Notify us immediately of any unauthorized account activity.</li>
                            <li>Use the Platform only for lawful purposes.</li>
                        </ul>
                        <p className="text-sm">
                            You are responsible for all actions taken under your account unless proven fraudulent.
                        </p>
                    </div>

                    {/* PLATFORM USE */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">3. Platform Purpose</h2>
                        <p>
                            MonkeysRaiser provides a directory for startup founders and investors to connect. We are
                            not a broker-dealer, financial advisor, or investment intermediary. We do not guarantee
                            funding, investment, or business results.
                        </p>
                    </div>

                    {/* USER CONTENT */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">4. User-Generated Content</h2>
                        <p>You retain ownership of the content you upload, but grant us a license to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Store, display, and process your content on the Platform.</li>
                            <li>Use media (e.g., logos, pitch decks) for platform functionality.</li>
                            <li>Show your project to investors and users.</li>
                        </ul>
                        <p>
                            You may not upload unlawful, offensive, misleading, or infringing content. We may remove
                            or suspend content at our discretion.
                        </p>
                    </div>

                    {/* PAYMENTS */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">5. Payments & Refunds</h2>
                        <p>
                            Certain features (Spotlight Boost, Investor Accelerator) may require payment. Unless
                            otherwise stated:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>All payments are final and non-refundable.</li>
                            <li>Renewals are voluntary — we do not automatically subscribe you to paid tiers.</li>
                            <li>Pricing may change with notice.</li>
                        </ul>
                    </div>

                    {/* PRIVACY */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">6. Privacy & Data Protection</h2>
                        <p>
                            Your use of the Platform is also governed by our{" "}
                            <Link href="/privacy" className="text-blue-600 font-semibold">Privacy Policy</Link>.
                        </p>
                        <p>
                            We follow global standards for privacy compliance, including GDPR for EU users and CPRA for
                            California residents.
                        </p>
                    </div>

                    {/* PROHIBITED */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">7. Prohibited Activities</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Use the platform for fraud, spam, or misleading activity.</li>
                            <li>Scrape or harvest user data without permission.</li>
                            <li>Attempt to hack, disrupt, or overload our systems.</li>
                            <li>Upload malware, viruses, or harmful content.</li>
                        </ul>
                    </div>

                    {/* DISCLAIMERS */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">8. No Guarantees; Disclaimer</h2>
                        <p>
                            MonkeysRaiser provides information “as is” and “as available”. We make no guarantees
                            regarding:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Investment outcomes</li>
                            <li>Accuracy of user-submitted content</li>
                            <li>Availability or uninterrupted service</li>
                            <li>Third-party actions outside our control</li>
                        </ul>
                        <p className="text-xs italic text-gray-500">
                            Nothing on MonkeysRaiser constitutes financial, legal, or investment advice.
                        </p>
                    </div>

                    {/* LIABILITY */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">9. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, MonkeysRaiser is not liable for indirect, incidental,
                            special, or consequential damages. Our total liability will not exceed the amount you paid
                            us in the twelve (12) months prior to the claim.
                        </p>
                    </div>

                    {/* TERMINATION */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">10. Termination</h2>
                        <p>We may suspend or terminate your account if:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>You violate these Terms</li>
                            <li>We detect fraud or abusive activity</li>
                            <li>We discontinue the service</li>
                        </ul>
                        <p>
                            You may delete your account at any time through your dashboard or by contacting
                            <span className="font-semibold"> support@monkeys.cloud</span>.
                        </p>
                    </div>

                    {/* GOVERNING LAW */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">11. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of the United States and the State of California,
                            without conflict-of-laws principles. EU users retain GDPR rights where applicable.
                        </p>
                    </div>

                    {/* CHANGES */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">12. Changes to Terms</h2>
                        <p>
                            We may update these Terms periodically. Updates take effect when published. Continued use
                            after revisions means you accept the updated Terms.
                        </p>
                    </div>

                    {/* CONTACT */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">13. Contact Us</h2>
                        <p>
                            For questions about these Terms or your account:
                        </p>
                        <p className="text-sm text-gray-800">
                            <strong>Email:</strong> legal@monkeys.cloud <br />
                            <strong>Company:</strong> MonkeysRaiser, USA
                        </p>
                    </div>

                    {/* CTA */}
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
