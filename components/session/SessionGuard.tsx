'use client';

import React, { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

type GuardState = "checking" | "authed" | "guest";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<GuardState>("checking");

    useEffect(() => {
        let cancelled = false;

        const isTokenExpired = (token: string): boolean => {
            try {
                const [, payload] = token.split(".");
                const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
                return !decoded.exp || Date.now() >= decoded.exp * 1000;
            } catch {
                return true;
            }
        };

        const checkAuth = async () => {
            const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
            if (token && !isTokenExpired(token)) {
                if (!cancelled) setState("authed");
                return;
            }
            try {
                const res = await fetch(`${BACKEND}/auth/heartbeat`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                });
                if (!cancelled) setState(res.ok ? "authed" : "guest");
            } catch {
                if (!cancelled) setState("guest");
            }
        };

        void checkAuth();
        return () => { cancelled = true; };
    }, []);

    // ⬇️ Navigate in an effect, NOT during render
    useEffect(() => {
        if (state === "guest") {
            startTransition(() => router.replace("/login"));
        }
    }, [state, router]);

    if (state !== "authed") return null; // "checking" or "guest" → render nothing

    return <>{children}</>;
}
