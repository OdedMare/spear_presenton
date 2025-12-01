import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-title-slide'
export const layoutName = 'Creative Title Slide'
export const layoutDescription = 'Artistic and innovative title slide with creative layouts.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Creative Minds').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Where imagination meets innovation').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@400;600&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #f5f3f0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}
            >
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-1/3 h-full">
                        <svg className="w-full h-full" viewBox="0 0 400 600">
                            <path d="M 0,0 Q 100,150 0,300 T 0,600 Z" fill="var(--primary-accent-color, #e76f51)" opacity="0.15" />
                        </svg>
                    </div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2">
                        <svg className="w-full h-full" viewBox="0 0 500 300">
                            <circle cx="400" cy="250" r="150" fill="var(--secondary-accent-color, #f4a261)" opacity="0.1" />
                        </svg>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full px-20 py-20">
                    <div className="max-w-3xl">
                        <h1 className="text-8xl font-normal italic leading-none mb-8" style={{ color: "var(--text-heading-color, #264653)" }}>
                            {slideData?.title || 'Creative Minds'}
                        </h1>

                        <div className="w-full h-2 mb-10 rounded-full" style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #e76f51) 0%, var(--secondary-accent-color, #f4a261) 50%, transparent 100%)" }}></div>

                        <p className="text-2xl font-normal" style={{ color: "var(--text-body-color, #2a9d8f)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                            {slideData?.subtitle || 'Where imagination meets innovation'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
