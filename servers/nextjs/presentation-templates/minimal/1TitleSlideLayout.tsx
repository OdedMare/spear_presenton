import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-title-slide'
export const layoutName = 'Minimal Title Slide'
export const layoutDescription = 'Clean minimalist title slide with maximum whitespace and focused content.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Less is More').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(120).default('Simplicity is the ultimate sophistication').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}
            >
                <div className="flex flex-col justify-center items-center h-full px-20 py-20">
                    <h1 className="text-7xl font-light text-center leading-tight mb-6" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Less is More'}
                    </h1>

                    <div className="w-16 h-px mb-8" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                    <p className="text-xl font-light text-center max-w-2xl" style={{ color: "var(--text-body-color, #666666)" }}>
                        {slideData?.subtitle || 'Simplicity is the ultimate sophistication'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
