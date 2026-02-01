import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Find Investors for Your Startup | VC, Angel & Accelerator Database | MonkeysRaiser",
    description: "Search 3,000+ verified VCs, angel investors, and accelerators. Filter by funding stage, check size, industry focus, and location. Connect with investors actively looking to fund startups like yours.",
    keywords: [
        "startup investors",
        "venture capital search",
        "find VC for startup",
        "angel investors database",
        "seed funding investors",
        "Series A investors",
        "startup accelerators",
        "investor directory",
        "fundraising platform",
        "startup funding",
    ],
    openGraph: {
        title: "Find Investors for Your Startup | MonkeysRaiser",
        description: "Search 3,000+ verified VCs, angels & accelerators. Filter by stage, check size & location. Free for founders.",
        type: "website",
        url: "https://monkeysraiser.com/search-investors",
        siteName: "MonkeysRaiser",
        images: [
            {
                url: "https://monkeysraiser.com/og-investors.jpg",
                width: 1200,
                height: 630,
                alt: "MonkeysRaiser - Find Investors Database",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Find Investors for Your Startup | MonkeysRaiser",
        description: "Search 3,000+ verified VCs, angels & accelerators. Filter by stage, check size & location.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    alternates: {
        canonical: "https://monkeysraiser.com/search-investors",
    },
};

export default function SearchInvestorsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
