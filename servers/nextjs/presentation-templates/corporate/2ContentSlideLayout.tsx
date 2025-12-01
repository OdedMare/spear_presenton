import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-content-slide'
export const layoutName = 'Corporate Content Slide'
export const layoutDescription = 'Professional content slide with bullet points.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Core Values').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Integrity in all business dealings',
        'Excellence in service delivery',
        'Innovation through collaboration',
        'Commitment to sustainable growth'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>
                <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--primary-accent-color, #003d82)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}
                <div className="flex h-full px-16 pt-24 pb-12">
                    <div className="w-2 mr-8" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                    <div className="flex-1">
                        <h2 className="text-4xl font-bold mb-12" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                            {slideData?.title || 'Core Values'}
                        </h2>
                        <div className="space-y-6">
                            {(slideData?.bullets || ['Integrity in all business dealings', 'Excellence in service delivery', 'Innovation through collaboration', 'Commitment to sustainable growth']).map((bullet, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-3 h-3 rounded-full mt-2" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                                    <p className="text-xl leading-relaxed" style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                                        {bullet}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContentSlideLayout
