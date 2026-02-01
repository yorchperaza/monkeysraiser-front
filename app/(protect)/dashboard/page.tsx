"use client";

import React, { useEffect, useState } from "react";
import MeSummaryCard, { MeResponse } from "@/components/dashboard/MeSummaryCard";
import MyProjectsList, { ProjectLite } from "@/components/dashboard/MyProjectsList";
import FavoritesList, { FavoriteProject } from "@/components/dashboard/FavoritesList";
import DashboardPlansWidget, { MyPlan } from "@/components/dashboard/DashboardPlansWidget";


// ---------- Types ----------
type DashboardSummary = {
    user: MeResponse;
    unreadMessagesCount: number;

    projects: { items: ProjectLite[]; total: number };
    favorites: { items: FavoriteProject[]; total: number }; 
    plans: { items: MyPlan[] }; 


    accessRequests: unknown[];
};

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    // const [favorites, setFavorites] = useState<{ items: FavoriteProject[]; total: number } | null>(null); // merged into summary
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
             const token = localStorage.getItem("auth_token");
             if (!token) {
                 setLoading(false);
                 return;
             }

             // 1. Fetch Summary
             const fetchSummary = async () => {
                 const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard/summary`, {
                    headers: { "Authorization": `Bearer ${token}` }
                 });
                 if (!res.ok) throw new Error(`Summary failed: ${res.status}`);
                 const data = await res.json();
                 setSummary(data);
             };


             try {
                // Run in parallel
                await fetchSummary();
             } catch (e) {
                 setError(e instanceof Error ? e.message : "An error occurred");
             } finally {
                 setLoading(false);
             }
        };

        loadDashboard();
    }, []);

    // Create a loading skeleton layout
    if (loading) {
         return (
             <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-6 lg:col-span-2">
                     {/* Summary Card Skeleton */}
                     <div className="h-64 rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex gap-6 animate-pulse">
                            <div className="h-24 w-24 rounded-full bg-gray-100" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 w-1/3 rounded bg-gray-100" />
                                <div className="h-4 w-1/4 rounded bg-gray-100" />
                            </div>
                        </div>
                     </div>
                     {/* Projects Skeleton */}
                     <div className="h-96 rounded-2xl bg-white shadow-sm animate-pulse" />
                </div>
                <div className="space-y-6">
                     {/* Right col skeletons */}
                     <div className="h-40 rounded-2xl bg-white shadow-sm animate-pulse" />
                     <div className="h-96 rounded-2xl bg-white shadow-sm animate-pulse" />
                </div>
             </div>
         );
    }

    if (error) {
         return (
            <div className="p-10 text-center">
                <div className="inline-block rounded-xl bg-red-50 p-4 text-red-600 border border-red-100">
                    <p className="font-bold">Error loading dashboard</p>
                    <p className="text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
         );
    }

    return (
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:gap-8">
            {/* LEFT COLUMN (2/3) */}
            <div className="space-y-6 lg:col-span-2">
                {/* 1. Summary Card */}
                <MeSummaryCard className="w-full" user={summary?.user} />



                {/* 3. My Projects */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">My Projects</h2>
                            <p className="text-sm text-gray-600">Manage your startups and fundraising campaigns.</p>
                        </div>
                    </div>
                    <MyProjectsList 
                        className="w-full" 
                        projects={summary?.projects?.items} 
                    />
                </div>
            </div>

            {/* RIGHT COLUMN (1/3) */}
            <div className="space-y-6">
                {/* 4. Plans Widget */}
                <DashboardPlansWidget plans={summary?.plans?.items} />

                {/* 5. Favorites Widget */}
                {/* 5. Favorites Widget */}
                {/* Use separate favorites state */}
                {/* 5. Favorites Widget */}
                <FavoritesList className="w-full" favorites={summary?.favorites?.items} />
            </div>
        </div>
    );
}
