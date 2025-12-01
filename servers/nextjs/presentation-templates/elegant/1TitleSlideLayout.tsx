import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-title-slide'
export const layoutName = 'Elegant Title Slide'
export const layoutDescription = 'Refined and sophisticated title slide with subtle elegance.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Timeless Elegance').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Sophisticated design with refined aesthetics').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #fafaf9)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}
            >
                <div className="absolute top-0 right-0 bottom-0 w-px opacity-20" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                <div className="absolute top-0 left-0 right-0 h-px opacity-20" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                <div className="flex flex-col justify-center items-center h-full px-24 py-20 text-center">
                    <div className="w-20 h-px mb-12" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                    <h1 className="text-7xl font-semibold leading-tight mb-10" style={{ color: "var(--text-heading-color, #3e3832)" }}>
                        {slideData?.title || 'Timeless Elegance'}
                    </h1>

                    <p className="text-xl font-light max-w-2xl tracking-wide" style={{ color: "var(--text-body-color, #78716c)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                        {slideData?.subtitle || 'Sophisticated design with refined aesthetics'}
                    </p>

                    <div className="w-20 h-px mt-12" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
