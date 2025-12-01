import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-metrics-slide'
export const layoutName = 'Professional Metrics Slide'
export const layoutDescription = 'Business KPI display with clean layout.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('2024 Performance').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '$12M', label: 'Annual Revenue' },
        { value: '95%', label: 'Client Retention' },
        { value: '200+', label: 'Enterprise Clients' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-medium tracking-wide" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || '2024 Performance'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '$12M', label: 'Annual Revenue' },
                            { value: '95%', label: 'Client Retention' },
                            { value: '200+', label: 'Enterprise Clients' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center border rounded-lg p-8" style={{ borderColor: "#e5e7eb" }}>
                                <div className="text-7xl font-bold mb-4" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                                    {metric.value}
                                </div>
                                <div className="w-16 h-1 mx-auto mb-4" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                                <div className="text-lg font-medium"
                                     style={{ color: "var(--text-body-color, #4b5563)" }}>
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
