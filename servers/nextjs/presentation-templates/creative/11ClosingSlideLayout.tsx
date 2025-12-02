import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-closing-slide'
export const layoutName = 'Creative Closing Slide'
export const layoutDescription = 'Artistic closing slide with playful energy.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default("Let's Create Magic").meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Together we can turn imagination into reality').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('hello@creative.studio').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-15" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                <div className="absolute bottom-10 left-10 w-48 h-48 opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)", transform: "rotate(45deg)" }}></div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl mb-8" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || "Let's Create Magic"}
                    </h1>

                    <div className="flex gap-3 justify-center mb-12">
                        <div className="w-24 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                    </div>

                    <p className="text-3xl font-light mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                        {slideData?.subtitle || "Together we can turn imagination into reality"}
                    </p>

                    <div className="border-4 rounded-3xl px-10 py-5 transform -rotate-2" style={{ borderColor: "var(--primary-accent-color, #e76f51)" }}>
                        <p className="text-2xl font-bold" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                            {slideData?.contact || 'hello@creative.studio'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
