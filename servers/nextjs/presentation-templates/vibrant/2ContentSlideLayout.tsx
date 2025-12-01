import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-content-slide'
export const layoutName = 'Vibrant Content Slide'
export const layoutDescription = 'Colorful content slide with energetic design.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Highlights').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Bold colors that capture attention',
        'Dynamic layouts that energize',
        'Creative elements that inspire',
        'Vibrant designs that engage'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                <div className="absolute inset-0">
                    <div className="absolute top-20 right-10 w-48 h-48 rounded-full opacity-15" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                    <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full opacity-15" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Key Highlights'}
                    </h2>

                    <div className="flex gap-2 mb-12">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Bold colors that capture attention', 'Dynamic layouts that energize', 'Creative elements that inspire', 'Vibrant designs that engage']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-2" style={{ background: i % 3 === 0 ? "var(--primary-accent-color, #ff6b6b)" : i % 3 === 1 ? "var(--secondary-accent-color, #ffd93d)" : "#4ecdc4" }}></div>
                                <p className="text-2xl font-semibold leading-relaxed" style={{ color: "var(--text-body-color, #636e72)" }}>
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
