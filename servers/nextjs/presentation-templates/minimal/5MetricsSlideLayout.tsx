import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-metrics-slide'
export const layoutName = 'Minimal Metrics Slide'
export const layoutDescription = 'Clean minimalist metrics display.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Figures').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '10M', label: 'Users' },
        { value: '99%', label: 'Uptime' },
        { value: '50+', label: 'Countries' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-xs font-light tracking-widest" style={{ color: "var(--primary-accent-color, #000000)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-5xl font-extralight mb-16 text-center" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Key Figures'}
                    </h2>

                    <div className="grid grid-cols-3 gap-16 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '10M', label: 'Users' },
                            { value: '99%', label: 'Uptime' },
                            { value: '50+', label: 'Countries' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center">
                                <div className="text-7xl font-extralight mb-6" style={{ color: "var(--primary-accent-color, #000000)" }}>
                                    {metric.value}
                                </div>
                                <div className="text-sm font-light tracking-wider uppercase"
                                     style={{ color: "var(--text-body-color, #666666)" }}>
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
