import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-two-column-slide'
export const layoutName = 'Elegant Two Column Slide'
export const layoutDescription = 'Refined two-column layout for balanced content.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Balanced Approach').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Tradition').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Timeless principles',
        'Proven methods',
        'Classic aesthetics'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Innovation').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Modern techniques',
        'Fresh perspectives',
        'Contemporary design'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-light mb-12" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Balanced Approach'}
                    </h2>

                    <div className="flex gap-12 flex-1">
                        <div className="flex-1">
                            <div className="mb-6">
                                <h3 className="text-3xl font-normal mb-2" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                    {slideData?.leftTitle || 'Tradition'}
                                </h3>
                                <div className="w-16 h-px" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Timeless principles', 'Proven methods', 'Classic aesthetics']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-px" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                        <div className="flex-1">
                            <div className="mb-6">
                                <h3 className="text-3xl font-normal mb-2" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                    {slideData?.rightTitle || 'Innovation'}
                                </h3>
                                <div className="w-16 h-px" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Modern techniques', 'Fresh perspectives', 'Contemporary design']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
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
