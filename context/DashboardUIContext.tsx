"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type DashboardUIState = {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebar: (open: boolean) => void;
};

const DashboardUIContext = createContext<DashboardUIState | null>(null);

export function DashboardUIProvider({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const value = useMemo(
        () => ({
            sidebarOpen,
            toggleSidebar: () => setSidebarOpen((v) => !v),
            setSidebar: (open: boolean) => setSidebarOpen(open),
        }),
        [sidebarOpen]
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
