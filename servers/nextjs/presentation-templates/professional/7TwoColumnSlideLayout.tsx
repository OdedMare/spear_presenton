import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-two-column-slide'
export const layoutName = 'Professional Two Column Slide'
export const layoutDescription = 'Business two-column layout for comparisons.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Strategic Analysis').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Strengths').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Market leadership position',
        'Strong financial performance',
        'Experienced management team'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Opportunities').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Emerging market expansion',
        'Digital transformation',
        'Strategic partnerships'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Strategic Analysis'}
                    </h2>

                    <div className="flex gap-12 flex-1">
                        <div className="flex-1 border rounded-lg p-8" style={{ borderColor: "#e5e7eb" }}>
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                                    {slideData?.leftTitle || 'Strengths'}
                                </h3>
                                <div className="w-16 h-1" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Market leadership position', 'Strong financial performance', 'Experienced management team']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-2.5" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #4b5563)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 border rounded-lg p-8" style={{ borderColor: "#e5e7eb" }}>
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                                    {slideData?.rightTitle || 'Opportunities'}
                                </h3>
                                <div className="w-16 h-1" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Emerging market expansion', 'Digital transformation', 'Strategic partnerships']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-2.5" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #4b5563)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TwoColumnSlideLayout
