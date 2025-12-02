import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-metrics-slide'
export const layoutName = 'Dark Metrics Slide'
export const layoutDescription = 'Elegant dark theme metrics display.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Achievements').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '1.5M', label: 'Global Reach' },
        { value: '97%', label: 'Excellence Rate' },
        { value: '300+', label: 'Premium Clients' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide text-white/60">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                    <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Key Achievements'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '1.5M', label: 'Global Reach' },
                            { value: '97%', label: 'Excellence Rate' },
                            { value: '300+', label: 'Premium Clients' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center">
                                <div className="mb-4">
                                    <div className="w-20 h-px mx-auto" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #6366f1), var(--secondary-accent-color, #8b5cf6))` }}></div>
                                </div>
                                <div className="text-7xl font-bold mb-4" style={{ color: "var(--primary-accent-color, #6366f1)" }}>
                                    {metric.value}
                                </div>
                                <div className="text-lg font-light tracking-wide text-white/70"
                                     style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                    {metric.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MetricsSlideLayout
