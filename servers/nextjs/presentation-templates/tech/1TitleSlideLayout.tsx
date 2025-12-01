import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-title-slide'
export const layoutName = 'Tech Title Slide'
export const layoutDescription = 'Technology-focused title slide with modern tech aesthetics.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Tech Forward').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Innovation through technology and design').meta({
        description: "Subtitle or tagline",
    }),
})

export const Schema = titleSlideSchema
export type TitleSlideData = z.infer<typeof titleSlideSchema>

interface TitleSlideLayoutProps {
    data?: Partial<TitleSlideData>
}

const TitleSlideLayout: React.FC<TitleSlideLayoutProps> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #0f0f23)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}
            >
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                        <svg className="w-full h-full" viewBox="0 0 400 400">
                            <circle cx="300" cy="100" r="100" fill="var(--primary-accent-color, #00d9ff)" />
                            <circle cx="350" cy="250" r="80" fill="var(--secondary-accent-color, #8b5cf6)" />
                        </svg>
                    </div>
                </div>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'var(--primary-accent-color, #00d9ff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col justify-center h-full px-16 py-20">
                    <h1 className="text-7xl font-bold leading-tight mb-6" style={{ color: "var(--text-heading-color, #ffffff)", letterSpacing: "-0.02em" }}>
                        {slideData?.title || 'Tech Forward'}
                    </h1>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-1" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                        <div className="w-6 h-1" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                    </div>

                    <p className="text-2xl font-normal max-w-2xl" style={{ color: "var(--text-body-color, #a0a0b5)" }}>
                        {slideData?.subtitle || 'Innovation through technology and design'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
