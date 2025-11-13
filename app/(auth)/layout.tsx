"use client";

import "react-quill-new/dist/quill.snow.css";
import "../globals.css";
import React from "react";
import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";

const brand = {
    lightBlue: "#EBF5FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    white: "#FFFFFF",
    purple: "#6B5CE7",
};

export default function PublicLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <>
        {/* Site chrome */}
        <Header />

        {/* Page content area */}
        <div className="relative z-10 flex flex-1 py-10 sm:py-16">
            {children}
        </div>

        <Footer />

        {/* blob animation keyframes (global) */}
        <style jsx global>{`
                    @keyframes blob {
                        0%,
                        100% {
                            transform: translate(0, 0) scale(1);
                        }
                        33% {
                            transform: translate(30px, -50px) scale(1.1);
                        }
                        66% {
                            transform: translate(-20px, 20px) scale(0.9);
                        }
                    }
                    .animate-[blob_7s_infinite] {
                        animation: blob 7s infinite;
                    }
                    .animate-[blob_7s_infinite_2s] {
                        animation: blob 7s infinite 2s;
                    }
                    .animate-[blob_7s_infinite_4s] {
                        animation: blob 7s infinite 4s;
                    }
                    .animate-[blob_7s_infinite_6s] {
                        animation: blob 7s infinite 6s;
                    }
                `}</style>
        </>
    );
}
