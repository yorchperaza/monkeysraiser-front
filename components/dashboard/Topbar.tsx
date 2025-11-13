// components/dashboard/Topbar.tsx
"use client";

import React from "react";

type TopbarProps = {
    title?: string;
    subtitle?: string;
    ctaHref?: string;
    ctaLabel?: string;
    rightSlot?: React.ReactNode;
};

export default function Topbar({
                                   title = "Dashboard",
                                   subtitle,
                                   ctaHref = "/dashboard/projects/new",
                                   ctaLabel = "New Project",
                                   rightSlot,
                               }: TopbarProps) {
    return (
        <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="flex items-center justify-between px-8 py-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                </div>

                {rightSlot ?? (
                    <a
                        href={ctaHref}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                        style={{ background: "linear-gradient(135deg, #0066CC, #003D7A)" }}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        {ctaLabel}
                    </a>
                )}
            </div>
        </header>
    );
}
