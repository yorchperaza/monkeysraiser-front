import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import ContentShell from "@/components/dashboard/ContentShell";
import { DashboardUIProvider } from "@/context/DashboardUIContext";
import SessionKeeper from "@/components/session/SessionKeeper";
import SessionGuard from "@/components/session/SessionGuard";

export const metadata: Metadata = {
    title: "Dashboard | MonkeysRaiser",
    description: "Manage your raise, updates, and investor pipeline.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardUIProvider>
            <SessionKeeper
                idleMs={30 * 60 * 1000}
                refreshSkewMs={2 * 60 * 1000}
                checkEveryMs={30 * 1000}
                heartbeatEveryMs={5 * 60 * 1000}
            />
            <SessionGuard>
                <Sidebar />
                <ContentShell>{children}</ContentShell>
            </SessionGuard>
        </DashboardUIProvider>
    );
}
