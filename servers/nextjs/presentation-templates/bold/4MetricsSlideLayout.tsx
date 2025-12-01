import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-metrics-slide'
export const layoutName = 'Bold Metrics Slide'
export const layoutDescription = 'Bold slide showcasing key metrics and statistics.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value (e.g., 95%, $2M, 10K)" }),
    label: z.string().min(2).max(50).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Metrics').meta({
        description: "Slide title",
    }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '95%', label: 'Customer Satisfaction' },
        { value: '$2.5M', label: 'Revenue Growth' },
        { value: '10K+', label: 'Active Users' },
    ]).meta({
        description: "Key metrics to display",
    }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

interface MetricsSlideLayoutProps {
    data?: Partial<MetricsSlideData>
}

const MetricsSlideLayout: React.FC<MetricsSlideLayoutProps> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{
                    background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))",
                    fontFamily: "var(--heading-font-family, Montserrat, sans-serif)"
                }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-96 h-96" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                </div>

                {/* Company Name */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-6 left-12">
                        <span className="text-sm font-bold tracking-wider uppercase opacity-70" style={{ color: 'var(--text-heading-color, #ffffff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full px-16 pt-20 pb-12">
                    <div className="mb-16">
                        <div className="w-16 h-1 mb-4" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                        <h2 className="text-5xl font-black uppercase" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Key Metrics'}
                        </h2>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-12 flex-1">
                        {(slideData?.metrics || [
                            { value: '95%', label: 'Customer Satisfaction' },
                            { value: '$2.5M', label: 'Revenue Growth' },
                            { value: '10K+', label: 'Active Users' },
                        ]).map((metric, index) => (
                            <div key={index} className="flex flex-col justify-center">
                                <div className="mb-4">
                                    <div className="w-12 h-1" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                                </div>
                                <div className="text-7xl font-black mb-4" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
                                    {metric.value}
                                </div>
                                <div className="text-xl font-semibold uppercase tracking-wide"
                                     style={{ color: "var(--text-body-color, #e5e5e5)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                    {metric.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
            </div>
        </>
    )
}

export default MetricsSlideLayout
