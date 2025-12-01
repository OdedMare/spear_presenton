import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-title-slide'
export const layoutName = 'Gradient Title Slide'
export const layoutDescription = 'Modern title slide with smooth gradient backgrounds.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Gradient Flow').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Modern presentations with smooth color transitions').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--primary-accent-color, #667eea) 0%, var(--secondary-accent-color, #764ba2) 100%)", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-16 py-20 text-center">
                    <h1 className="text-7xl font-bold leading-tight mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Gradient Flow'}
                    </h1>

                    <div className="w-32 h-1 mb-8 bg-white/50"></div>

                    <p className="text-2xl font-normal max-w-3xl" style={{ color: "var(--text-body-color, #f0f0f0)" }}>
                        {slideData?.subtitle || 'Modern presentations with smooth color transitions'}
                    </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
        </>
    )
}

export default TitleSlideLayout
