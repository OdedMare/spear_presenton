import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-metrics-slide'
export const layoutName = 'Corporate Metrics Slide'
export const layoutDescription = 'Professional business metrics display.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Corporate Performance').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '$25M', label: 'Annual Revenue' },
        { value: '98%', label: 'Client Satisfaction' },
        { value: '500+', label: 'Global Clients' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #f8f9fa)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5" style={{ background: `linear-gradient(135deg, var(--primary-accent-color, #003d82), transparent)` }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                        {slideData?.title || 'Corporate Performance'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '$25M', label: 'Annual Revenue' },
                            { value: '98%', label: 'Client Satisfaction' },
                            { value: '500+', label: 'Global Clients' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center p-8 bg-white rounded-lg shadow-md">
                                <div className="text-6xl font-bold mb-4" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                                    {metric.value}
                                </div>
                                <div className="w-16 h-1 mx-auto mb-4" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                                <div className="text-lg font-semibold"
                                     style={{ color: "var(--text-body-color, #4a4a4a)" }}>
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
