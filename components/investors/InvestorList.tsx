"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import InvestorCard, { Investor } from "./InvestorCard";
import { SearchFilters } from "./InvestorFilters";

type SearchResponse = {
    data: Investor[];
    total: number;
    page: number;
    limit: number;
};

function authHeaders(): HeadersInit {
    try {
        const token = localStorage.getItem("auth_token") || "";
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

function ListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex h-32 animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="h-24 w-24 rounded-xl bg-gray-200" />
                    <div className="ml-4 flex-1 space-y-3">
                        <div className="h-4 w-1/3 rounded bg-gray-200" />
                        <div className="h-3 w-3/4 rounded bg-gray-100" />
                        <div className="flex gap-2">
                            <div className="h-5 w-16 rounded-full bg-gray-100" />
                            <div className="h-5 w-16 rounded-full bg-gray-100" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Generate page numbers to display with ellipsis
 * Shows: First, ...5 pages around current..., Last
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
    const pages: (number | "...")[] = [];
    const showAround = 2; // Pages to show before/after current
    
    if (totalPages <= 9) {
        // Show all pages if total <= 9
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - showAround);
    let rangeEnd = Math.min(totalPages - 1, currentPage + showAround);
    
    // Adjust if near start or end
    if (currentPage <= showAround + 2) {
        rangeEnd = Math.min(totalPages - 1, 5);
    }
    if (currentPage >= totalPages - showAround - 1) {
        rangeStart = Math.max(2, totalPages - 4);
    }
    
    // Add ellipsis before range if needed
    if (rangeStart > 2) {
        pages.push("...");
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
    }
    
    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
        pages.push("...");
    }
    
    // Always show last page
    if (totalPages > 1) {
        pages.push(totalPages);
    }
    
    return pages;
}

interface InvestorListProps {
    filters: SearchFilters & { q: string };
    page: number;
    onPageChange: (page: number) => void;
}

export default function InvestorList({ 
    filters,
    page,
    onPageChange
}: InvestorListProps) {
    const [data, setData] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const limit = 20;

    const abortRef = useRef<AbortController | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        
        if (filters.q) params.set("name", filters.q); // Backend uses "name" for search
        if (filters.targetCountries?.length) params.set("targetCountries", JSON.stringify(filters.targetCountries));
        if (filters.firmType?.length) params.set("firmType", JSON.stringify(filters.firmType));
        if (filters.fundingStages?.length) params.set("fundingStages", JSON.stringify(filters.fundingStages));

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/open-vc-investors?${params.toString()}`, {
            headers: { Accept: "application/json", ...authHeaders() },
            signal: ctrl.signal,
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((res: SearchResponse) => {
                setData(res);
                setLoading(false);
            })
            .catch((e) => {
                if (e.name !== "AbortError") {
                    setError("Failed to load investors");
                    setLoading(false);
                }
            });

        return () => ctrl.abort();
    }, [page, filters]); // Re-fetch on page or filter change

    const totalPages = data ? Math.ceil(data.total / limit) : 0;
    const canPrev = page > 1;
    const canNext = page < totalPages;

    const handleGoToPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            startTransition(() => onPageChange(newPage));
        }
    };

    const pageNumbers = getPageNumbers(page, totalPages);

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading && <ListSkeleton />}

            {!loading && data?.data.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                    <div className="text-4xl">🔍</div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">No investors found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
                </div>
            )}

            {!loading && data && data.data.length > 0 && (
                <div className="space-y-4">
                    {data.data.map((inv) => (
                        <InvestorCard key={inv.id} investor={inv} />
                    ))}
                </div>
            )}

            {/* Improved Pagination */}
            {!loading && data && data.total > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
                    {/* Results info */}
                    <p className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
                        <span className="hidden sm:inline">Showing <span className="font-bold text-gray-900">{((page - 1) * limit) + 1}</span> to{" "}
                        <span className="font-bold text-gray-900">{Math.min(page * limit, data.total)}</span> of{" "}</span>
                        <span className="font-bold text-gray-900">{data.total.toLocaleString()}</span> investors
                    </p>
                    
                    {/* Pagination controls */}
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                        {/* First page */}
                        <button
                            onClick={() => handleGoToPage(1)}
                            disabled={!canPrev}
                            title="First page"
                            className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-all ${
                                canPrev 
                                    ? "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-gray-600" 
                                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        {/* Previous page */}
                        <button
                            onClick={() => handleGoToPage(page - 1)}
                            disabled={!canPrev}
                            title="Previous page"
                            className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-all ${
                                canPrev 
                                    ? "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-gray-600" 
                                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        {/* Mobile page indicator */}
                        <span className="sm:hidden px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                            {page} / {totalPages}
                        </span>
                        
                        {/* Page numbers - hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-1 mx-1">
                            {pageNumbers.map((pageNum, idx) => (
                                pageNum === "..." ? (
                                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                                        ⋯
                                    </span>
                                ) : (
                                    <button
                                        key={pageNum}
                                        onClick={() => handleGoToPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                            pageNum === page
                                                ? "bg-blue-600 text-white border border-blue-600 shadow-md"
                                                : "border border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            ))}
                        </div>
                        
                        {/* Next page */}
                        <button
                            onClick={() => handleGoToPage(page + 1)}
                            disabled={!canNext}
                            title="Next page"
                            className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-all ${
                                canNext 
                                    ? "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-gray-600" 
                                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        {/* Last page */}
                        <button
                            onClick={() => handleGoToPage(totalPages)}
                            disabled={!canNext}
                            title="Last page"
                            className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-all ${
                                canNext 
                                    ? "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-gray-600" 
                                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Single page - just show count */}
            {!loading && data && data.total > 0 && totalPages === 1 && (
                <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 text-center">
                        Showing all <span className="font-bold text-gray-900">{data.total}</span> investors
                    </p>
                </div>
            )}
        </div>
    );
}
