import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-two-column-slide'
export const layoutName = 'Vibrant Two Column Slide'
export const layoutDescription = 'Colorful two-column comparison layout.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Compare & Choose').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Plan A').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'Quick start option',
        'Perfect for beginners',
        'Budget friendly'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Plan B').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Full feature access',
        'Advanced capabilities',
        'Maximum value'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Compare & Choose'}
                    </h2>

                    <div className="flex gap-2 mb-12">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <div className="flex gap-10 flex-1">
                        <div className="flex-1 rounded-3xl p-8 border-4" style={{ borderColor: "var(--primary-accent-color, #ff6b6b)", background: "rgba(255, 107, 107, 0.05)" }}>
                            <div className="mb-6">
                                <h3 className="text-4xl font-bold mb-2" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                                    {slideData?.leftTitle || 'Plan A'}
                                </h3>
                                <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['Quick start option', 'Perfect for beginners', 'Budget friendly']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-3 h-3 rounded-full mt-2" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                                        <p className="text-xl font-semibold"
                                           style={{ color: "var(--text-body-color, #636e72)" }}>
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 rounded-3xl p-8 border-4" style={{ borderColor: "#4ecdc4", background: "rgba(78, 205, 196, 0.05)" }}>
                            <div className="mb-6">
                                <h3 className="text-4xl font-bold mb-2" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                                    {slideData?.rightTitle || 'Plan B'}
                                </h3>
                                <div className="w-16 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Full feature access', 'Advanced capabilities', 'Maximum value']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-3 h-3 rounded-full mt-2" style={{ background: "#4ecdc4" }}></div>
                                        <p className="text-xl font-semibold"
                                           style={{ color: "var(--text-body-color, #636e72)" }}>
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
