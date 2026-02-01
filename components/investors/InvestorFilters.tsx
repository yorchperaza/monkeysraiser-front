"use client";

import React, { useState, useEffect, useRef } from "react";

export type SearchFilters = {
    q?: string;
    targetCountries?: string[]; // Array of country names/codes as stored in DB
    firmType?: string[];
    fundingStages?: string[];
};

type Props = {
    filters: SearchFilters;
    onChange: (f: SearchFilters) => void;
};

// Firm types from database (display -> DB value)
const FIRM_TYPES: { display: string; value: string }[] = [
    { display: "VC", value: "VC" },
    { display: "Corporate VC", value: "Corporate VC" },
    { display: "Angel Network", value: "Angel network" },
    { display: "Solo Angel", value: "Solo angel" },
    { display: "Accelerator / Incubator", value: "Incubator, Accelerator" },
    { display: "Startup Studio", value: "Startup studio" },
    { display: "Family Office", value: "Family office" },
    { display: "PE Fund", value: "PE fund" },
    { display: "Public Fund", value: "Public fund" },
    { display: "Other", value: "Other" },
];

// Funding stages from database (display -> DB value)
const FUNDING_STAGES: { display: string; value: string }[] = [
    { display: "Idea/Patent", value: "1. Idea or Patent" },
    { display: "Prototype", value: "2. Prototype" },
    { display: "Early Revenue", value: "3. Early Revenue" },
    { display: "Scaling", value: "4. Scaling" },
    { display: "Growth", value: "5. Growth" },
    { display: "Pre-IPO", value: "6. Pre-IPO" },
];

// Full country list from database (with display names mapped to DB values)
const COUNTRIES: { display: string; value: string }[] = [
    { display: "United States", value: "USA" },
    { display: "United Kingdom", value: "UK" },
    { display: "United Arab Emirates", value: "UAE" },
    { display: "Afghanistan", value: "Afghanistan" },
    { display: "Albania", value: "Albania" },
    { display: "Algeria", value: "Algeria" },
    { display: "Andorra", value: "Andorra" },
    { display: "Angola", value: "Angola" },
    { display: "Antigua and Barbuda", value: "Antigua and Barbuda" },
    { display: "Argentina", value: "Argentina" },
    { display: "Armenia", value: "Armenia" },
    { display: "Australia", value: "Australia" },
    { display: "Austria", value: "Austria" },
    { display: "Azerbaijan", value: "Azerbaijan" },
    { display: "Bahamas", value: "Bahamas" },
    { display: "Bahrain", value: "Bahrain" },
    { display: "Bangladesh", value: "Bangladesh" },
    { display: "Barbados", value: "Barbados" },
    { display: "Belarus", value: "Belarus" },
    { display: "Belgium", value: "Belgium" },
    { display: "Belize", value: "Belize" },
    { display: "Benin", value: "Benin" },
    { display: "Bhutan", value: "Bhutan" },
    { display: "Bolivia", value: "Bolivia" },
    { display: "Bosnia and Herzegovina", value: "Bosnia-H" },
    { display: "Botswana", value: "Botswana" },
    { display: "Brazil", value: "Brazil" },
    { display: "Brunei", value: "Brunei" },
    { display: "Bulgaria", value: "Bulgaria" },
    { display: "Burkina Faso", value: "Burkina Faso" },
    { display: "Burundi", value: "Burundi" },
    { display: "Cabo Verde", value: "Cabo Verde" },
    { display: "Cambodia", value: "Cambodia" },
    { display: "Cameroon", value: "Cameroon" },
    { display: "Canada", value: "Canada" },
    { display: "Cayman Islands", value: "Cayman Islands" },
    { display: "Central African Republic", value: "Central African Republic" },
    { display: "Chad", value: "Chad" },
    { display: "Chile", value: "Chile" },
    { display: "China", value: "China" },
    { display: "Colombia", value: "Colombia" },
    { display: "Comoros", value: "Comoros" },
    { display: "Congo (Brazzaville)", value: "Congo (Congo-Brazzaville)" },
    { display: "Costa Rica", value: "Costa Rica" },
    { display: "Côte d'Ivoire", value: "Côte d'Ivoire" },
    { display: "Croatia", value: "Croatia" },
    { display: "Cuba", value: "Cuba" },
    { display: "Cyprus", value: "Cyprus" },
    { display: "Czech Republic", value: "Czech Republic" },
    { display: "Denmark", value: "Denmark" },
    { display: "Djibouti", value: "Djibouti" },
    { display: "Dominica", value: "Dominica" },
    { display: "Dominican Republic", value: "Dominican Republic" },
    { display: "DRC Congo", value: "DRC Congo" },
    { display: "Ecuador", value: "Ecuador" },
    { display: "Egypt", value: "Egypt" },
    { display: "El Salvador", value: "El Salvador" },
    { display: "Equatorial Guinea", value: "Equatorial Guinea" },
    { display: "Eritrea", value: "Eritrea" },
    { display: "Estonia", value: "Estonia" },
    { display: "Eswatini", value: "Eswatini (fmr. \"Swaziland\")" },
    { display: "Ethiopia", value: "Ethiopia" },
    { display: "Fiji", value: "Fiji" },
    { display: "Finland", value: "Finland" },
    { display: "France", value: "France" },
    { display: "Gabon", value: "Gabon" },
    { display: "Gambia", value: "Gambia" },
    { display: "Georgia", value: "Georgia" },
    { display: "Germany", value: "Germany" },
    { display: "Ghana", value: "Ghana" },
    { display: "Gibraltar", value: "Gibraltar" },
    { display: "Greece", value: "Greece" },
    { display: "Grenada", value: "Grenada" },
    { display: "Guatemala", value: "Guatemala" },
    { display: "Guinea", value: "Guinea" },
    { display: "Guinea-Bissau", value: "Guinea-Bissau" },
    { display: "Guyana", value: "Guyana" },
    { display: "Haiti", value: "Haiti" },
    { display: "Holy See (Vatican)", value: "Holy See" },
    { display: "Honduras", value: "Honduras" },
    { display: "Hong Kong", value: "Hong Kong" },
    { display: "Hungary", value: "Hungary" },
    { display: "Iceland", value: "Iceland" },
    { display: "India", value: "India" },
    { display: "Indonesia", value: "Indonesia" },
    { display: "Iran", value: "Iran" },
    { display: "Iraq", value: "Iraq" },
    { display: "Ireland", value: "Ireland" },
    { display: "Israel", value: "Israel" },
    { display: "Italy", value: "Italy" },
    { display: "Jamaica", value: "Jamaica" },
    { display: "Japan", value: "Japan" },
    { display: "Jordan", value: "Jordan" },
    { display: "Kazakhstan", value: "Kazakhstan" },
    { display: "Kenya", value: "Kenya" },
    { display: "Kiribati", value: "Kiribati" },
    { display: "Kuwait", value: "Kuwait" },
    { display: "Kyrgyzstan", value: "Kyrgyzstan" },
    { display: "Laos", value: "Laos" },
    { display: "Latvia", value: "Latvia" },
    { display: "Lebanon", value: "Lebanon" },
    { display: "Lesotho", value: "Lesotho" },
    { display: "Liberia", value: "Liberia" },
    { display: "Libya", value: "Lybia" },
    { display: "Liechtenstein", value: "Liechtenstein" },
    { display: "Lithuania", value: "Lithuania" },
    { display: "Luxembourg", value: "Luxembourg" },
    { display: "Madagascar", value: "Madagascar" },
    { display: "Malawi", value: "Malawi" },
    { display: "Malaysia", value: "Malaysia" },
    { display: "Maldives", value: "Maldives" },
    { display: "Mali", value: "Mali" },
    { display: "Malta", value: "Malta" },
    { display: "Marshall Islands", value: "Marshall Islands" },
    { display: "Mauritania", value: "Mauritania" },
    { display: "Mauritius", value: "Mauritius" },
    { display: "Mexico", value: "Mexico" },
    { display: "Micronesia", value: "Micronesia" },
    { display: "Moldova", value: "Moldova" },
    { display: "Monaco", value: "Monaco" },
    { display: "Mongolia", value: "Mongolia" },
    { display: "Montenegro", value: "Montenegro" },
    { display: "Morocco", value: "Morocco" },
    { display: "Mozambique", value: "Mozambique" },
    { display: "Myanmar", value: "Myanmar" },
    { display: "Namibia", value: "Namibia" },
    { display: "Nauru", value: "Nauru" },
    { display: "Nepal", value: "Nepal" },
    { display: "Netherlands", value: "Netherlands" },
    { display: "New Zealand", value: "New Zealand" },
    { display: "Nicaragua", value: "Nicaragua" },
    { display: "Niger", value: "Niger" },
    { display: "Nigeria", value: "Nigeria" },
    { display: "North Korea", value: "North Korea" },
    { display: "North Macedonia", value: "North Macedonia" },
    { display: "Norway", value: "Norway" },
    { display: "Oman", value: "Oman" },
    { display: "Pakistan", value: "Pakistan" },
    { display: "Palau", value: "Palau" },
    { display: "Palestine", value: "Palestine" },
    { display: "Panama", value: "Panama" },
    { display: "Papua New Guinea", value: "Papua New Guinea" },
    { display: "Paraguay", value: "Paraguay" },
    { display: "Peru", value: "Peru" },
    { display: "Philippines", value: "Philippines" },
    { display: "Poland", value: "Poland" },
    { display: "Portugal", value: "Portugal" },
    { display: "Qatar", value: "Qatar" },
    { display: "Romania", value: "Romania" },
    { display: "Russia", value: "Russia" },
    { display: "Rwanda", value: "Rwanda" },
    { display: "Saint Kitts and Nevis", value: "Sant Kitts and Nevis" },
    { display: "Saint Lucia", value: "Sant Lucia" },
    { display: "Saint Vincent and the Grenadines", value: "Saint Vincent and the Grenadines" },
    { display: "Samoa", value: "Samoa" },
    { display: "San Marino", value: "San Marino" },
    { display: "São Tomé and Príncipe", value: "Sao Tome and Principe" },
    { display: "Saudi Arabia", value: "Saudi Arabia" },
    { display: "Senegal", value: "Senegal" },
    { display: "Serbia", value: "Serbia" },
    { display: "Seychelles", value: "Seychelles" },
    { display: "Sierra Leone", value: "Sierra Leone" },
    { display: "Singapore", value: "Singapore" },
    { display: "Slovakia", value: "Slovakia" },
    { display: "Slovenia", value: "Slovenia" },
    { display: "Solomon Islands", value: "Solomon Islands" },
    { display: "Somalia", value: "Somalia" },
    { display: "South Africa", value: "South Africa" },
    { display: "South Korea", value: "South Korea" },
    { display: "South Sudan", value: "South Sudan" },
    { display: "Spain", value: "Spain" },
    { display: "Sri Lanka", value: "Sri Lanka" },
    { display: "Sudan", value: "Sudan" },
    { display: "Suriname", value: "Suriname" },
    { display: "Sweden", value: "Sweden" },
    { display: "Switzerland", value: "Switzerland" },
    { display: "Syria", value: "Syria" },
    { display: "Taiwan", value: "Taiwan" },
    { display: "Tajikistan", value: "Tajikistan" },
    { display: "Tanzania", value: "Tanzania" },
    { display: "Thailand", value: "Thailand" },
    { display: "Timor-Leste", value: "Timor-Leste" },
    { display: "Togo", value: "Togo" },
    { display: "Tonga", value: "Tonga" },
    { display: "Trinidad and Tobago", value: "Trinidad and Tobago" },
    { display: "Tunisia", value: "Tunisia" },
    { display: "Turkey", value: "Turkey" },
    { display: "Turkmenistan", value: "Turkmenistan" },
    { display: "Tuvalu", value: "Tuvalu" },
    { display: "Uganda", value: "Uganda" },
    { display: "Ukraine", value: "Ukraine" },
    { display: "Uruguay", value: "Uruguay" },
    { display: "Uzbekistan", value: "Uzbekistan" },
    { display: "Vanuatu", value: "Vanuatu" },
    { display: "Venezuela", value: "Venezuela" },
    { display: "Vietnam", value: "Vietnam" },
    { display: "Yemen", value: "Yemen" },
    { display: "Zambia", value: "Zambia" },
    { display: "Zimbabwe", value: "Zimbabwe" },
];

// Helper to get display name from DB value
function getDisplayName(value: string): string {
    const country = COUNTRIES.find(c => c.value === value);
    return country?.display || value;
}

export default function InvestorFilters({ filters, onChange }: Props) {
    const [countrySearch, setCountrySearch] = useState("");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCountryDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleArrayItem = (key: keyof SearchFilters, val: string) => {
        const current = (filters[key] as string[]) || [];
        const next = current.includes(val)
            ? current.filter((x) => x !== val)
            : [...current, val];
        onChange({ ...filters, [key]: next });
    };

    // Filter countries based on search
    const filteredCountries = COUNTRIES.filter(c => 
        !((filters.targetCountries || []).includes(c.value)) &&
        (c.display.toLowerCase().includes(countrySearch.toLowerCase()) ||
         c.value.toLowerCase().includes(countrySearch.toLowerCase()))
    );

    const selectCountry = (value: string) => {
        toggleArrayItem("targetCountries", value);
        setCountrySearch("");
        setShowCountryDropdown(false);
    };

    return (
        <div className="space-y-6">

            {/* Firm Type */}
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Firm Type
                </label>
                <div className="space-y-2">
                    {FIRM_TYPES.map(({ display, value }) => {
                        const active = (filters.firmType || []).includes(value);
                        return (
                            <label key={value} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${active ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 group-hover:border-gray-400"}`}>
                                    {active && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={active}
                                    onChange={() => toggleArrayItem("firmType", value)}
                                />
                                <span className={`text-sm ${active ? "font-bold text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                                    {display}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Funding Stages */}
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Stage
                </label>
                <div className="flex flex-wrap gap-2">
                    {FUNDING_STAGES.map(({ display, value }) => {
                        const active = (filters.fundingStages || []).includes(value);
                        return (
                            <button
                                key={value}
                                onClick={() => toggleArrayItem("fundingStages", value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                                    active
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                            >
                                {display}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Target Countries - Searchable Dropdown */}
            <div ref={dropdownRef}>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Target Countries
                    <span className="ml-2 text-[10px] font-normal text-gray-500 normal-case">
                        (must invest in ALL selected)
                    </span>
                </label>
                
                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => {
                            setCountrySearch(e.target.value);
                            setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                        placeholder="Search countries..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    
                    {/* Dropdown */}
                    {showCountryDropdown && (
                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                            {filteredCountries.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">No countries found</div>
                            ) : (
                                filteredCountries.slice(0, 50).map((country) => (
                                    <button
                                        key={country.value}
                                        onClick={() => selectCountry(country.value)}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        {country.display}
                                        {country.display !== country.value && (
                                            <span className="ml-2 text-xs text-gray-400">({country.value})</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
                
                {/* Active Country Tags */}
                {(filters.targetCountries || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {(filters.targetCountries || []).map(c => (
                            <span key={c} className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {getDisplayName(c)}
                                <button 
                                    onClick={() => toggleArrayItem("targetCountries", c)}
                                    className="hover:text-red-500 ml-1 text-blue-400"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
             {/* Reset Filters */}
             <button
                onClick={() => {
                    onChange({});
                }}
                className="w-full rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
            >
                Reset Filters
            </button>
        </div>
    );
}
