import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-title-slide'
export const layoutName = 'Professional Title Slide'
export const layoutDescription = 'Classic business title slide with professional aesthetics.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(70).default('Professional Standards').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(140).default('Excellence in every detail').meta({
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
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}
            >
                <div className="absolute top-0 left-0 right-0 h-4" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-12 right-16">
                        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--primary-accent-color, #1e40af)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="flex h-full">
                    <div className="w-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                    <div className="flex-1 flex flex-col justify-center px-20 py-20">
                        <h1 className="text-6xl font-bold leading-tight mb-8" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                            {slideData?.title || 'Professional Standards'}
                        </h1>

                        <div className="w-24 h-1 mb-8" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                        <p className="text-xl font-normal max-w-2xl" style={{ color: "var(--text-body-color, #6b7280)" }}>
                            {slideData?.subtitle || 'Excellence in every detail'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
