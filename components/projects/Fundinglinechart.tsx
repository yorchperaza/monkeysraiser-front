import React, { useMemo } from "react";

type FundingData = {
    date: string;
    committed: number;
};

type FundingLineChartProps = {
    data: FundingData[] | undefined;
    accent?: string;
};

const currency = (n: number | null | undefined) =>
    n == null
        ? "—"
        : new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(n);

export default function FundingLineChart({
                                             data,
                                             accent = "#00C389",
                                         }: FundingLineChartProps) {
    const width = 400;
    const height = 160;
    const padding = 24;

    const safeData = useMemo(
        () => (Array.isArray(data) ? data : []),
        [data]
    );

    const points = useMemo(() => {
        if (safeData.length === 0) return [];
        const maxIndex = safeData.length - 1;
        const values = safeData.map((d) => d.committed);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const yRange = maxVal - minVal || 1;

        return safeData.map((d, i) => {
            const x =
                padding + (i / (maxIndex || 1)) * (width - padding * 2);
            const y =
                height -
                padding -
                ((d.committed - minVal) / yRange) *
                (height - padding * 2);
            return { x, y, label: d.date, value: d.committed };
        });
    }, [safeData, width, height, padding]);

    const pathD = useMemo(() => {
        if (points.length === 0) return "";
        return points
            .map(
                (p, idx) =>
                    `${idx === 0 ? "M" : "L"} ${p.x.toFixed(
                        2
                    )} ${p.y.toFixed(2)}`
            )
            .join(" ");
    }, [points]);

    const areaPath = useMemo(() => {
        if (points.length <= 1) return "";
        return (
            pathD +
            ` L ${points[points.length - 1].x.toFixed(2)} ${(
                height - padding
            ).toFixed(2)} L ${points[0].x.toFixed(2)} ${(
                height - padding
            ).toFixed(2)} Z`
        );
    }, [pathD, points, height, padding]);

    const latestPoint = points[points.length - 1];

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="mb-4 flex items-baseline justify-between">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Funding Progress
                    </div>
                    <div className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-2xl font-black text-transparent">
                        {latestPoint
                            ? currency(
                                safeData[safeData.length - 1].committed
                            )
                            : "—"}
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {latestPoint ? latestPoint.label : ""}
                </div>
            </div>

            <div className="relative">
                {points.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-gray-400">
                        No funding data yet
                    </div>
                ) : (
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient
                                id="chartGradient"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    style={{
                                        stopColor: accent,
                                        stopOpacity: 0.3,
                                    }}
                                />
                                <stop
                                    offset="100%"
                                    style={{
                                        stopColor: accent,
                                        stopOpacity: 0,
                                    }}
                                />
                            </linearGradient>
                        </defs>

                        {/* axes */}
                        <line
                            x1={padding}
                            y1={height - padding}
                            x2={width - padding}
                            y2={height - padding}
                            stroke="#E5E7EB"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                        />
                        <line
                            x1={padding}
                            y1={padding}
                            x2={padding}
                            y2={height - padding}
                            stroke="#E5E7EB"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                        />

                        {/* area under line */}
                        {points.length > 1 && (
                            <path
                                d={areaPath}
                                fill="url(#chartGradient)"
                                opacity={0.2}
                            />
                        )}

                        {/* line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke={accent}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* points */}
                        {points.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={5}
                                fill="white"
                                stroke={accent}
                                strokeWidth={2}
                            />
                        ))}
                    </svg>
                )}
            </div>
        </div>
    );
}