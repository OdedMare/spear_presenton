import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-content-slide'
export const layoutName = 'Elegant Content Slide'
export const layoutDescription = 'Sophisticated content layout with refined typography.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Insights').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Refined design principles for lasting impact',
        'Sophisticated typography choices enhance readability',
        'Balanced composition creates visual harmony',
        'Subtle elegance speaks volumes'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                    <div className="absolute top-20 right-20 w-48 h-48 rounded-full border-2" style={{ borderColor: "var(--primary-accent-color, #8b7355)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-light mb-12" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Key Insights'}
                    </h2>

                    <div className="w-20 h-px mb-12" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Refined design principles for lasting impact', 'Sophisticated typography choices enhance readability', 'Balanced composition creates visual harmony', 'Subtle elegance speaks volumes']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-6">
                                <div className="w-1.5 h-1.5 rounded-full mt-3" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                                <p className="text-2xl font-light leading-relaxed"
                                   style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
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
