import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-closing-slide'
export const layoutName = 'Dark Closing Slide'
export const layoutDescription = 'Elegant dark theme closing slide.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Thank You').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Elegance in every detail').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('contact@elegant.design').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #6366f1)" }}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Thank You'}
                    </h1>

                    <div className="w-24 h-px mb-12 mx-auto" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #6366f1), transparent)` }}></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl text-white/80"
                       style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                        {slideData?.subtitle || 'Elegance in every detail'}
                    </p>

                    <p className="text-xl font-light tracking-wide text-white/60"
                       style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                        {slideData?.contact || 'contact@elegant.design'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
