// Single source of truth for categories across the app.

export const CATEGORIES = [
    "AI / ML",
    "Analytics / BI",
    "AR / VR / XR",
    "Blockchain / Web3",
    "ClimateTech",
    "Aerospace / SpaceTech",
    "Autonomous Systems",
    "Robotics",
    "Drones",
    "Clean Energy / Renewables",
    "Energy Storage / Batteries",
    "Carbon / Offsets / MRV",
    "Agriculture / AgTech",
    "FoodTech",
    "BioTech",
    "Synthetic Biology",
    "HealthTech",
    "Digital Health / Telemedicine",
    "MedTech / Devices",
    "Pharma / Drug Discovery",
    "FinTech",
    "DeFi / Crypto Finance",
    "InsurTech",
    "PropTech / Real Estate",
    "ConstructionTech",
    "Manufacturing / Industry 4.0",
    "Advanced Materials",
    "Semiconductors / Chips",
    "IoT / Embedded",
    "Edge Computing",
    "Networking / 5G",
    "Cybersecurity",
    "Privacy / Compliance",
    "Developer Tools",
    "SaaS / Productivity",
    "SaaS / Infrastructure",
    "Cloud / DevOps / Platform",
    "Open Source",
    "Open Science",
    "Data Infrastructure / Databases",
    "MLOps / DataOps",
    "E-commerce",
    "Marketplaces",
    "RetailTech / POS",
    "Logistics / Supply Chain",
    "Mobility / Transportation",
    "Automotive / EV",
    "Aviation",
    "Maritime",
    "Media / Entertainment",
    "Gaming",
    "Creator Economy",
    "AdTech / MarTech",
    "SalesTech / RevOps",
    "HRTech / Future of Work",
    "EdTech",
    "GovTech / Public Sector",
    "LegalTech",
    "Civic / Social Impact",
    "Security / Defense",
    "Travel / Hospitality",
    "Sports / Fitness",
    "Consumer Social",
    "Communication / Collaboration",
    "Financial Services (Traditional)",
    "Nonprofit / Philanthropy",
    "Localization / Translation",
    "Quantum Tech",
    "Wearables",
    "Home / Smart Home",
    "PetTech",
    "Fashion / BeautyTech",
    "Gaming Infrastructure",
    "Digital Identity",
    "NFTs / Digital Assets",
    "Search / Recommendations",
    "Personalization",
    "Other",
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_SET = new Set<string>(CATEGORIES);
export const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ label: c, value: c }));

/** Case-insensitive match to a known category; returns null if no match. */
export function normalizeCategory(input: string): Category | null {
    const needle = input.trim().toLowerCase();
    for (const c of CATEGORIES) {
        if (c.toLowerCase() === needle) return c;
    }
    return null;
}

/** Normalizes an array; keeps unknowns if allowUnknown is true. */
export function normalizeCategories(
    items: string[],
    allowUnknown = true
): string[] {
    const out: string[] = [];
    for (const raw of items) {
        const n = normalizeCategory(raw);
        if (n) out.push(n);
        else if (allowUnknown && raw.trim()) out.push(raw.trim());
    }
    // de-dupe preserving order
    return Array.from(new Set(out));
}
