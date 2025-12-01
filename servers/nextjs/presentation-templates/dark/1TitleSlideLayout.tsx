import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-title-slide'
export const layoutName = 'Dark Title Slide'
export const layoutDescription = 'Elegant dark theme title slide with sophisticated contrast.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Into the Dark').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Elegant presentations with sophisticated dark aesthetics').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}
            >
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h1 className="text-7xl font-bold leading-tight mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Into the Dark'}
                    </h1>

                    <div className="w-24 h-1 mb-8" style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #6366f1) 0%, transparent 100%)" }}></div>

                    <p className="text-2xl font-light max-w-2xl" style={{ color: "var(--text-body-color, #a3a3a3)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                        {slideData?.subtitle || 'Elegant presentations with sophisticated dark aesthetics'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
