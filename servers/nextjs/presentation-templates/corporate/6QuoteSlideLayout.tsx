import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-quote-slide'
export const layoutName = 'Corporate Quote Slide'
export const layoutDescription = 'Professional business quote presentation.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('The best way to predict the future is to create it.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Peter Drucker').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #f8f9fa)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold z-20" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-20 left-20 opacity-10">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <text x="0" y="100" fontSize="120" fill="currentColor" style={{ color: "var(--primary-accent-color, #003d82)" }} fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-4xl font-light leading-relaxed mb-12" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                            {slideData?.quote || 'The best way to predict the future is to create it.'}
                        </p>

                        <div className="w-20 h-1 mx-auto mb-8" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                        <p className="text-xl font-semibold"
                           style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                            {slideData?.author || '— Peter Drucker'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
