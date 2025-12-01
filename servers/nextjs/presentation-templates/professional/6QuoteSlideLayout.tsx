import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-quote-slide'
export const layoutName = 'Professional Quote Slide'
export const layoutDescription = 'Business quote with clean presentation.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Success is the result of perfection, hard work, learning from failure, loyalty, and persistence.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Colin Powell').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-medium tracking-wide z-20" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                <div className="absolute top-32 left-32 opacity-10">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <text x="0" y="80" fontSize="100" fill="currentColor" style={{ color: "var(--primary-accent-color, #1e40af)" }} fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-4xl font-light leading-relaxed mb-12" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                            {slideData?.quote || 'Success is the result of perfection, hard work, learning from failure, loyalty, and persistence.'}
                        </p>

                        <div className="w-20 h-1 mx-auto mb-8" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                        <p className="text-xl font-medium"
                           style={{ color: "var(--text-body-color, #4b5563)" }}>
                            {slideData?.author || '— Colin Powell'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
