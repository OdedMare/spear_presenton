import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'bold-two-column-slide'
export const layoutName = 'Bold Two Column Slide'
export const layoutDescription = 'Bold slide with two-column layout for balanced content.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Two Perspectives').meta({
        description: "Slide title",
    }),
    leftTitle: z.string().min(2).max(40).default('Challenge').meta({
        description: "Left column title",
    }),
    leftContent: z.string().min(10).max(300).default('Understanding complex problems requires deep analysis and strategic thinking.').meta({
        description: "Left column content",
    }),
    rightTitle: z.string().min(2).max(40).default('Solution').meta({
        description: "Right column title",
    }),
    rightContent: z.string().min(10).max(300).default('Our innovative approach delivers results through proven methodologies and expertise.').meta({
        description: "Right column content",
    }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

interface TwoColumnSlideLayoutProps {
    data?: Partial<TwoColumnSlideData>
}

const TwoColumnSlideLayout: React.FC<TwoColumnSlideLayoutProps> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{
                    background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))",
                    fontFamily: "var(--heading-font-family, Montserrat, sans-serif)"
                }}
            >
                {/* Company Name */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-6 left-12">
                        <span className="text-sm font-bold tracking-wider uppercase opacity-70" style={{ color: 'var(--text-heading-color, #ffffff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full px-16 pt-20 pb-12">
                    <div className="mb-12">
                        <div className="w-16 h-1 mb-4" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                        <h2 className="text-5xl font-black uppercase" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Two Perspectives'}
                        </h2>
                    </div>

                    {/* Two Columns */}
                    <div className="grid grid-cols-2 gap-8 flex-1">
                        {/* Left Column */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-3 h-3 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                                <h3 className="text-2xl font-bold uppercase" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                    {slideData?.leftTitle || 'Challenge'}
                                </h3>
                            </div>
                            <p className="text-xl leading-relaxed"
                               style={{ color: "var(--text-body-color, #e5e5e5)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                {slideData?.leftContent || 'Understanding complex problems requires deep analysis and strategic thinking.'}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="absolute left-1/2 top-32 bottom-12 w-px" style={{ background: "var(--primary-accent-color, #ff6b35)", opacity: 0.3 }}></div>

                        {/* Right Column */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-3 h-3 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                                <h3 className="text-2xl font-bold uppercase" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                    {slideData?.rightTitle || 'Solution'}
                                </h3>
                            </div>
                            <p className="text-xl leading-relaxed"
                               style={{ color: "var(--text-body-color, #e5e5e5)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                {slideData?.rightContent || 'Our innovative approach delivers results through proven methodologies and expertise.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
            </div>
        </>
    )
}

export default TwoColumnSlideLayout
