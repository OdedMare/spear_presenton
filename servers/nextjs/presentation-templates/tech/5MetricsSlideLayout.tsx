import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-metrics-slide'
export const layoutName = 'Tech Metrics Slide'
export const layoutDescription = 'Modern tech metrics with vibrant display.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Performance Stats').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '2.5s', label: 'Load Time' },
        { value: '100M', label: 'API Calls/Day' },
        { value: '99.99%', label: 'Availability' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0e1a)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Performance Stats'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '2.5s', label: 'Load Time' },
                            { value: '100M', label: 'API Calls/Day' },
                            { value: '99.99%', label: 'Availability' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/30">
                                <div className="text-6xl font-bold mb-4" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                                    {metric.value}
                                </div>
                                <div className="text-lg font-semibold text-white/80">
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
