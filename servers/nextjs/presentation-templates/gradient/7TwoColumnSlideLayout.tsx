import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-two-column-slide'
export const layoutName = 'Gradient Two Column Slide'
export const layoutDescription = 'Modern two-column layout with gradient background.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Compare & Contrast').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Before').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Legacy systems',
        'Manual processes',
        'Limited scalability'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('After').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Modern infrastructure',
        'Automated workflows',
        'Unlimited growth potential'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Compare & Contrast'}
                    </h2>

                    <div className="flex gap-8 flex-1">
                        <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2 text-white">
                                    {slideData?.leftTitle || 'Before'}
                                </h3>
                                <div className="w-16 h-1 rounded-full bg-white/40"></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Legacy systems', 'Manual processes', 'Limited scalability']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-white mt-2.5"></div>
                                        <p className="text-xl font-light text-white/90">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2 text-white">
                                    {slideData?.rightTitle || 'After'}
                                </h3>
                                <div className="w-16 h-1 rounded-full bg-white/40"></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Modern infrastructure', 'Automated workflows', 'Unlimited growth potential']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-white mt-2.5"></div>
                                        <p className="text-xl font-light text-white/90">
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
