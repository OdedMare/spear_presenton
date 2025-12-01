import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-title-slide'
export const layoutName = 'Corporate Title Slide'
export const layoutDescription = 'Professional corporate title slide with clean layout and trustworthy design.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Corporate Excellence').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(150).default('Professional solutions for modern business').meta({
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
            <link
                href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap"
                rel="stylesheet"
            />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{
                    background: "var(--card-background-color, #ffffff)",
                    fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)"
                }}
            >
                {/* Top Header Bar */}
                <div className="absolute top-0 left-0 right-0 h-2"
                     style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                {/* Company Logo/Name Area */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wide"
                              style={{ color: 'var(--primary-accent-color, #003d82)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Main Content Container */}
                <div className="flex h-full">
                    {/* Left Side - Content */}
                    <div className="flex-[3] flex flex-col justify-center px-16 py-20">
                        <h1
                            className="text-6xl font-bold leading-tight mb-6"
                            style={{ color: "var(--text-heading-color, #1a1a1a)" }}
                        >
                            {slideData?.title || 'Corporate Excellence'}
                        </h1>

                        <div className="w-24 h-1 mb-8"
                             style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                        <p
                            className="text-xl font-normal max-w-xl leading-relaxed"
                            style={{ color: "var(--text-body-color, #4a4a4a)" }}
                        >
                            {slideData?.subtitle || 'Professional solutions for modern business'}
                        </p>
                    </div>

                    {/* Right Side - Accent */}
                    <div className="flex-[2] relative">
                        <div className="absolute inset-0 opacity-5"
                             style={{ background: "linear-gradient(180deg, var(--primary-accent-color, #003d82) 0%, var(--secondary-accent-color, #0059b3) 100%)" }}>
                        </div>
                        <div className="absolute bottom-16 right-16 w-48 h-48 border-4 opacity-10"
                             style={{ borderColor: "var(--primary-accent-color, #003d82)" }}></div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
