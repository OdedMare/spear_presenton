import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-content-slide'
export const layoutName = 'Tech Content Slide'
export const layoutDescription = 'Technology-focused content slide with modern styling.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Core Features').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Scalable cloud infrastructure',
        'Real-time data processing',
        'Advanced security protocols',
        'API-first architecture'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0f0f23)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'var(--primary-accent-color, #00d9ff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col justify-center h-full px-16 py-20">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-1" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                            <div className="w-6 h-1" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                        </div>
                        <h2 className="text-5xl font-bold" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Core Features'}
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Scalable cloud infrastructure', 'Real-time data processing', 'Advanced security protocols', 'API-first architecture']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-3" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                                <p className="text-2xl leading-relaxed" style={{ color: "var(--text-body-color, #a0a0b5)" }}>
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
