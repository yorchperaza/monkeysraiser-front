"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type DashboardUIState = {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebar: (open: boolean) => void;
    isMobile: boolean;
};

const DashboardUIContext = createContext<DashboardUIState | null>(null);

export function DashboardUIProvider({ children }: { children: React.ReactNode }) {
    // Default to closed on mobile, open on desktop
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(true); // SSR-safe default

    // Detect mobile breakpoint (768px = md)
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        
        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            const isDesktop = e.matches;
            setIsMobile(!isDesktop);
            // Auto-open sidebar on desktop, close on mobile
            setSidebarOpen(isDesktop);
        };
        
        // Initial check
        handleChange(mq);
        
        // Listen for changes
        mq.addEventListener("change", handleChange);
        return () => mq.removeEventListener("change", handleChange);
    }, []);

    const value = useMemo(
        () => ({
            sidebarOpen,
            toggleSidebar: () => setSidebarOpen((v) => !v),
            setSidebar: (open: boolean) => setSidebarOpen(open),
            isMobile,
        }),
        [sidebarOpen, isMobile]
    );

    return <DashboardUIContext.Provider value={value}>{children}</DashboardUIContext.Provider>;
}

export function useDashboardUI() {
    const ctx = useContext(DashboardUIContext);
    if (!ctx) {
        throw new Error("useDashboardUI must be used within DashboardUIProvider");
    }
    return ctx;
}
