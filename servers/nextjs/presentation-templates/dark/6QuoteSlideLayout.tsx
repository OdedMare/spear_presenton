import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-quote-slide'
export const layoutName = 'Dark Quote Slide'
export const layoutDescription = 'Elegant dark theme quote presentation.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('In the midst of darkness, light persists.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Mahatma Gandhi').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide text-white/60 z-20">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                        <text x="0" y="160" fontSize="200" fill="currentColor" style={{ color: "var(--primary-accent-color, #6366f1)" }} fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-5xl font-light leading-relaxed mb-12 italic" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.quote || 'In the midst of darkness, light persists.'}
                        </p>

                        <div className="w-24 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #6366f1), transparent)` }}></div>

                        <p className="text-xl font-light tracking-wide text-white/70"
                           style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                            {slideData?.author || '— Mahatma Gandhi'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
