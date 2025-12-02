import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-closing-slide'
export const layoutName = 'Minimal Closing Slide'
export const layoutDescription = 'Clean minimalist closing.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Thank You').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Less is more').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('hello@minimal.design').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <div className="w-px h-24 mx-auto mb-12" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                    <h1 className="text-8xl font-extralight mb-8" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Thank You'}
                    </h1>

                    <p className="text-3xl font-light mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #666666)" }}>
                        {slideData?.subtitle || 'Less is more'}
                    </p>

                    <div className="w-px h-24 mx-auto mb-12" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                    <p className="text-lg font-light tracking-wider"
                       style={{ color: "var(--text-body-color, #666666)" }}>
                        {slideData?.contact || 'hello@minimal.design'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
