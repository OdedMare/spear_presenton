import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-quote-slide'
export const layoutName = 'Vibrant Quote Slide'
export const layoutDescription = 'Colorful quote with energetic design.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Life is either a daring adventure or nothing at all.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Helen Keller').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold z-20" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-20 right-20 w-56 h-56 rounded-full opacity-15" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                <div className="absolute bottom-20 left-20 w-44 h-44 rounded-full opacity-15" style={{ background: "#4ecdc4" }}></div>

                <div className="absolute top-32 left-32 opacity-20">
                    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                        <text x="0" y="120" fontSize="140" fill="currentColor" style={{ color: "var(--primary-accent-color, #ff6b6b)" }} fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-5xl font-bold leading-relaxed mb-12" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                            {slideData?.quote || 'Life is either a daring adventure or nothing at all.'}
                        </p>

                        <div className="flex gap-2 justify-center mb-8">
                            <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                            <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                            <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                        </div>

                        <p className="text-2xl font-bold"
                           style={{ color: "var(--text-body-color, #636e72)" }}>
                            {slideData?.author || '— Helen Keller'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
