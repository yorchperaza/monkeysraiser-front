import "react-quill-new/dist/quill.snow.css";
import "../globals.css";
import React from "react";
import type { Metadata } from "next";
import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";

export const metadata: Metadata = {
    title: "MonkeysRaiser",
    description: "Connect innovative founders with serious investors.",
};

export default function PublicLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="
                min-h-screen flex flex-col antialiased text-gray-900
                text-[14px] leading-[1.5] md:text-[15px] md:leading-[1.5]
                bg-white
            "
        >
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
