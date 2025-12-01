import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-title-slide'
export const layoutName = 'Vibrant Title Slide'
export const layoutDescription = 'Colorful and energetic title slide with dynamic design.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Vibrant Energy').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Bold colors and dynamic designs that energize').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}
            >
                <div className="absolute inset-0">
                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                    <div className="absolute top-20 right-10 w-48 h-48 rounded-full opacity-25" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                    <div className="absolute bottom-10 right-40 w-56 h-56 rounded-full opacity-20" style={{ background: "#4ecdc4" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <h1 className="text-8xl font-bold leading-none mb-8" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Vibrant Energy'}
                    </h1>

                    <div className="flex gap-2 mb-8">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <p className="text-2xl font-semibold max-w-2xl" style={{ color: "var(--text-body-color, #636e72)" }}>
                        {slideData?.subtitle || 'Bold colors and dynamic designs that energize'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
