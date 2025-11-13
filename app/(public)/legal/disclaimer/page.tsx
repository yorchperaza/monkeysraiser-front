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

export default function LegalDisclaimerPage() {
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
                        Legal Disclaimer & Notices
                    </h1>
                    <p className="max-w-3xl text-sm md:text-base text-gray-700">
                        This page contains important legal information regarding MonkeysRaiser including disclaimers,
                        forward-looking statements, DMCA, cookies, and security policies.
                    </p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-12">
                <div className="mx-auto max-w-5xl space-y-10 px-6 text-sm md:text-base text-gray-700">

                    {/* 1: Investment Disclaimer */}
                    <div id="investment" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">
                            1. Investment Disclaimer (No Financial Advice)
                        </h2>
                        <p>
                            MonkeysRaiser is <strong>not</strong> a broker-dealer, funding portal, investment advisor,
                            financial institution, or regulated financial intermediary. All content on the Platform,
                            including project pages, investor profiles, metrics, analysis, messages, or promotional material,
                            is for informational purposes only.
                        </p>
                        <p>
                            Nothing on MonkeysRaiser shall be interpreted as:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>an investment recommendation</li>
                            <li>financial advice or guidance</li>
                            <li>legal or tax advice</li>
                            <li>a solicitation to buy or sell securities</li>
                            <li>a guarantee of funding, investment, performance, or returns</li>
                        </ul>
                        <p>
                            Any investment decisions you make are solely your responsibility. Always consult with a licensed
                            financial or legal advisor.
                        </p>
                    </div>

                    {/* 2: Accuracy Disclaimer */}
                    <div id="accuracy" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">2. Accuracy of Information</h2>
                        <p>
                            Content submitted by founders, investors, and users is not independently verified by
                            MonkeysRaiser. We do not guarantee the accuracy, completeness, timeliness, or reliability of:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>project descriptions</li>
                            <li>financial data or claims</li>
                            <li>traction metrics</li>
                            <li>team information</li>
                            <li>investor profiles</li>
                            <li>external links or documents</li>
                        </ul>
                        <p className="text-xs text-gray-500">
                            Users should independently verify all claims before making decisions.
                        </p>
                    </div>

                    {/* 3: Forward-Looking Statements */}
                    <div id="forward-looking" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">3. Forward-Looking Statements</h2>
                        <p>
                            Many startup projects include statements about future expectations, goals, revenue forecasts,
                            performance, and business milestones. These are considered “forward-looking statements” under
                            U.S. federal securities laws.
                        </p>
                        <p>
                            Forward-looking statements are inherently uncertain and subject to risks including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>competitive shifts</li>
                            <li>market conditions</li>
                            <li>operational failures</li>
                            <li>financial volatility</li>
                            <li>regulatory changes</li>
                        </ul>
                        <p>
                            Actual results may differ materially. MonkeysRaiser is not responsible for inaccuracies in these
                            projections or assumptions.
                        </p>
                    </div>

                    {/* 4: No Guarantee of Funding */}
                    <div id="funding" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">4. No Guarantee of Funding or Outcomes</h2>
                        <p>
                            Using MonkeysRaiser does not ensure that:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>you will raise capital</li>
                            <li>investors will contact you</li>
                            <li>your project will be approved or featured</li>
                            <li>you will gain traction or visibility</li>
                        </ul>
                        <p>
                            The Platform is a directory and connection tool only.
                        </p>
                    </div>

                    {/* 5: DMCA */}
                    <div id="dmca" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">5. DMCA Take-Down Policy</h2>
                        <p>
                            If you believe that content on MonkeysRaiser infringes copyright you own, you may submit a
                            Digital Millennium Copyright Act (“DMCA”) notice.
                        </p>

                        <p className="font-semibold">Your takedown notice must include:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Identification of the copyrighted work</li>
                            <li>Identification of the infringing material (URL)</li>
                            <li>Your contact information</li>
                            <li>A statement of good faith belief</li>
                            <li>A statement that your claim is accurate under penalty of perjury</li>
                            <li>Your physical or electronic signature</li>
                        </ul>

                        <p className="text-sm">
                            Email DMCA notices to:{" "}
                            <span className="font-semibold">dmca@monkeys.cloud</span>
                        </p>

                        <p className="text-xs text-gray-500">
                            We may restore removed content if a valid counter-notice is submitted.
                        </p>
                    </div>

                    {/* 6: Cookie Policy */}
                    <div id="cookies" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">6. Cookie Policy</h2>
                        <p>
                            MonkeysRaiser uses cookies and similar technologies to provide a functional, secure, and
                            personalized experience. These include:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Essential cookies:</strong> required for login, sessions, security.</li>
                            <li><strong>Analytics cookies:</strong> measure usage and improve the platform.</li>
                            <li><strong>Preference cookies:</strong> save language or UI settings.</li>
                        </ul>
                        <p>
                            You may block cookies in your browser, although some features may not function correctly.
                        </p>
                    </div>

                    {/* 7: Security Notice */}
                    <div id="security" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">7. Security Notice</h2>
                        <p>
                            We employ reasonable administrative, technical, and physical safeguards to protect user
                            information. However:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>no online system is completely secure</li>
                            <li>we cannot guarantee prevention of all breaches or unauthorized access</li>
                            <li>you are responsible for using strong passwords and safely managing your account</li>
                        </ul>
                        <p>
                            If you believe your account has been compromised, contact:{" "}
                            <span className="font-semibold">security@monkeys.cloud</span>
                        </p>
                    </div>

                    {/* 8: External Links */}
                    <div id="links" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">8. External Links</h2>
                        <p>
                            MonkeysRaiser may include links to third-party services. These external sites have their own
                            privacy policies and terms. We are not responsible for:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>their content</li>
                            <li>their accuracy</li>
                            <li>their data collection practices</li>
                        </ul>
                    </div>

                    {/* 9: No Warranties */}
                    <div id="warranties" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">9. No Warranties</h2>
                        <p>
                            The Platform and all content are provided “as is” and “as available”. We disclaim all
                            warranties, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>implied warranties of merchantability</li>
                            <li>fitness for a particular purpose</li>
                            <li>non-infringement</li>
                            <li>accuracy or completeness of user content</li>
                        </ul>
                    </div>

                    {/* 10: Limitation of Liability */}
                    <div id="liability" className="space-y-3">
                        <h2 className="text-2xl font-black text-gray-900">10. Limitation of Liability</h2>
                        <p>
                            To the fullest extent permitted by law, MonkeysRaiser, its founders, employees, and affiliates
                            are not liable for any indirect, incidental, punitive, or consequential damages, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>lost profits or revenue</li>
                            <li>data loss</li>
                            <li>business interruption</li>
                            <li>errors or omissions</li>
                            <li>security breaches outside our control</li>
                        </ul>
                        <p>
                            Our liability, if any, will not exceed the total amount paid by you in the preceding
                            twelve (12) months.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="pt-6 flex gap-4">
                        <Link
                            href="/terms"
                            className="rounded-xl px-5 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                            style={{
                                background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                            }}
                        >
                            View Terms of Service
                        </Link>
                        <Link
                            href="/privacy"
                            className="rounded-xl border-2 px-5 py-3 font-bold transition hover:bg-gray-50"
                            style={{ borderColor: brand.primary, color: brand.primary }}
                        >
                            View Privacy Policy
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}
