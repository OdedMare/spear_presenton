import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-quote-slide'
export const layoutName = 'Bold Quote Slide'
export const layoutDescription = 'Bold slide for impactful quotes and testimonials.'

const quoteSlideSchema = z.object({
    quote: z.string().min(10).max(250).default('Success is not final, failure is not fatal: it is the courage to continue that counts.').meta({
        description: "The quote text",
    }),
    author: z.string().min(2).max(60).default('Winston Churchill').meta({
        description: "Quote author",
    }),
    role: z.string().min(2).max(80).default('Former Prime Minister').meta({
        description: "Author's role or title",
    }).optional(),
})

export const Schema = quoteSlideSchema
export type QuoteSlideData = z.infer<typeof quoteSlideSchema>

interface QuoteSlideLayoutProps {
    data?: Partial<QuoteSlideData>
}

const QuoteSlideLayout: React.FC<QuoteSlideLayoutProps> = ({ data: slideData }) => {
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
                {/* Large Quote Mark */}
                <div className="absolute top-16 left-16 text-9xl font-black opacity-10" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
                    "
                </div>

                {/* Company Name */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-6 left-12">
                        <span className="text-sm font-bold tracking-wider uppercase opacity-70" style={{ color: 'var(--text-heading-color, #ffffff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <p className="text-4xl font-bold leading-relaxed mb-12 max-w-4xl"
                       style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.quote || 'Success is not final, failure is not fatal: it is the courage to continue that counts.'}
                    </p>

                    <div className="w-24 h-1 mb-8" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>

                    <div className="space-y-2">
                        <div className="text-2xl font-bold uppercase tracking-wide" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
                            {slideData?.author || 'Winston Churchill'}
                        </div>
                        {slideData?.role && (
                            <div className="text-lg font-semibold"
                                 style={{ color: "var(--text-body-color, #cccccc)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                {slideData.role}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
            </div>
        </>
    )
}

export default QuoteSlideLayout
