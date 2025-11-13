"use client";

import React from "react";
import Topbar from "@/components/dashboard/Topbar";

type Props = {
    title: string;
    subtitle?: string;
    ctaHref?: string;
    ctaLabel?: string;
    rightSlot?: React.ReactNode;
};

export default function PageHeader({
                                       title,
                                       subtitle,
                                       ctaHref,
                                       ctaLabel,
                                       rightSlot,
                                   }: Props) {
    return (
        <Topbar
            title={title}
            subtitle={subtitle}
            ctaHref={ctaHref}
            ctaLabel={ctaLabel}
            rightSlot={rightSlot}
        />
    );
}
