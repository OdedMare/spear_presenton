import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-metrics-slide'
export const layoutName = 'Gradient Metrics Slide'
export const layoutDescription = 'Modern metrics display with flowing gradient background.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Impact').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '500K+', label: 'Active Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.8★', label: 'User Rating' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide text-white/80">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl bg-white"></div>
                    <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl bg-white"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Our Impact'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '500K+', label: 'Active Users' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '4.8★', label: 'User Rating' },
                        ]).map((metric, i) => (
                            <div key={i} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                <div className="text-6xl font-bold mb-4 text-white">
                                    {metric.value}
                                </div>
                                <div className="text-lg font-light text-white/80">
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
