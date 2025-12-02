import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-two-column-slide'
export const layoutName = 'Minimal Two Column Slide'
export const layoutDescription = 'Clean two-column minimalist layout.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Contrast').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Less').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Remove unnecessary elements',
        'Focus on essentials',
        'Embrace white space'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('More').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Increased clarity',
        'Enhanced focus',
        'Greater impact'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-5xl font-extralight mb-12" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Contrast'}
                    </h2>

                    <div className="flex gap-16 flex-1">
                        <div className="flex-1">
                            <div className="mb-8">
                                <h3 className="text-3xl font-light mb-4" style={{ color: "var(--text-heading-color, #000000)" }}>
                                    {slideData?.leftTitle || 'Less'}
                                </h3>
                                <div className="w-px h-8" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
                            </div>
                            <div className="space-y-6">
                                {(slideData?.leftPoints || ['Remove unnecessary elements', 'Focus on essentials', 'Embrace white space']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-px h-6 mt-1" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #666666)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-px" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                        <div className="flex-1">
                            <div className="mb-8">
                                <h3 className="text-3xl font-light mb-4" style={{ color: "var(--text-heading-color, #000000)" }}>
                                    {slideData?.rightTitle || 'More'}
                                </h3>
                                <div className="w-px h-8" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
                            </div>
                            <div className="space-y-6">
                                {(slideData?.rightPoints || ['Increased clarity', 'Enhanced focus', 'Greater impact']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-px h-6 mt-1" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
                                        <p className="text-xl font-light"
                                           style={{ color: "var(--text-body-color, #666666)" }}>
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
