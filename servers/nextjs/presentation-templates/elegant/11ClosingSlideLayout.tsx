import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-closing-slide'
export const layoutName = 'Elegant Closing Slide'
export const layoutDescription = 'Refined closing slide with call to action.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Thank You').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Let us create something extraordinary together').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('contact@elegant.design').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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
                    <div className="w-96 h-96 rounded-full border-2" style={{ borderColor: "var(--primary-accent-color, #8b7355)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-light mb-8" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Thank You'}
                    </h1>

                    <div className="w-24 h-px mb-12 mx-auto" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                        {slideData?.subtitle || 'Let us create something extraordinary together'}
                    </p>

                    <p className="text-xl font-light tracking-wide"
                       style={{ color: "var(--primary-accent-color, #8b7355)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                        {slideData?.contact || 'contact@elegant.design'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
