import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-two-column-slide'
export const layoutName = 'Corporate Two Column Slide'
export const layoutDescription = 'Professional two-column business layout.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Analysis Overview').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Current State').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Established market presence',
        'Strong operational foundation',
        'Proven business model'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Future Vision').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Global market expansion',
        'Technology integration',
        'Sustainable growth strategy'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                        {slideData?.title || 'Analysis Overview'}
                    </h2>

                    <div className="flex gap-10 flex-1">
                        <div className="flex-1 bg-white rounded-lg shadow-md p-8">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                                    {slideData?.leftTitle || 'Current State'}
                                </h3>
                                <div className="w-16 h-1" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Established market presence', 'Strong operational foundation', 'Proven business model']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-lg shadow-md p-8">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                                    {slideData?.rightTitle || 'Future Vision'}
                                </h3>
                                <div className="w-16 h-1" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Global market expansion', 'Technology integration', 'Sustainable growth strategy']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #4a4a4a)" }}>
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
