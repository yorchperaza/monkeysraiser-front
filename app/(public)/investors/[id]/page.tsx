"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface InvestorDetail {
    id: string;
    fundName: string;
    verified: boolean;
    linkedin: string | null;
    website: string | null;
    description: string | null;
    valueAdd: string | null;
    firmType: string[] | null;
    globalHq: string | null;
    fundingStages: string[] | null;
    checkSizeMin: number | null;
    checkSizeMax: number | null;
    targetCountries: string[] | null;
    team: string | null;
    sourcePage: string | null;
    created: string | null;
    logo: { id: number; url: string } | null;
}

function authHeaders(): HeadersInit {
    try {
        const token = localStorage.getItem("auth_token") || "";
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

function formatCurrency(amount: number | null): string {
    if (!amount) return "N/A";
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
}

function LoadingSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-48 bg-gray-100 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-32 bg-gray-100 rounded-2xl" />
                    <div className="h-32 bg-gray-100 rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                    <div className="h-32 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export default function InvestorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [investor, setInvestor] = useState<InvestorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (!id) return;

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/open-vc-investors/${id}`, {
            headers: { Accept: "application/json", ...authHeaders() },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(res.status === 404 ? "Investor not found" : "Failed to load investor");
                }
                return res.json();
            })
            .then((data: InvestorDetail) => {
                setInvestor(data);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message);
                setLoading(false);
            });
    }, [id]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const logoUrl = investor?.logo?.url
        ? `${backendUrl}${investor.logo.url}`
        : null;

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link
                        href="/search-investors"
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Search
                    </Link>
                    {investor?.website && (
                        <a
                            href={investor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Visit Website
                        </a>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {loading && <LoadingSkeleton />}

                {error && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="text-6xl mb-4">😕</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
                        <p className="text-gray-500 mb-6">The investor you're looking for might not exist.</p>
                        <button
                            onClick={() => router.push("/search-investors")}
                            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Search
                        </button>
                    </div>
                )}

                {!loading && !error && investor && (
                    <>
                        {/* Hero Section */}
                        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
                            {/* Logo */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt={investor.fundName}
                                        width={128}
                                        height={128}
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-gray-300">
                                        {investor.fundName.charAt(0)}
                                    </span>
                                )}
                            </div>

                            {/* Title & Meta */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {investor.fundName}
                                    </h1>
                                    {investor.verified && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Verified
                                        </span>
                                    )}
                                </div>

                                {investor.globalHq && (
                                    <p className="text-gray-500 flex items-center gap-1.5 mb-3">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {investor.globalHq}
                                    </p>
                                )}

                                {/* Quick Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {investor.firmType?.map((type, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                {investor.description && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {investor.description}
                                        </p>
                                    </div>
                                )}

                                {/* Value Add */}
                                {investor.valueAdd && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h2 className="text-lg font-bold text-gray-900 mb-3">What They Offer</h2>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                            {investor.valueAdd}
                                        </p>
                                    </div>
                                )}

                                {/* Funding Stages */}
                                {investor.fundingStages && investor.fundingStages.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h2 className="text-lg font-bold text-gray-900 mb-3">Investment Stages</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {investor.fundingStages.map((stage, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                                                    {stage}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Target Countries */}
                                {investor.targetCountries && investor.targetCountries.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h2 className="text-lg font-bold text-gray-900 mb-3">Target Countries</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {investor.targetCountries.map((country, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                                                    {country}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Check Size */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">Check Size</h3>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(investor.checkSizeMin)} – {formatCurrency(investor.checkSizeMax)}
                                    </p>
                                </div>

                                {/* Location Map */}
                                {investor.globalHq && (
                                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Location
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{investor.globalHq}</p>
                                        </div>
                                        <div className="h-48 w-full">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                loading="lazy"
                                                allowFullScreen
                                                referrerPolicy="no-referrer-when-downgrade"
                                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(investor.globalHq)}`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Contact Links */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900">Connect</h3>
                                    
                                    {investor.website && (
                                        <a
                                            href={investor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">Website</p>
                                                <p className="text-xs text-gray-500 truncate">{investor.website}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    )}

                                    {investor.linkedin && (
                                        <a
                                            href={investor.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">LinkedIn</p>
                                                <p className="text-xs text-gray-500 truncate">View Profile</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    )}
                                </div>

                                {/* Team */}
                                {investor.team && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Team</h3>
                                        <p className="text-gray-600">{investor.team}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
