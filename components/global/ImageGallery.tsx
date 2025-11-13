"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type GalleryImage = {
    url: string | null;
    type: string | null;
};

type ImageGalleryProps = {
    images: GalleryImage[];
    fromBE: (path?: string | null) => string | null;
};

export default function ImageGallery({ images, fromBE }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
    };

    const closeLightbox = () => {
        setSelectedIndex(null);
    };

    const goToNext = useCallback(() => {
        if (selectedIndex !== null && selectedIndex < images.length - 1) {
            setSelectedIndex(selectedIndex + 1);
        }
    }, [selectedIndex, images.length]);

    const goToPrevious = useCallback(() => {
        if (selectedIndex !== null && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
        }
    }, [selectedIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (selectedIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeLightbox();
            } else if (e.key === "ArrowRight") {
                goToNext();
            } else if (e.key === "ArrowLeft") {
                goToPrevious();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, goToNext, goToPrevious]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (selectedIndex !== null) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedIndex]);

    // Auto-scroll thumbnails to keep selected image in view
    useEffect(() => {
        if (selectedIndex !== null) {
            const thumbnail = document.getElementById(`thumbnail-${selectedIndex}`);
            if (thumbnail) {
                thumbnail.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [selectedIndex]);

    if (!images || images.length === 0) {
        return (
            <div className="text-sm text-gray-500">
                No media yet
            </div>
        );
    }

    return (
        <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {images.map((img, i) => {
                    const src = fromBE(img?.url);
                    return (
                        <div
                            key={i}
                            className="relative aspect-video w-full overflow-hidden rounded-xl border border-blue-100 bg-blue-50 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
                            onClick={() => src && openLightbox(i)}
                        >
                            {src ? (
                                <>
                                    <Image
                                        src={src}
                                        alt={`gallery-${i}`}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        unoptimized
                                    />
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <svg
                                            className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                    —
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Lightbox Modal */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                        aria-label="Close"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                        {selectedIndex + 1} / {images.length}
                    </div>

                    {/* Previous Button */}
                    {selectedIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                            aria-label="Previous"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Next Button */}
                    {selectedIndex < images.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110"
                            aria-label="Next"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Main Image */}
                    <div
                        className="relative max-h-[75vh] max-w-[90vw] w-full mb-32"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            {fromBE(images[selectedIndex]?.url) && (
                                <img
                                    src={fromBE(images[selectedIndex]?.url)!}
                                    alt={`gallery-${selectedIndex}`}
                                    className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                                />
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
                        <div className="relative">
                            {/* Thumbnails Container */}
                            <div
                                className="flex gap-2 overflow-x-auto py-2 px-2 bg-black/30 backdrop-blur-md rounded-xl"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    WebkitOverflowScrolling: 'touch',
                                }}
                            >
                                <style jsx>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                {images.map((img, i) => {
                                    const src = fromBE(img?.url);
                                    if (!src) return null;

                                    return (
                                        <button
                                            key={i}
                                            id={`thumbnail-${i}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedIndex(i);
                                            }}
                                            className={`
                                                relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden 
                                                transition-all duration-300 cursor-pointer
                                                ${selectedIndex === i
                                                ? 'ring-4 ring-white scale-110 opacity-100'
                                                : 'ring-2 ring-white/30 hover:ring-white/60 opacity-60 hover:opacity-100'
                                            }
                                            `}
                                        >
                                            <img
                                                src={src}
                                                alt={`thumbnail-${i}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Keyboard Hints */}
                            <div className="mt-3 flex justify-center gap-4 text-xs text-white/60">
                                <span className="flex items-center gap-1">
                                    <kbd className="rounded bg-white/10 px-2 py-1">←</kbd>
                                    <kbd className="rounded bg-white/10 px-2 py-1">→</kbd>
                                    Navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="rounded bg-white/10 px-2 py-1">ESC</kbd>
                                    Close
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}