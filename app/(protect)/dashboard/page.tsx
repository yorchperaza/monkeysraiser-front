"use client";

import React from "react";
import Link from "next/link";
import FavoritesList from "@/components/dashboard/FavoritesList";
import MyProjectsList from "@/components/dashboard/MyProjectsList";
import DashboardConversations from "@/components/dashboard/DashboardConversations";
import MeSummaryCard from "@/components/dashboard/MeSummaryCard";
import DashboardPlansWidget from "@/components/dashboard/DashboardPlansWidget";
import ProjectAccessPanel from "@/components/dashboard/ProjectAccessPanel";
import MyProjectAccessPanel from "@/components/dashboard/MyProjectAccessPanel";
import {useParams} from "next/navigation";

export default function Dashboard() {
    const { hash } = useParams<{ hash: string }>();

    return (
        <main className="min-h-screen bg-gray-50">
            {/* ===== Top Bar ===== */}
            <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-600">Manage your projects and favorites</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/projects/new"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
                        >
                            + New Project
                        </Link>
                    </div>
                </div>
            </header>

            {/* ===== Main Content ===== */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* ===== Left Column ===== */}
                    <div className="space-y-8">
                        {/* User Summary */}
                        <MeSummaryCard />

                        {/* Projects */}
                        <section aria-label="My Projects">
                            <h2 className="mb-3 text-lg font-black text-gray-900">My Projects</h2>
                            <MyProjectsList initialPerPage={12} />
                        </section>
                    </div>

                    {/* ===== Right Column ===== */}
                    <div className="space-y-8">
                        {/* Plans */}
                        <section aria-label="Plans">
                            <h2 className="mb-3 text-lg font-black text-gray-900">Plans</h2>
                            <DashboardPlansWidget />
                        </section>

                        {/* Project Access */}
                        <section aria-label="Project Access">
                            <h2 className="mb-3 text-lg font-black text-gray-900">Project Access</h2>
                            <ProjectAccessPanel className="mb-10" />
                            <MyProjectAccessPanel />
                        </section>
                        {/* Conversations */}
                        <section aria-label="Conversations">
                            <h2 className="mb-3 text-lg font-black text-gray-900">Recent Conversations</h2>
                            <DashboardConversations />
                        </section>

                        {/* Favorites */}
                        <section aria-label="Favorites">
                            <h2 className="mb-3 text-lg font-black text-gray-900">Favorites</h2>
                            <FavoritesList initialPerPage={12} />
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
