import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-quote-slide'
export const layoutName = 'Creative Quote Slide'
export const layoutDescription = 'Artistic quote presentation with playful design.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Creativity is intelligence having fun.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Albert Einstein').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #fffbf0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-wide z-20" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-20 right-20 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)", transform: "rotate(45deg)" }}></div>

                <div className="absolute top-32 left-32 opacity-30">
                    <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
                        <text x="0" y="120" fontSize="150" fill="currentColor" style={{ color: "var(--primary-accent-color, #e76f51)" }} fontFamily="Georgia, serif">"</text>
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <p className="text-5xl leading-relaxed mb-12 italic" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                            {slideData?.quote || 'Creativity is intelligence having fun.'}
                        </p>

                        <div className="flex gap-3 justify-center mb-8">
                            <div className="w-20 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                            <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                        </div>

                        <p className="text-2xl font-bold"
                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                            {slideData?.author || '— Albert Einstein'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
