import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-content-slide'
export const layoutName = 'Minimal Content Slide'
export const layoutDescription = 'Clean minimalist content slide with bullet points.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Points').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Focus on what matters most',
        'Remove unnecessary elements',
        'Embrace whitespace and clarity',
        'Let content speak for itself'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>
                <div className="flex flex-col justify-center h-full px-24 py-20">
                    <h2 className="text-5xl font-light mb-16" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Key Points'}
                    </h2>

                    <div className="space-y-8">
                        {(slideData?.bullets || ['Focus on what matters most', 'Remove unnecessary elements', 'Embrace whitespace and clarity', 'Let content speak for itself']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-6">
                                <div className="w-2 h-2 rounded-full mt-3" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
                                <p className="text-2xl font-light leading-relaxed" style={{ color: "var(--text-body-color, #666666)" }}>
                                    {bullet}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContentSlideLayout
