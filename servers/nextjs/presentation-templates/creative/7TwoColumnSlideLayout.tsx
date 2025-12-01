import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-two-column-slide'
export const layoutName = 'Creative Two Column Slide'
export const layoutDescription = 'Playful two-column layout with artistic styling.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Two Perspectives').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Dream It').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Imagine the impossible',
        'Brainstorm freely',
        'Think big and bold'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Build It').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Execute with precision',
        'Iterate and refine',
        'Launch with confidence'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-7xl mb-12" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Two Perspectives'}
                    </h2>

                    <div className="flex gap-10 flex-1">
                        <div className="flex-1 border-4 rounded-3xl p-8 transform -rotate-2" style={{ borderColor: "var(--primary-accent-color, #e76f51)" }}>
                            <div className="mb-6">
                                <h3 className="text-4xl mb-2" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                    {slideData?.leftTitle || 'Dream It'}
                                </h3>
                                <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Imagine the impossible', 'Brainstorm freely', 'Think big and bold']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-3 h-3 rounded-full mt-2" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 border-4 rounded-3xl p-8 transform rotate-2" style={{ borderColor: "var(--secondary-accent-color, #f4a261)" }}>
                            <div className="mb-6">
                                <h3 className="text-4xl mb-2" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                    {slideData?.rightTitle || 'Build It'}
                                </h3>
                                <div className="w-16 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Execute with precision', 'Iterate and refine', 'Launch with confidence']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-3 h-3 rounded-full mt-2" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
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
