"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import countriesData from "world-countries";

const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const brand = {
    lightBlue: "#EBF5FF",
    primary: "#0066CC",
    darkBlue: "#003D7A",
    white: "#FFFFFF",
};

const FIRM_TYPES = [
    "VC", "Corporate VC", "Angel network", "Solo angel",
    "Incubator, Accelerator", "Startup studio", "Family office",
    "PE fund", "Public fund", "Other",
];

const FUNDING_STAGES = [
    "Idea or Patent", "Prototype", "Early Revenue",
    "Scaling", "Growth", "Pre-IPO",
];

const COUNTRY_OPTIONS = countriesData
    .map((c) => ({ label: c.name.common, iso2: (c.cca2 || "").toUpperCase() }))
    .filter((c) => c.iso2.length === 2)
    .sort((a, b) => a.label.localeCompare(b.label));

function getToken(): string {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}
function authHeaders(): HeadersInit {
    const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function NewInvestorPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [fundName, setFundName] = useState("");
    const [verified, setVerified] = useState(false);
    const [linkedin, setLinkedin] = useState("");
    const [website, setWebsite] = useState("");
    const [globalHq, setGlobalHq] = useState("");
    const [description, setDescription] = useState("");
    const [valueAdd, setValueAdd] = useState("");
    const [team, setTeam] = useState("");
    const [checkSizeMin, setCheckSizeMin] = useState<number | null>(null);
    const [checkSizeMax, setCheckSizeMax] = useState<number | null>(null);
    const [firmTypes, setFirmTypes] = useState<string[]>([]);
    const [fundingStages, setFundingStages] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const toggleFirmType = (t: string) =>
        setFirmTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    const toggleStage = (s: string) =>
        setFundingStages((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    const toggleCountry = (c: string) =>
        setCountries((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

    const save = async () => {
        if (!fundName.trim()) { setErr("Fund name is required"); return; }
        setSaving(true); setErr(null);

        try {
            const payload = {
                fundName,
                verified,
                linkedin: linkedin || null,
                website: website || null,
                globalHq: globalHq || null,
                description: description || null,
                valueAdd: valueAdd || null,
                team: team || null,
                checkSizeMin,
                checkSizeMax,
                firmType: firmTypes.length > 0 ? JSON.stringify(firmTypes) : null,
                fundingStages: fundingStages.join("; ") || null,
                targetCountries: countries.join("; ") || null,
            };

            let res;
            if (logoFile) {
                const fd = new FormData();
                fd.append("data", JSON.stringify(payload));
                fd.append("logo", logoFile);
                res = await fetch(`${BE}/open-vc-investors`, {
                    method: "POST",
                    headers: { Accept: "application/json", ...authHeaders() },
                    body: fd,
                });
            } else {
                res = await fetch(`${BE}/open-vc-investors`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Failed to create (${res.status}): ${text}`);
            }

            const data = await res.json();
            router.push(`/admin/investors/${data.id}`);
        } catch (e: any) {
            setErr(e.message || "Unknown error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <section className="relative py-8" style={{ background: `linear-gradient(180deg, ${brand.lightBlue}, ${brand.white})` }}>
                <div className="mx-auto max-w-4xl px-6">
                    <Link href="/admin/investors" className="text-sm font-semibold text-gray-600 hover:text-blue-600">
                        ← Back to list
                    </Link>
                    <h1 className="mt-4 text-3xl font-black text-gray-900">Add New Investor</h1>
                </div>
            </section>

            {err && (
                <div className="mx-auto max-w-4xl px-6 mt-6">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
                </div>
            )}

            <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
                {/* Basic Info */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Basic Information</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-gray-700">Fund Name *</span>
                            <input value={fundName} onChange={(e) => setFundName(e.target.value)}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" placeholder="Fund name" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">LinkedIn</span>
                            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" placeholder="https://linkedin.com/..." />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Website</span>
                            <input value={website} onChange={(e) => setWebsite(e.target.value)}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" placeholder="https://..." />
                        </label>
                        <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-gray-700">Headquarters</span>
                            <input value={globalHq} onChange={(e) => setGlobalHq(e.target.value)}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" placeholder="San Francisco, CA" />
                        </label>
                        <label className="flex items-center gap-3 md:col-span-2">
                            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-5 w-5 rounded" />
                            <span className="font-bold text-gray-900">Verified Investor</span>
                        </label>
                    </div>
                </div>

                {/* Description */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Description</h2>
                    <div className="space-y-6">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Description</span>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 resize-y" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Value Add</span>
                            <textarea value={valueAdd} onChange={(e) => setValueAdd(e.target.value)} rows={3}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 resize-y" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">Team</span>
                            <textarea value={team} onChange={(e) => setTeam(e.target.value)} rows={3}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 resize-y" />
                        </label>
                    </div>
                </div>

                {/* Investment Criteria */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Investment Criteria</h2>
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700">Check Size Min (USD)</span>
                                <input type="number" value={checkSizeMin ?? ""} onChange={(e) => setCheckSizeMin(e.target.value ? Number(e.target.value) : null)}
                                    className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700">Check Size Max (USD)</span>
                                <input type="number" value={checkSizeMax ?? ""} onChange={(e) => setCheckSizeMax(e.target.value ? Number(e.target.value) : null)}
                                    className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-500" />
                            </label>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-gray-700">Firm Type</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {FIRM_TYPES.map((t) => (
                                    <button key={t} onClick={() => toggleFirmType(t)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border ${firmTypes.includes(t) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-gray-700">Funding Stages</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {FUNDING_STAGES.map((s) => (
                                    <button key={s} onClick={() => toggleStage(s)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border ${fundingStages.includes(s) ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-600"}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-gray-700">Target Countries ({countries.length} selected)</span>
                            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border-2 border-gray-200 p-3">
                                <div className="flex flex-wrap gap-2">
                                    {COUNTRY_OPTIONS.slice(0, 50).map(({ label }) => (
                                        <button key={label} onClick={() => toggleCountry(label)}
                                            className={`rounded-lg px-2 py-1 text-xs font-medium border ${countries.includes(label) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Logo</h2>
                    {logoFile ? (
                        <div className="text-center">
                            <img src={URL.createObjectURL(logoFile)} alt="Preview" className="h-24 w-24 rounded-xl object-cover mx-auto mb-2" />
                            <button onClick={() => setLogoFile(null)} className="text-xs text-red-600 hover:underline">Remove</button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 cursor-pointer hover:border-blue-400">
                            <span className="text-gray-500">Click to upload logo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                        </label>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button onClick={save} disabled={saving}
                        className="rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}>
                        {saving ? "Creating..." : "Create Investor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
