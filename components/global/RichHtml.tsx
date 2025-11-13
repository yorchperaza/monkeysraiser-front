"use client";

import React, { useEffect, useMemo, useState } from "react";

// ---------- Props ----------
type Props = {
    html?: string | null;
    className?: string;
    invert?: boolean;
    small?: boolean;
    sanitize?: boolean; // default true
};

// ---------- Minimal fallback sanitizer ----------
function fallbackSanitize(input: string): string {
    // Remove <script> tags
    let out = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    // Remove on* event handlers
    out = out.replace(/\son\w+="[^"]*"/gi, "").replace(/\son\w+='[^']*'/gi, "");
    // Neutralize javascript: URLs
    out = out.replace(/\s(href|src)\s*=\s*"(javascript:[^"]*)"/gi, ' $1="#"');
    out = out.replace(/\s(href|src)\s*=\s*'(javascript:[^']*)'/gi, " $1='#'");
    return out;
}

// Narrowing helper for the dynamic import
type DomPurifyModule = typeof import("dompurify");
function hasSanitize(mod: unknown): mod is DomPurifyModule {
    return (
        typeof mod === "object" &&
        mod !== null &&
        "default" in mod &&
        typeof (mod as DomPurifyModule).default?.sanitize === "function"
    );
}

// ---------- Component ----------
export default function RichHtml({
                                     html,
                                     className,
                                     invert = false,
                                     small = false,
                                     sanitize = true,
                                 }: Props) {
    const [purified, setPurified] = useState<string>("");

    const content = useMemo(() => (typeof html === "string" ? html.trim() : ""), [html]);

    useEffect(() => {
        if (!content) {
            setPurified("");
            return;
        }
        if (!sanitize) {
            setPurified(content);
            return;
        }
        let active = true;
        (async () => {
            try {
                let mod: unknown = null;
                try {
                    mod = await import("dompurify");
                } catch {
                    mod = null;
                }
                if (!active) return;

                if (hasSanitize(mod)) {
                    setPurified(
                        mod.default.sanitize(content, {
                            USE_PROFILES: { html: true },
                            ADD_ATTR: ["target", "rel"],
                        }),
                    );
                } else {
                    setPurified(fallbackSanitize(content));
                }
            } catch {
                if (!active) return;
                setPurified(fallbackSanitize(content));
            }
        })();
        return () => {
            active = false;
        };
    }, [content, sanitize]);

    if (!purified) {
        return <div className={small ? "text-sm text-gray-500" : "text-gray-500"}>—</div>;
    }

    return (
        <div
            className={[
                "prose max-w-none",
                small ? "prose-sm" : "prose-base",
                invert ? "prose-invert" : "",
                "prose-a:font-semibold prose-a:underline hover:prose-a:opacity-80",
                "prose-img:rounded-xl prose-img:shadow-sm",
                "prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
                "prose-pre:rounded-xl",
                "prose-table:border prose-th:font-semibold",
                className || "",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: purified }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.target as HTMLElement | null;
                if (!target) return;
                const a = target.closest("a") as HTMLAnchorElement | null;
                if (a && /^https?:/i.test(a.href)) {
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                }
            }}
        />
    );
}
