import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-quote-slide'
export const layoutName = 'Minimal Quote Slide'
export const layoutDescription = 'Clean minimalist quote presentation.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(200).default('Simplicity is the ultimate sophistication.').meta({ description: "Quote text" }),
    author: z.string().min(2).max(50).default('— Leonardo da Vinci').meta({ description: "Quote author" }),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

const QuoteSlideLayout: React.FC<{data?: Partial<QuoteSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-xs font-light tracking-widest z-20" style={{ color: "var(--primary-accent-color, #000000)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20">
                    <div className="max-w-4xl text-center">
                        <div className="w-px h-12 mx-auto mb-12" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                        <p className="text-4xl font-extralight leading-relaxed mb-12" style={{ color: "var(--text-heading-color, #000000)" }}>
                            {slideData?.quote || 'Simplicity is the ultimate sophistication.'}
                        </p>

                        <div className="w-px h-12 mx-auto mb-8" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                        <p className="text-lg font-light tracking-wider"
                           style={{ color: "var(--text-body-color, #666666)" }}>
                            {slideData?.author || '— Leonardo da Vinci'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
