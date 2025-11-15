import "react-quill-new/dist/quill.snow.css";
import "./globals.css";
import React from "react";
import CookiesBanner from "@/components/misc/CookiesBanner"
import AnalyticsGate from "@/components/misc/AnalyticsGate"
import SupportBubble from "@/components/support/SupportBubble";

export const metadata = {
    title: "MonkeysRaiser",
    description: "Connect innovative founders with serious investors.",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full">
        <body
            className={`
          min-h-screen flex flex-col antialiased text-gray-900
          text-[14px] leading-[1.5] md:text-[15px] md:leading-[1.5]
        `}
        >
        <main className="flex-1">{children}</main>
        <CookiesBanner />
        <AnalyticsGate gaMeasurementId={process.env.NEXT_PUBLIC_GA_ID} />
        <SupportBubble tokenStorageKey="auth_token" />
        </body>
        </html>
    );
}
