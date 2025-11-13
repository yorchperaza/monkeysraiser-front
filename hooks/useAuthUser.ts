// app/hooks/useAuthUser.ts
"use client";

import { useEffect, useState } from "react";

type UserLike = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
};

export function useAuthUser() {
    const [user, setUser] = useState<UserLike | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // 1. read token from localStorage (fast client check)
                const token =
                    typeof window !== "undefined"
                        ? localStorage.getItem("auth_token")
                        : null;

                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // 2. ask backend who I am
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    // token invalid
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                // shape this into what Header expects:
                setUser({
                    name: data.name ?? data.full_name ?? null,
                    email: data.email ?? null,
                    image: data.avatar_url ?? null,
                    role: data.role ?? null,
                });
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return { user, loading };
}
