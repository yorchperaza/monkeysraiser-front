"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ViewLimitModal from "./ViewLimitModal";

const VIEW_LIMIT = 5;
const STORAGE_KEY = "investor_views";

// Types matching OpenVcInvestor entity structure from backend
export type Investor = {
    id: string;
    fundName: string;
    firmType?: string | null;
    targetCountries?: string | null;
    fundingStages?: string | null;
    checkSizeMin?: number | null;
    checkSizeMax?: number | null;
    logo?: { url: string | null } | null;
    website?: string | null;
    description?: string | null;
};

function formatCurrency(n: number) {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n}`;
}

function parseJsonField(field: string | null | undefined): string[] {
    if (!field) return [];
    try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function isLoggedIn(): boolean {
    try {
        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
        if (!token) return false;
        // Check if token is expired
        const [, payload] = token.split(".");
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return decoded.exp && Date.now() < decoded.exp * 1000;
    } catch {
        return false;
    }
}

function getViewCount(): number {
    try {
        const views = localStorage.getItem(STORAGE_KEY);
        return views ? parseInt(views, 10) : 0;
    } catch {
        return 0;
    }
}

function incrementViewCount(): number {
    try {
        const current = getViewCount();
        const newCount = current + 1;
        localStorage.setItem(STORAGE_KEY, String(newCount));
        return newCount;
    } catch {
        return 0;
    }
}

export default function InvestorCard({ investor }: { investor: Investor }) {
    const [showModal, setShowModal] = useState(false);
    const [canView, setCanView] = useState(true);
    
    const img = mediaUrl(investor.logo?.url);
    const countries = parseJsonField(investor.targetCountries);
    const stages = parseJsonField(investor.fundingStages);
    const types = parseJsonField(investor.firmType);
    const letter = (investor.fundName?.[0] || "I").toUpperCase();

    // Check view limit on mount
    useEffect(() => {
        if (isLoggedIn()) {
            setCanView(true);
        } else {
            setCanView(getViewCount() < VIEW_LIMIT);
        }
    }, []);

    const handleViewClick = (e: React.MouseEvent) => {
        // If logged in, allow unlimited views
        if (isLoggedIn()) {
            return; // Let the link navigate normally
        }
        
        const currentViews = getViewCount();
        
        // If already at or over limit, show modal and prevent navigation
        if (currentViews >= VIEW_LIMIT) {
            e.preventDefault();
            setShowModal(true);
            return;
        }
        
        // Increment view count
        const newCount = incrementViewCount();
        
        // If this view puts them at the limit, they can still view this one
        // but next time they'll see the modal
        if (newCount >= VIEW_LIMIT) {
            setCanView(false);
        }
    };

    const handleWebsiteClick = (e: React.MouseEvent) => {
        // If logged in, allow unlimited access
        if (isLoggedIn()) {
            return; // Let the link open normally
        }
        
        const currentViews = getViewCount();
        
        // If already at or over limit, show modal and prevent navigation
        if (currentViews >= VIEW_LIMIT) {
            e.preventDefault();
            setShowModal(true);
            return;
        }
        
        // Increment view count
        const newCount = incrementViewCount();
        
        if (newCount >= VIEW_LIMIT) {
            setCanView(false);
        }
    };

    return (
        <>
            <div className="group flex flex-col md:flex-row items-start md:items-stretch gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
                {/* Logo */}
                <div className="relative h-24 w-24 md:h-24 md:w-40 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={img}
                            alt={investor.fundName}
                            className="h-full w-full object-contain p-2 transition group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-black text-gray-300">
                            {letter}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 w-full">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="line-clamp-1 text-lg font-bold text-gray-900">
                                {investor.fundName}
                            </h3>
                            {investor.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                    {investor.description}
                                </p>
                            )}
                        </div>
                        {types.length > 0 && (
                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                {types[0]}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* Check Size */}
                        {(investor.checkSizeMin || investor.checkSizeMax) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                💰 {investor.checkSizeMin ? formatCurrency(investor.checkSizeMin) : '0'} 
                                {' - '}
                                {investor.checkSizeMax ? formatCurrency(investor.checkSizeMax) : '∞'}
                            </span>
                        )}

                        {/* Countries */}
                        {countries.slice(0, 3).map((c) => (
                            <span key={c} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                📍 {c}
                            </span>
                        ))}
                        {countries.length > 3 && (
                            <span className="text-xs text-gray-500">+{countries.length - 3}</span>
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {stages.map((s) => (
                            <span key={s} className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex w-full md:w-auto md:flex-col items-center md:items-end justify-between md:justify-start gap-2 mt-2 md:mt-0">
                    <Link
                        href={`/investors/${investor.id}`}
                        onClick={handleViewClick}
                        className="w-full md:w-auto whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md text-center"
                        style={{ background: "#0066CC" }}
                    >
                        View Details
                    </Link>
                    {investor.website && (
                        <a
                            href={investor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleWebsiteClick}
                            className="w-full md:w-auto whitespace-nowrap rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 text-center"
                        >
                            Website ↗
                        </a>
                    )}
                </div>
            </div>

            {/* View Limit Modal */}
            <ViewLimitModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}

// Inline utils if not imported
function mediaUrl(u?: string | null): string {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
    const path = (u || "").replace(/^\/+/, "");
    return base && path ? `${base}/${path}` : "";
}
