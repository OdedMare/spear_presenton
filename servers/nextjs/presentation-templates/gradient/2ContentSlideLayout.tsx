import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-content-slide'
export const layoutName = 'Gradient Content Slide'
export const layoutDescription = 'Modern gradient content layout with flowing design.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Points').meta({ description: "Slide title" }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Modern gradient aesthetics create visual flow',
        'Seamless color transitions enhance engagement',
        'Contemporary design meets functionality',
        'Innovation through visual storytelling'
    ]).meta({ description: "Bullet points" }),
})

export const Schema = contentSlideSchema
export type ContentSlideData = z.infer<typeof contentSlideSchema>

const ContentSlideLayout: React.FC<{data?: Partial<ContentSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl bg-white"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Key Points'}
                    </h2>

                    <div className="w-24 h-1 mb-12 rounded-full bg-white/40"></div>

                    <div className="space-y-6">
                        {(slideData?.bullets || ['Modern gradient aesthetics create visual flow', 'Seamless color transitions enhance engagement', 'Contemporary design meets functionality', 'Innovation through visual storytelling']).map((bullet, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full bg-white mt-2.5"></div>
                                <p className="text-2xl font-light leading-relaxed text-white/95">
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
