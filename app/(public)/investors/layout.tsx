import { Metadata } from "next";

export const metadata: Metadata = {
    title: "For Investors | Find Promising Startups to Fund | MonkeysRaiser",
    description: "Access curated deal flow from vetted startups seeking funding. Connect with founders in AI, FinTech, SaaS, and more. Join 500+ investors already on the platform.",
    keywords: [
        "invest in startups",
        "startup deal flow",
        "angel investing platform",
        "VC deal sourcing",
        "early stage investments",
        "startup investment opportunities",
        "founder investor matching",
        "seed stage startups",
        "Series A opportunities",
        "tech startup investing",
    ],
    openGraph: {
        title: "For Investors | Find Promising Startups | MonkeysRaiser",
        description: "Access curated deal flow from vetted startups. Connect with founders in AI, FinTech, SaaS & more. Join 500+ investors.",
        type: "website",
        url: "https://monkeysraiser.com/investors",
        siteName: "MonkeysRaiser",
        images: [
            {
                url: "https://monkeysraiser.com/og-for-investors.jpg",
                width: 1200,
                height: 630,
                alt: "MonkeysRaiser - For Investors",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "For Investors | Find Promising Startups | MonkeysRaiser",
        description: "Access curated deal flow from vetted startups. Connect with founders in AI, FinTech, SaaS & more.",
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://monkeysraiser.com/investors",
    },
};

export default function InvestorsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
