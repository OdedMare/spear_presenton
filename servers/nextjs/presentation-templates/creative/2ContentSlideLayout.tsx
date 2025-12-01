import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-content-slide'
export const layoutName = 'Creative Content Slide'
export const layoutDescription = 'Artistic content layout with playful design.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Big Ideas').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Think outside the box with bold creativity',
        'Embrace unconventional approaches',
        'Transform ideas into visual experiences',
        'Make every moment memorable'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #fffbf0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-wide" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-20 right-20 w-40 h-40 rounded-full opacity-20" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                <div className="absolute bottom-20 left-40 w-32 h-32 opacity-10" style={{ background: "var(--primary-accent-color, #e76f51)", transform: "rotate(45deg)" }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-7xl mb-12" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Big Ideas'}
                    </h2>

                    <div className="flex gap-3 mb-12">
                        <div className="w-20 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                    </div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Think outside the box with bold creativity', 'Embrace unconventional approaches', 'Transform ideas into visual experiences', 'Make every moment memorable']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                                <p className="text-2xl font-light leading-relaxed"
                                   style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
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
