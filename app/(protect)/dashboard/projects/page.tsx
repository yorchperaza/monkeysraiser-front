// app/dashboard/projects/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import MyProjectsList from "@/components/dashboard/MyProjectsList"; // <- adjust path if needed

export const metadata: Metadata = {
    title: "My Projects — Dashboard",
    description: "Browse, search, and manage all of your projects.",
};

export const revalidate = 0; // always fresh for the dash

export default async function ProjectsPage() {
    // (Optional) read token to decide if you want to show the "Create" CTA conditionally
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    return (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Top header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <nav aria-label="Breadcrumb" className="text-sm">
                        <ol className="flex flex-wrap items-center gap-2 text-gray-500">
                            <li>
                                <Link href="/dashboard" className="hover:text-blue-700">
                                    Dashboard
                                </Link>
                            </li>
                            <li className="select-none text-gray-300">/</li>
                            <li className="font-semibold text-gray-900">Projects</li>
                        </ol>
                    </nav>
                    <h1 className="mt-1 text-2xl font-black text-gray-900">My Projects</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Search, filter, and switch views. Create a new project any time.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/projects/new"
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                        style={{ background: "linear-gradient(135deg,#0066CC,#003D7A)" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        New Project
                    </Link>
                    <Link
                        href="/dashboard/messages"
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:border-blue-400 hover:text-blue-700"
                    >
                        Messages
                    </Link>
                </div>
            </div>

            {/* Main listing (client) */}
            <MyProjectsList
                className="border border-gray-100"
                initialPerPage={12}
            />

            {/* Help footer */}
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
                Pro tip: use the search box for titles/taglines and the “Boosted first” sort to surface promoted projects.
            </div>
        </main>
    );
}
