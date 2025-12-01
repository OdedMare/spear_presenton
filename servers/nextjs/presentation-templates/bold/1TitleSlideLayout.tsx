import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-title-slide'
export const layoutName = 'Bold Title Slide'
export const layoutDescription = 'A bold, impactful title slide with strong typography and geometric elements.'

const titleSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Make Bold Statements').meta({
        description: "Main title of the presentation",
    }),
    subtitle: z.string().min(10).max(150).default('Powerful presentations that demand attention').meta({
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
                {/* Geometric Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 right-10 w-96 h-96 rounded-full opacity-10"
                         style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                    <div className="absolute bottom-10 left-10 w-64 h-64 rotate-45 opacity-10"
                         style={{ background: "var(--secondary-accent-color, #f7931e)" }}></div>
                </div>

                {/* Company Name Header */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-12 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-12" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                            <span className="text-lg font-bold tracking-wider uppercase"
                                  style={{ color: 'var(--text-heading-color, #ffffff)' }}>
                                {(slideData as any)?.__companyName__}
                            </span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="relative z-10 flex flex-col justify-center h-full px-16 py-20">
                    {/* Title */}
                    <h1
                        className="text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight"
                        style={{
                            color: "var(--text-heading-color, #ffffff)",
                            textTransform: "uppercase",
                            letterSpacing: "-0.02em"
                        }}
                    >
                        {slideData?.title || 'Make Bold Statements'}
                    </h1>

                    {/* Accent Bar */}
                    <div className="w-32 h-2 mb-8" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>

                    {/* Subtitle */}
                    <p
                        className="text-2xl font-semibold max-w-3xl"
                        style={{
                            color: "var(--text-body-color, #cccccc)",
                            fontFamily: "var(--body-font-family, Inter, sans-serif)"
                        }}
                    >
                        {slideData?.subtitle || 'Powerful presentations that demand attention'}
                    </p>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-3"
                     style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #ff6b35) 0%, var(--secondary-accent-color, #f7931e) 100%)" }}>
                </div>
            </div>
        </>
    )
}

export default TitleSlideLayout
