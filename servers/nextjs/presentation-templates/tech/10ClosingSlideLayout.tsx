import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-closing-slide'
export const layoutName = 'Tech Closing Slide'
export const layoutDescription = 'Modern tech closing with vibrant glow.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default("Let's Build the Future").meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Innovate. Develop. Deploy.').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('dev@tech.io').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0e1a)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide z-20" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-7xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || "Let's Build the Future"}
                    </h1>

                    <div className="w-32 h-1 mb-12 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, var(--primary-accent-color, #00d9ff), var(--secondary-accent-color, #8b5cf6))` }}></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl text-white/80">
                        {slideData?.subtitle || "Innovate. Develop. Deploy."}
                    </p>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-5 border border-cyan-500/30">
                        <p className="text-2xl font-semibold" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                            {slideData?.contact || 'dev@tech.io'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
