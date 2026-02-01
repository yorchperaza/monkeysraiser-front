import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search Investors | MonkeysRaiser",
    description: "Find the perfect funding partner from our verified database of VCs, Angels, and accelerators.",
    robots: {
        index: false,    // Don't index this page in search results
        follow: true,    // But follow links to other pages
        googleBot: {
            index: true,  // Allow Google specifically to index
            follow: true,
        },
    },
};

export default function SearchInvestorsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
