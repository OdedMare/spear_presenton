import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-content-slide'
export const layoutName = 'Dark Content Slide'
export const layoutDescription = 'Elegant dark theme content slide.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Core Principles').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Sophisticated design with elegant contrast',
        'Modern aesthetics for premium impact',
        'Dark themes that command attention',
        'Refined typography for clarity'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Core Principles'}
                    </h2>

                    <div className="w-24 h-1 mb-12" style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #6366f1) 0%, transparent 100%)" }}></div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Sophisticated design with elegant contrast', 'Modern aesthetics for premium impact', 'Dark themes that command attention', 'Refined typography for clarity']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-3" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                                <p className="text-2xl font-light leading-relaxed"
                                   style={{ color: "var(--text-body-color, #a3a3a3)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
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
