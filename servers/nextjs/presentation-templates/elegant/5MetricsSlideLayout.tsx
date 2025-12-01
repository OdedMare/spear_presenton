import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-metrics-slide'
export const layoutName = 'Elegant Metrics Slide'
export const layoutDescription = 'Refined presentation of key performance indicators.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Achievements').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '2.4M', label: 'Annual Revenue' },
        { value: '94%', label: 'Client Satisfaction' },
        { value: '150+', label: 'Projects Completed' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lato:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #faf8f5)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-light mb-16 text-center" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Key Achievements'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '2.4M', label: 'Annual Revenue' },
                            { value: '94%', label: 'Client Satisfaction' },
                            { value: '150+', label: 'Projects Completed' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center">
                                <div className="mb-4">
                                    <div className="w-16 h-px mx-auto" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                                </div>
                                <div className="text-7xl font-light mb-4" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                                    {metric.value}
                                </div>
                                <div className="text-xl font-light tracking-wide"
                                     style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
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
