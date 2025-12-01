import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-closing-slide'
export const layoutName = 'Corporate Closing Slide'
export const layoutDescription = 'Professional business closing with contact.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Thank You').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Building the future of business together').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('contact@corporate.com').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5" style={{ background: `linear-gradient(135deg, var(--primary-accent-color, #003d82), transparent)` }}></div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-bold mb-8" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                        {slideData?.title || 'Thank You'}
                    </h1>

                    <div className="w-24 h-1 mb-12 mx-auto" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                        {slideData?.subtitle || 'Building the future of business together'}
                    </p>

                    <div className="bg-white rounded-lg shadow-md px-10 py-5">
                        <p className="text-2xl font-semibold" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                            {slideData?.contact || 'contact@corporate.com'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
