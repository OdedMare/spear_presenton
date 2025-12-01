import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'dark-image-slide'
export const layoutName = 'Dark Image Slide'
export const layoutDescription = 'Elegant dark theme image slide.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Impact').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Sophisticated imagery in elegant darkness').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Elegant and sophisticated scene'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                <div className="flex h-full p-16">
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h2 className="text-6xl font-bold leading-tight mb-6" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                {slideData?.title || 'Visual Impact'}
                            </h2>

                            <div className="w-24 h-1 mb-8" style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #6366f1) 0%, transparent 100%)" }}></div>

                            <p className="text-xl font-light max-w-lg"
                               style={{ color: "var(--text-body-color, #a3a3a3)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                {slideData?.description || 'Sophisticated imagery in elegant darkness'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-end">
                        <div className="w-full max-w-lg h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
