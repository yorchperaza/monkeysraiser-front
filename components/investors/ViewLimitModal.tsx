"use client";

import React from "react";
import Link from "next/link";

const brand = {
    primary: "#0066CC",
    darkBlue: "#003D7A",
};

interface ViewLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ViewLimitModal({ isOpen, onClose }: ViewLimitModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <div 
                className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                {/* Content */}
                <h2 className="mb-2 text-center text-2xl font-black text-gray-900">
                    Unlock Full Access
                </h2>
                <p className="mb-6 text-center text-gray-600">
                    You&apos;ve viewed 5 investor profiles. Create a free account to continue exploring our database of verified investors.
                </p>

                {/* Benefits */}
                <ul className="mb-6 space-y-2 text-sm">
                    {[
                        "Unlimited investor profile views",
                        "Contact investors directly",
                        "Save favorites & track outreach",
                        "Access exclusive features",
                    ].map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                            <svg className="h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {benefit}
                        </li>
                    ))}
                </ul>

                {/* CTAs */}
                <div className="space-y-3">
                    <Link
                        href="/register"
                        className="block w-full rounded-xl py-3 text-center text-base font-bold text-white transition hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.darkBlue})` }}
                    >
                        Create Free Account
                    </Link>
                    <Link
                        href="/login"
                        className="block w-full rounded-xl border-2 border-gray-200 py-3 text-center text-base font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                        Already have an account? Log in
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-gray-500">
                    Free for founders and investors. No credit card required.
                </p>
            </div>
        </div>
    );
}
