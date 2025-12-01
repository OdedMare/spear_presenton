import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-quote-slide'
export const layoutName = 'Gradient Quote Slide'
export const layoutDescription = 'Modern quote presentation with gradient background.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Innovation distinguishes between a leader and a follower.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Steve Jobs').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide text-white/80 z-20">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl bg-white"></div>
                </div>

                <div className="absolute top-20 left-20 opacity-20">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <text x="0" y="100" fontSize="120" fill="white" fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-5xl font-light leading-relaxed mb-12 text-white">
                            {slideData?.quote || 'Innovation distinguishes between a leader and a follower.'}
                        </p>

                        <div className="w-24 h-1 mx-auto mb-8 rounded-full bg-white/40"></div>

                        <p className="text-2xl font-semibold text-white/90">
                            {slideData?.author || '— Steve Jobs'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
