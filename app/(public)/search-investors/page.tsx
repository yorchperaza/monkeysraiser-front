"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import InvestorFilters, {
  SearchFilters,
} from "@/components/investors/InvestorFilters";
import InvestorList from "@/components/investors/InvestorList";

/* ---------------- BRAND ---------------- */
const brand = {
    lightBlue: "#EBF5FF",
    skyBlue: "#BAE0FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    accent: "#00C389",
    purple: "#6B5CE7",
    white: "#FFFFFF",
};

/**
 * Parse URL search params into SearchFilters object
 */
function parseFiltersFromURL(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  const q = searchParams.get("q");
  if (q) filters.q = q;

  const targetCountries = searchParams.get("targetCountries");
  if (targetCountries) {
    try {
      filters.targetCountries = JSON.parse(targetCountries);
    } catch {
      /* ignore parse errors */
    }
  }

  const firmType = searchParams.get("firmType");
  if (firmType) {
    try {
      filters.firmType = JSON.parse(firmType);
    } catch {
      /* ignore parse errors */
    }
  }

  const fundingStages = searchParams.get("fundingStages");
  if (fundingStages) {
    try {
      filters.fundingStages = JSON.parse(fundingStages);
    } catch {
      /* ignore parse errors */
    }
  }

  return filters;
}

/**
 * Build URL search params from filters and page
 */
function buildURLParams(filters: SearchFilters, page: number): string {
  const params = new URLSearchParams();
  
  // Always include page in URL for shareability
  params.set("page", String(page));
  if (filters.q) params.set("q", filters.q);
  if (filters.targetCountries?.length)
    params.set("targetCountries", JSON.stringify(filters.targetCountries));
  if (filters.firmType?.length)
    params.set("firmType", JSON.stringify(filters.firmType));
  if (filters.fundingStages?.length)
    params.set("fundingStages", JSON.stringify(filters.fundingStages));

  return params.toString();
}

export default function InvestorSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Track if this is the initial mount to prevent URL updates
  const isInitialMount = useRef(true);

  // Initialize from URL params
  const [filters, setFilters] = useState<SearchFilters>(() =>
    parseFiltersFromURL(searchParams),
  );
  const [page, setPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) || 1 : 1;
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  // Mark mount as complete after initial render
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Sync searchQuery when filters.q changes (e.g., from reset)
  useEffect(() => {
    if (filters.q !== searchQuery) {
      setSearchQuery(filters.q || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);


  // Sync URL when filters or page change
  const updateURL = useCallback(
    (newFilters: SearchFilters, newPage: number) => {
      // Skip URL updates during initial mount
      if (isInitialMount.current) return;
      
      const queryString = buildURLParams(newFilters, newPage);
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname],
  );

  // Update URL when filters change (reset page to 1 only if filters actually changed)
  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      // Skip during initial mount
      if (isInitialMount.current) return;
      
      // Also sync searchQuery if q changed (e.g., from reset)
      if (newFilters.q !== filters.q) {
        setSearchQuery(newFilters.q || "");
      }
      
      // Check if filters actually changed to avoid unnecessary page reset
      const filtersChanged = JSON.stringify(newFilters) !== JSON.stringify(filters);
      
      setFilters(newFilters);
      if (filtersChanged) {
        setPage(1);
        updateURL(newFilters, 1);
      }
    },
    [updateURL, filters],
  );

  // Update URL when page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateURL(filters, newPage);
    },
    [updateURL, filters],
  );

  // Debounced live search - triggers search 300ms after typing stops
  useEffect(() => {
    // Skip during initial mount
    if (isInitialMount.current) return;
    
    const handler = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      const currentQ = filters.q || "";
      
      // Only trigger if the search term actually changed
      if (trimmedQuery !== currentQ) {
        const newFilters = { ...filters, q: trimmedQuery || undefined };
        setFilters(newFilters);
        setPage(1);
        updateURL(newFilters, 1);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, filters, updateURL]);

  // Count active filters for badge
  const activeFiltersCount = 
    (filters.q ? 1 : 0) +
    (filters.targetCountries?.length || 0) +
    (filters.firmType?.length || 0) +
    (filters.fundingStages?.length || 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-12"
        style={{
          background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})`,
        }}
      >
        {/* Decorative Blurs */}
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
              Search Investors
            </h1>
            <p className="text-lg text-gray-600">
              Find the perfect funding partner from our verified database of VCs, Angels, and more.
            </p>
          </div>

          {/* Search Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const newFilters = { ...filters, q: searchQuery.trim() || undefined };
              setFilters(newFilters);
              setPage(1);
              updateURL(newFilters, 1);
            }} 
            className="mb-6"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, location, or keywords..."
                className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-14 pr-32 text-base text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
              />
              <svg
                className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6 py-2 text-sm font-bold text-white transition hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})`,
                }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-blue-500 lg:hidden"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Active Filter Pills */}
            {filters.firmType?.map((type) => (
              <button
                key={type}
                onClick={() => {
                  const newFirmType = filters.firmType?.filter(t => t !== type);
                  handleFiltersChange({ ...filters, firmType: newFirmType?.length ? newFirmType : undefined });
                }}
                className="flex items-center gap-2 rounded-full border-2 border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 transition hover:border-blue-400"
              >
                {type}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}

            {filters.fundingStages?.map((stage) => (
              <button
                key={stage}
                onClick={() => {
                  const newStages = filters.fundingStages?.filter(s => s !== stage);
                  handleFiltersChange({ ...filters, fundingStages: newStages?.length ? newStages : undefined });
                }}
                className="flex items-center gap-2 rounded-full border-2 border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-bold text-purple-700 transition hover:border-purple-400"
              >
                {stage}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}

            {filters.targetCountries && filters.targetCountries.length > 0 && (
              <>
                {filters.targetCountries.slice(0, 2).map((country) => (
                  <button
                    key={country}
                    onClick={() => {
                      const newCountries = filters.targetCountries?.filter(c => c !== country);
                      handleFiltersChange({ ...filters, targetCountries: newCountries?.length ? newCountries : undefined });
                    }}
                    className="flex items-center gap-2 rounded-full border-2 border-green-200 bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700 transition hover:border-green-400"
                  >
                    📍 {country}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
                {filters.targetCountries.length > 2 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    +{filters.targetCountries.length - 2} more
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex gap-8">
          {/* Filters Sidebar (Desktop) */}
          <div className="hidden w-80 shrink-0 lg:block">
            <div className="sticky top-24">
              <InvestorFilters filters={filters} onChange={handleFiltersChange} />
            </div>
          </div>

          {/* Mobile Filters Overlay */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
              <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <InvestorFilters filters={filters} onChange={handleFiltersChange} />
              </div>
            </div>
          )}

          {/* Main Results */}
          <div className="flex-1">
            <InvestorList
              filters={{ ...filters, q: filters.q ?? "" }}
              page={page}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
