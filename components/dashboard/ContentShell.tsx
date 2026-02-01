"use client";

import React from "react";
import { useDashboardUI } from "@/context/DashboardUIContext";

export default function ContentShell({ children }: { children: React.ReactNode }) {
    const { sidebarOpen, isMobile } = useDashboardUI();

    // On mobile: add top padding for the fixed header bar (h-14 = 56px = pt-14)
    // On desktop: left padding based on sidebar state
    const paddingClass = isMobile 
        ? "pt-14" 
        : sidebarOpen 
            ? "md:pl-64" 
            : "md:pl-20";

    return (
        <div className={`min-h-screen flex flex-col transition-all duration-300 ${paddingClass}`}>
            <main>{children}</main>
        </div>
    );
}
