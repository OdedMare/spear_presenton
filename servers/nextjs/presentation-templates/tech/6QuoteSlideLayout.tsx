import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-quote-slide'
export const layoutName = 'Tech Quote Slide'
export const layoutDescription = 'Modern tech quote with glowing effects.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Technology is best when it brings people together.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Matt Mullenweg').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0e1a)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide z-20" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-15">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-5xl font-light leading-relaxed mb-12" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.quote || 'Technology is best when it brings people together.'}
                        </p>

                        <div className="w-24 h-1 mx-auto mb-8 rounded-full" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #00d9ff), var(--secondary-accent-color, #8b5cf6))` }}></div>

                        <p className="text-2xl font-semibold" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                            {slideData?.author || '— Matt Mullenweg'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
