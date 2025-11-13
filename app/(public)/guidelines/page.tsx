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

type GuidelineSectionProps = {
    id: string;
    title: string;
    children: React.ReactNode;
};

function GuidelineSection({ id, title, children }: GuidelineSectionProps) {
    return (
        <section id={id} className="scroll-m-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-3 text-xl font-black text-gray-900">{title}</h2>
            <div className="space-y-2 text-sm text-gray-700">{children}</div>
        </section>
    );
}

export default function GuidelinesPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero */}
            <section
                className="relative overflow-hidden"
                style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}
            >
                <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-6 py-20">
                    <div className="grid items-start gap-10 md:grid-cols-[1.4fr,1fr]">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                                Listing & Community Guidelines
                            </div>
                            <h1 className="mb-3 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
                                Guidelines for using MonkeysRaiser
                            </h1>
                            <p className="mb-4 text-sm md:text-base text-gray-600">
                                These guidelines help keep MonkeysRaiser useful, trustworthy, and fair for founders and
                                investors. Every project, profile, and message on the platform is expected to follow them,
                                in addition to our{" "}
                                <Link href="/terms" className="font-semibold text-blue-700 hover:underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="font-semibold text-blue-700 hover:underline">
                                    Privacy Policy
                                </Link>
                                .
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3 text-xs md:text-sm">
                                <Link
                                    href="/pricing"
                                    className="rounded-xl px-5 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                    }}
                                >
                                    View Pricing & Plans
                                </Link>
                                <Link
                                    href="/projects"
                                    className="rounded-xl border-2 bg-white px-5 py-3 font-bold text-gray-800 transition hover:bg-gray-50"
                                    style={{ borderColor: brand.primary }}
                                >
                                    Browse Projects
                                </Link>
                            </div>
                        </div>

                        {/* Quick nav card */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                On this page
                            </div>
                            <nav className="space-y-1 text-sm">
                                <a href="#who" className="block text-gray-700 hover:text-blue-700">
                                    • Who can list on MonkeysRaiser
                                </a>
                                <a href="#project-criteria" className="block text-gray-700 hover:text-blue-700">
                                    • Project eligibility & criteria
                                </a>
                                <a href="#profile-content" className="block text-gray-700 hover:text-blue-700">
                                    • Profile & content guidelines
                                </a>
                                <a href="#metrics" className="block text-gray-700 hover:text-blue-700">
                                    • Traction, metrics & financials
                                </a>
                                <a href="#communication" className="block text-gray-700 hover:text-blue-700">
                                    • Communication & behavior
                                </a>
                                <a href="#review" className="block text-gray-700 hover:text-blue-700">
                                    • Review, moderation & removal
                                </a>
                                <a href="#legal" className="block text-gray-700 hover:text-blue-700">
                                    • Legal & compliance notes
                                </a>
                                <a href="#best-practices" className="block text-gray-700 hover:text-blue-700">
                                    • Best practices for founders
                                </a>
                                <a href="#faq" className="block text-gray-700 hover:text-blue-700">
                                    • FAQs
                                </a>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row">
                    <div className="flex-1 space-y-6">
                        <GuidelineSection id="who" title="1. Who can list on MonkeysRaiser">
                            <p>
                                MonkeysRaiser is designed for startup and scale-up projects that are actively building,
                                validating, or scaling a product or service. In general, you should list your project if:
                            </p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>You are a founder, co-founder, or authorized representative of the project.</li>
                                <li>
                                    The project has a clear problem, solution, target customer, and business model (or a
                                    credible path to one).
                                </li>
                                <li>Your project is legal in the jurisdiction(s) where you operate.</li>
                                <li>
                                    You are willing to answer investor questions honestly and provide supporting
                                    documentation when requested.
                                </li>
                            </ul>
                            <p className="pt-1 text-xs text-gray-500">
                                Idea-stage founders can still list under our Community Listing plan, as long as the
                                information is honest and not misleading.
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="project-criteria" title="2. Project eligibility & listing criteria">
                            <p>To keep the directory high-signal for investors, we focus on projects that meet at least one of these:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Technology or product-driven businesses (software, hardware, deep tech, etc.).</li>
                                <li>Startups with scalable business models vs. purely local/one-off projects.</li>
                                <li>Clear fundraising goals (pre-seed, seed, Series A+, or similar).</li>
                                <li>Evidence of progress: prototype, MVP, pilots, paying users, or early revenue.</li>
                            </ul>
                            <p className="pt-2">
                                We may decline or remove listings that are:
                            </p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Primarily MLM, get-rich-quick, or misleading financial schemes.</li>
                                <li>Involve illegal products, hate speech, or discriminatory practices.</li>
                                <li>Submitting knowingly false, plagiarized, or fabricated information.</li>
                            </ul>
                        </GuidelineSection>

                        <GuidelineSection id="profile-content" title="3. Profile, media & content guidelines">
                            <p>Your project profile should be clear, honest, and respectful. Please:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Use accurate company and founder names—no impersonation or fake identities.</li>
                                <li>Avoid exaggerated or absolute claims such as “guaranteed returns” or “zero risk”.</li>
                                <li>Provide a realistic overview of stage, traction, and roadmap.</li>
                                <li>Ensure images, logos, and media are yours or properly licensed for use.</li>
                                <li>Keep descriptions professional and avoid offensive or discriminatory language.</li>
                            </ul>
                            <p className="pt-2">
                                Decks, pitch videos, and attachments should not include sensitive personal information
                                unless strictly necessary (e.g. avoid sharing passport numbers, full IDs, or bank login
                                details in public materials).
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="metrics" title="4. Traction, metrics & financial information">
                            <p>
                                Investors rely on your metrics to understand risk and potential. All traction and
                                financial information must be:
                            </p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Honest and not intentionally misleading.</li>
                                <li>As up to date as reasonably possible when you publish or update your profile.</li>
                                <li>Clearly labeled as historical, forecast, or target metrics.</li>
                            </ul>
                            <p className="pt-2">Good examples of transparent metrics:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>“MRR: $12,500 (as of September 2025)”</li>
                                <li>“Pilot with 3 paying customers, contract value ~$5,000 each per year.”</li>
                                <li>“Forecasted runway: 10 months assuming current burn rate.”</li>
                            </ul>
                            <p className="pt-2 text-xs text-gray-500">
                                MonkeysRaiser does not provide investment advice or verify every claim. Investors should
                                always perform their own due diligence.
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="communication" title="5. Communication, messaging & behavior">
                            <p>When you use messaging or interact with other users, you agree to:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Be respectful, professional, and concise.</li>
                                <li>Avoid spam, mass unsolicited pitching, or harassment.</li>
                                <li>Respect privacy and do not share private messages publicly without consent.</li>
                                <li>Never send abusive, threatening, or discriminatory content.</li>
                            </ul>
                            <p className="pt-2">
                                Investors are free to decline introductions, pass on deals, or stop conversations at
                                any time. Founders should avoid repeated follow-ups if someone has clearly declined.
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="review" title="6. Review, moderation & removal of content">
                            <p>
                                To keep the platform healthy, MonkeysRaiser may review listings or behavior and take
                                action where needed. This can include:
                            </p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Requesting clarification or edits to your profile or metrics.</li>
                                <li>Temporarily hiding a project while issues are investigated.</li>
                                <li>Removing content that violates these guidelines or our Terms.</li>
                                <li>Suspending or closing accounts in case of serious or repeated violations.</li>
                            </ul>
                            <p className="pt-2 text-xs text-gray-500">
                                We generally aim to notify you if we need to remove or edit content, unless doing so
                                would create legal or safety concerns.
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="legal" title="7. Legal & compliance notes">
                            <p>
                                MonkeysRaiser is a platform for showcasing projects and facilitating introductions. We do
                                <span className="font-semibold"> not </span>:
                            </p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Provide investment, legal, or tax advice.</li>
                                <li>Act as a broker, dealer, or financial advisor.</li>
                                <li>Guarantee that funding will be secured.</li>
                                <li>Guarantee the accuracy or completeness of every project’s information.</li>
                            </ul>
                            <p className="pt-2">
                                Founders are responsible for ensuring their fundraising activities comply with local
                                laws and any applicable securities regulations. Investors are responsible for their own
                                due diligence and decision-making.
                            </p>
                            <p className="pt-2 text-xs text-gray-500">
                                For more details, please review our{" "}
                                <Link href="/terms" className="font-semibold text-blue-700 hover:underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/legal/disclaimer" className="font-semibold text-blue-700 hover:underline">
                                    Legal Disclaimer
                                </Link>
                                .
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="best-practices" title="8. Best practices for founders">
                            <p>To give investors a clear picture and increase your chances of interest:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Complete all key fields in your project profile (team, traction, stage, capital sought).</li>
                                <li>Keep your deck concise, visual, and easy to skim (10–15 slides is usually enough).</li>
                                <li>Update your listing whenever you hit a major milestone or raise new capital.</li>
                                <li>Use the same tone you’d use in a professional investor email or pitch call.</li>
                                <li>
                                    If you use{" "}
                                    <Link href="/pricing" className="font-semibold text-blue-700 hover:underline">
                                        Spotlight Boost
                                    </Link>{" "}
                                    or{" "}
                                    <Link href="/pricing" className="font-semibold text-blue-700 hover:underline">
                                        Investor Accelerator
                                    </Link>
                                    , coordinate with our team to make assets as strong as possible.
                                </li>
                            </ul>
                            <p className="pt-2">
                                Consider also subscribing to the{" "}
                                <Link href="/newsletter" className="font-semibold text-blue-700 hover:underline">
                                    MonkeysRaiser newsletter
                                </Link>{" "}
                                to see how other startups are presenting their progress and updates.
                            </p>
                        </GuidelineSection>

                        <GuidelineSection id="faq" title="9. Frequently asked questions">
                            <h3 className="text-sm font-semibold text-gray-900">Is listing my project free?</h3>
                            <p>
                                Yes, the Community Listing plan is free and has no time limit. Paid options like
                                Spotlight Boost or Investor Accelerator provide additional visibility and support.
                                Details are on our{" "}
                                <Link href="/pricing" className="font-semibold text-blue-700 hover:underline">
                                    pricing page
                                </Link>
                                .
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-gray-900">
                                Do you verify every startup or claim?
                            </h3>
                            <p>
                                We may review profiles and perform basic checks, but we do not independently audit every
                                metric or statement. Investors should always perform their own due diligence.
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-gray-900">
                                Can my project be removed?
                            </h3>
                            <p>
                                Yes. We reserve the right to remove or hide projects that violate our guidelines,
                                include illegal or harmful content, or appear intentionally misleading.
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-gray-900">
                                How often can I update my profile?
                            </h3>
                            <p>
                                As often as you need. We encourage founders to keep their fundraising status, traction,
                                and milestones up to date so investors have a current view.
                            </p>

                            <h3 className="mt-4 text-sm font-semibold text-gray-900">
                                Who do I contact if I see something suspicious?
                            </h3>
                            <p>
                                If you see content that seems fraudulent, abusive, or unsafe, please contact our support
                                team or use any reporting tools available in the platform. Include links or screenshots
                                if possible so we can review it quickly.
                            </p>
                        </GuidelineSection>
                    </div>

                    {/* Side panel / CTA */}
                    <aside className="flex w-full max-w-xs flex-col gap-4 self-start lg:sticky lg:top-24">
                        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Ready to list your project?
                            </div>
                            <p className="mb-4 text-sm text-gray-700">
                                Start with a free Community Listing, then upgrade to Spotlight or Accelerator when
                                you’re ready to expand investor reach.
                            </p>
                            <Link
                                href="/register"
                                className="mb-2 block rounded-xl px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                                }}
                            >
                                Create Founder Account
                            </Link>
                            <Link
                                href="/pricing"
                                className="block rounded-xl border-2 bg-white px-5 py-3 text-center text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                                style={{ borderColor: brand.primary }}
                            >
                                View All Plans
                            </Link>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-5 text-xs text-gray-600 shadow-sm">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Short version
                            </div>
                            <p>
                                Be honest, be respectful, and keep information accurate. MonkeysRaiser is here to help
                                founders and investors connect—not to replace your own judgment, legal advice, or due
                                diligence.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
