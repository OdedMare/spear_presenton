import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-two-column-slide'
export const layoutName = 'Dark Two Column Slide'
export const layoutDescription = 'Elegant dark theme two-column layout.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Duality').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Light').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Clarity and transparency',
        'Openness and visibility',
        'Bright perspectives'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Shadow').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Depth and mystery',
        'Elegant sophistication',
        'Refined darkness'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide text-white/60">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Duality'}
                    </h2>

                    <div className="w-24 h-px mb-12" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #6366f1), transparent)` }}></div>

                    <div className="flex gap-12 flex-1">
                        <div className="flex-1 border border-white/10 rounded-xl p-8">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                    {slideData?.leftTitle || 'Light'}
                                </h3>
                                <div className="w-16 h-px" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Clarity and transparency', 'Openness and visibility', 'Bright perspectives']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                                        <p className="text-xl font-light text-white/80"
                                           style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-px" style={{ background: "linear-gradient(to bottom, var(--primary-accent-color, #6366f1), var(--secondary-accent-color, #8b5cf6))" }}></div>

                        <div className="flex-1 border border-white/10 rounded-xl p-8">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                    {slideData?.rightTitle || 'Shadow'}
                                </h3>
                                <div className="w-16 h-px" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Depth and mystery', 'Elegant sophistication', 'Refined darkness']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full mt-2.5" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                                        <p className="text-xl font-light text-white/80"
                                           style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
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
