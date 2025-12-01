import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-quote-slide'
export const layoutName = 'Elegant Quote Slide'
export const layoutDescription = 'Sophisticated quote presentation with refined typography.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Excellence is not a skill, it is an attitude cultivated through continuous refinement.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Design Philosophy').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lato:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #faf8f5)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                        <path d="M50 80C50 65 60 55 75 55C85 55 90 60 90 70C90 85 75 95 60 110C55 115 50 120 50 125H95V135H40V130C40 120 50 110 65 95C75 85 80 80 80 70C80 65 77 62 72 62C65 62 60 67 60 80H50Z" fill="currentColor" style={{ color: "var(--primary-accent-color, #8b7355)" }}/>
                        <path d="M110 80C110 65 120 55 135 55C145 55 150 60 150 70C150 85 135 95 120 110C115 115 110 120 110 125H155V135H100V130C100 120 110 110 125 95C135 85 140 80 140 70C140 65 137 62 132 62C125 62 120 67 120 80H110Z" fill="currentColor" style={{ color: "var(--primary-accent-color, #8b7355)" }}/>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-4xl font-light leading-relaxed mb-12 italic" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                            {slideData?.quote || 'Excellence is not a skill, it is an attitude cultivated through continuous refinement.'}
                        </p>

                        <div className="w-20 h-px mx-auto mb-8" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                        <p className="text-xl font-light tracking-wide"
                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                            {slideData?.author || '— Design Philosophy'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
