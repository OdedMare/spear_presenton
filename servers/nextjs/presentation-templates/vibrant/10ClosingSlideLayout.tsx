import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-closing-slide'
export const layoutName = 'Vibrant Closing Slide'
export const layoutDescription = 'Colorful closing with energetic finale.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('Stay Colorful!').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Thank you for joining our vibrant journey').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('hello@vibrant.studio').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold z-20" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-15" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-15" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full opacity-10" style={{ background: "#4ecdc4" }}></div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-bold mb-8" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Stay Colorful!'}
                    </h1>

                    <div className="flex gap-3 justify-center mb-12">
                        <div className="w-24 h-3 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-20 h-3 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-16 h-3 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <p className="text-3xl font-bold mb-12 max-w-3xl"
                       style={{ color: "var(--text-body-color, #636e72)" }}>
                        {slideData?.subtitle || 'Thank you for joining our vibrant journey'}
                    </p>

                    <div className="rounded-3xl px-12 py-6 border-4" style={{ borderColor: "var(--primary-accent-color, #ff6b6b)", background: "rgba(255, 107, 107, 0.1)" }}>
                        <p className="text-2xl font-bold" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                            {slideData?.contact || 'hello@vibrant.studio'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
