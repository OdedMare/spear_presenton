import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-closing-slide'
export const layoutName = 'Gradient Closing Slide'
export const layoutDescription = 'Modern closing slide with flowing gradient.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default("Let's Build Together").meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Ready to transform your vision into reality').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('hello@gradient.design').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide text-white/80 z-20">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl bg-white"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-white"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-7xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || "Let's Build Together"}
                    </h1>

                    <div className="w-32 h-1 mb-12 mx-auto rounded-full bg-white/40"></div>

                    <p className="text-3xl font-light mb-12 max-w-3xl text-white/90">
                        {slideData?.subtitle || "Ready to transform your vision into reality"}
                    </p>

                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/30">
                        <p className="text-2xl font-semibold text-white">
                            {slideData?.contact || 'hello@gradient.design'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
