import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-content-slide'
export const layoutName = 'Professional Content Slide'
export const layoutDescription = 'Classic business content layout.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Objectives').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Drive measurable business growth',
        'Enhance operational efficiency',
        'Deliver exceptional client value',
        'Foster sustainable innovation'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-medium tracking-wide" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Key Objectives'}
                    </h2>

                    <div className="w-20 h-1 mb-12" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Drive measurable business growth', 'Enhance operational efficiency', 'Deliver exceptional client value', 'Foster sustainable innovation']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-2 h-2 mt-2.5" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
                                <p className="text-2xl font-light leading-relaxed"
                                   style={{ color: "var(--text-body-color, #4b5563)" }}>
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
