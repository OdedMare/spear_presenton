import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-closing-slide'
export const layoutName = 'Professional Closing Slide'
export const layoutDescription = 'Business closing slide with contact information.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Thank You').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('We look forward to partnering with you').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('contact@professional.com').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-bold mb-8" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Thank You'}
                    </h1>

                    <div className="w-24 h-1 mb-12 mx-auto" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #4b5563)" }}>
                        {slideData?.subtitle || 'We look forward to partnering with you'}
                    </p>

                    <div className="border-2 rounded-lg px-8 py-4" style={{ borderColor: "var(--primary-accent-color, #1e40af)" }}>
                        <p className="text-2xl font-medium" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                            {slideData?.contact || 'contact@professional.com'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
