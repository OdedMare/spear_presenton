import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-content-slide'
export const layoutName = 'Bold Content Slide'
export const layoutDescription = 'Bold content slide with strong headings and bullet points.'

const contentSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Points').meta({
        description: "Slide title",
    }),
    bullets: z.array(z.string()).min(2).max(5).default([
        'Strong visual impact with bold typography',
        'Clean geometric elements for structure',
        'High contrast for maximum readability',
        'Professional yet powerful design'
    ]).meta({
        description: "Bullet points - keep them concise",
    }),
})

export const Schema = contentSlideSchema

export type ContentSlideData = z.infer<typeof contentSlideSchema>

interface ContentSlideLayoutProps {
    data?: Partial<ContentSlideData>
}

const ContentSlideLayout: React.FC<ContentSlideLayoutProps> = ({ data: slideData }) => {
    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap"
                rel="stylesheet"
            />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{
                    background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))",
                    fontFamily: "var(--heading-font-family, Montserrat, sans-serif)"
                }}
            >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5"
                     style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>

                {/* Company Name Header */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-6 left-12">
                        <span className="text-sm font-bold tracking-wider uppercase opacity-70"
                              style={{ color: 'var(--text-heading-color, #ffffff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Main Content */}
                <div className="relative z-10 flex flex-col h-full px-16 pt-20 pb-12">
                    {/* Title */}
                    <div className="mb-12">
                        <div className="w-16 h-1 mb-4" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                        <h2
                            className="text-5xl font-black uppercase tracking-tight"
                            style={{ color: "var(--text-heading-color, #ffffff)" }}
                        >
                            {slideData?.title || 'Key Points'}
                        </h2>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-6">
                        {(slideData?.bullets || [
                            'Strong visual impact with bold typography',
                            'Clean geometric elements for structure',
                            'High contrast for maximum readability',
                            'Professional yet powerful design'
                        ]).map((bullet, index) => (
                            <div key={index} className="flex items-start gap-6">
                                <div
                                    className="w-4 h-4 rounded-full mt-2 flex-shrink-0"
                                    style={{ background: "var(--primary-accent-color, #ff6b35)" }}
                                ></div>
                                <p
                                    className="text-2xl font-semibold leading-relaxed"
                                    style={{
                                        color: "var(--text-body-color, #e5e5e5)",
                                        fontFamily: "var(--body-font-family, Inter, sans-serif)"
                                    }}
                                >
                                    {bullet}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-2"
                     style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
            </div>
        </>
    )
}

export default ContentSlideLayout
