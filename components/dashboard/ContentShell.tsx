"use client";

import React from "react";
import { useDashboardUI } from "@/context/DashboardUIContext";

export default function ContentShell({ children }: { children: React.ReactNode }) {
    const { sidebarOpen } = useDashboardUI();

    return (
        <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-20"}`}>
            <main>{children}</main>
        </div>
    );
}
