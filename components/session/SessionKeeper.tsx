'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type KeepOpts = {
    idleMs?: number;
    refreshSkewMs?: number;
    checkEveryMs?: number;
    heartbeatEveryMs?: number;
};

type MLMessage =
    | { type: 'activity'; ts: number }
    | { type: 'token_refreshed' }
    | { type: 'session_expired' };

type RefreshResponse = { token?: string };

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function SessionKeeper({
                                          idleMs = 30 * 60 * 1000,
                                          refreshSkewMs = 2 * 60 * 1000,
                                          checkEveryMs = 30 * 1000,
                                          heartbeatEveryMs = 5 * 60 * 1000,
                                      }: KeepOpts) {
    const router = useRouter();
    const lastActivity = useRef<number>(Date.now());
    const bc = useRef<BroadcastChannel | null>(null);
    const hasRedirected = useRef(false);

    function getAccessExpMs(): number | null {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) return null;
        try {
            const [, payload] = token.split('.');
            const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
            return typeof json.exp === 'number' ? json.exp * 1000 : null;
        } catch {
            return null;
        }
    }

    function isTokenExpired(): boolean {
        const expMs = getAccessExpMs();
        if (!expMs) return true; // No token = expired
        return Date.now() >= expMs;
    }

    function redirectToLogin(): void {
        if (hasRedirected.current) return;
        hasRedirected.current = true;
        
        // Clear tokens
        try {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
        } catch {}
        
        // Notify other tabs
        bc.current?.postMessage({ type: 'session_expired' } satisfies MLMessage);
        
        // Redirect to login
        router.push('/login');
    }

    async function refreshIfNeeded(): Promise<void> {
        const expMs = getAccessExpMs();
        
        // If no token or already expired, redirect to login
        if (!expMs || Date.now() >= expMs) {
            redirectToLogin();
            return;
        }

        const now = Date.now();
        const inactive = now - lastActivity.current > idleMs;
        const isNearExpiry = expMs - now <= refreshSkewMs;

        if (!inactive && isNearExpiry) {
            try {
                const res = await fetch(`${BACKEND}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });

                const json = (await res
                    .json()
                    .catch<Partial<RefreshResponse>>(() => ({}))) as Partial<RefreshResponse>;

                if (res.ok && json.token) {
                    if (localStorage.getItem('auth_token')) {
                        localStorage.setItem('auth_token', json.token);
                    } else {
                        sessionStorage.setItem('auth_token', json.token);
                    }
                    bc.current?.postMessage({ type: 'token_refreshed' } satisfies MLMessage);
                } else if (res.status === 401) {
                    // Refresh failed, session is invalid
                    redirectToLogin();
                }
            } catch {
                // Network error - check if token is now expired
                if (isTokenExpired()) {
                    redirectToLogin();
                }
            }
        }
    }

    function heartbeat(): void {
        try {
            const url = `${BACKEND}/auth/heartbeat`;
            const ok = typeof navigator.sendBeacon === 'function' ? navigator.sendBeacon(url) : false;
            if (!ok) {
                void fetch(url, { method: 'POST', keepalive: true, credentials: 'include' }).catch(() => {});
            }
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        const touch = (): void => {
            lastActivity.current = Date.now();
            bc.current?.postMessage({ type: 'activity', ts: lastActivity.current } satisfies MLMessage);
        };
        const onVisibility = (): void => {
            if (!document.hidden) {
                touch();
                // Check token expiry when tab becomes visible
                if (isTokenExpired()) {
                    redirectToLogin();
                }
            }
        };
        const onFocus = (): void => {
            touch();
            // Check token expiry on focus
            if (isTokenExpired()) {
                redirectToLogin();
            }
        };

        // No `any` here: EventListener is `(evt: Event) => void`
        const handlers: Array<[keyof DocumentEventMap, EventListener]> = [
            ['visibilitychange', onVisibility as EventListener],
            ['keydown', touch as EventListener],
            ['pointerdown', touch as EventListener],
            ['scroll', touch as EventListener],
        ];
        handlers.forEach(([evt, fn]) => document.addEventListener(evt, fn, { passive: true }));

        window.addEventListener('focus', onFocus);

        bc.current = 'BroadcastChannel' in window ? new BroadcastChannel('ml-session') : null;
        bc.current?.addEventListener('message', (ev: MessageEvent<MLMessage>) => {
            if (ev.data?.type === 'activity') {
                lastActivity.current = Math.max(lastActivity.current, Number(ev.data.ts) || Date.now());
            }
            if (ev.data?.type === 'session_expired') {
                // Another tab detected session expiry, redirect this tab too
                redirectToLogin();
            }
            // 'token_refreshed' -> no-op
        });

        // Initial check - if token is already expired, redirect immediately
        if (isTokenExpired()) {
            redirectToLogin();
        }

        const t1 = window.setInterval(refreshIfNeeded, checkEveryMs);
        const t2 = heartbeatEveryMs > 0 ? window.setInterval(heartbeat, heartbeatEveryMs) : null;

        touch(); // count initial navigation as activity

        return () => {
            handlers.forEach(([evt, fn]) => document.removeEventListener(evt, fn));
            window.removeEventListener('focus', onFocus);
            window.clearInterval(t1);
            if (t2) window.clearInterval(t2);
            bc.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkEveryMs, heartbeatEveryMs, idleMs, refreshSkewMs]);

    return null;
}
