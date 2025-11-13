// middleware.ts (at project root or src/middleware.ts)
import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Pages that require auth:
    const protectedPrefixes = ["/dashboard", "/me", "/messages", "/projects/new"];

    const isProtected = protectedPrefixes.some((p) =>
        pathname.startsWith(p)
    );

    if (isProtected) {
        // you said you're storing token in localStorage,
        // BUT middleware runs on the server (no access to localStorage)
        // so we ALSO need a cookie fallback.
        const token = req.cookies.get("token")?.value;

        if (!token) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = "/login";
            // add ?from=/original/path
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Tell Next.js which paths run the middleware:
export const config = {
    matcher: ["/dashboard/:path*", "/me/:path*", "/messages/:path*", "/projects/new"],
};
