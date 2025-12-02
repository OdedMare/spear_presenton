import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-metrics-slide'
export const layoutName = 'Vibrant Metrics Slide'
export const layoutDescription = 'Colorful metrics with energetic design.'

const metricSchema = z.object({
    value: z.string().min(1).max(20).meta({ description: "Metric value" }),
    label: z.string().min(1).max(40).meta({ description: "Metric label" }),
})

const metricsSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Success Metrics').meta({ description: "Slide title" }),
    metrics: z.array(metricSchema).min(2).max(4).default([
        { value: '250K', label: 'Happy Users' },
        { value: '4.9★', label: 'App Rating' },
        { value: '95%', label: 'Satisfaction' },
    ]).meta({ description: "Metrics to display" }),
})

export const Schema = metricsSlideSchema
export type MetricsSlideData = z.infer<typeof metricsSlideSchema>

const MetricsSlideLayout: React.FC<{data?: Partial<MetricsSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-20 right-20 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full opacity-10" style={{ background: "#4ecdc4" }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Success Metrics'}
                    </h2>

                    <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {(slideData?.metrics || [
                            { value: '250K', label: 'Happy Users' },
                            { value: '4.9★', label: 'App Rating' },
                            { value: '95%', label: 'Satisfaction' },
                        ]).map((metric, i) => {
                            const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4'];
                            return (
                                <div key={i} className="text-center rounded-3xl p-8 border-4" style={{ borderColor: colors[i % colors.length], background: `${colors[i % colors.length]}15` }}>
                                    <div className="text-7xl font-bold mb-4" style={{ color: colors[i % colors.length] }}>
                                        {metric.value}
                                    </div>
                                    <div className="text-lg font-bold"
                                         style={{ color: "var(--text-body-color, #636e72)" }}>
                                        {metric.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MetricsSlideLayout
