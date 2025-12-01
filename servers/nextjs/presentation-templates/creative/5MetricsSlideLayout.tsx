import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-metrics-slide'
export const layoutName = 'Creative Metrics Slide'
export const layoutDescription = 'Playful metrics display with artistic flair.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Impact').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '1M+', label: 'Creative Moments' },
        { value: '100%', label: 'Passion Driven' },
        { value: '∞', label: 'Possibilities' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #fffbf0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-wide" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-10 right-10 w-40 h-40 rounded-full opacity-15" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                <div className="absolute bottom-10 left-10 w-32 h-32 opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)", transform: "rotate(45deg)" }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-7xl mb-16 text-center" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Impact'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '1M+', label: 'Creative Moments' },
                            { value: '100%', label: 'Passion Driven' },
                            { value: '∞', label: 'Possibilities' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center transform hover:scale-105 transition-transform">
                                <div className="mb-4 p-6 rounded-3xl border-4 transform" style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)", transform: i % 2 === 0 ? "rotate(-3deg)" : "rotate(2deg)" }}>
                                    <div className="text-7xl font-bold" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                                        {metric.value}
                                    </div>
                                </div>
                                <div className="text-xl font-light"
                                     style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
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
