import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'minimal-image-slide'
export const layoutName = 'Minimal Image Slide'
export const layoutDescription = 'Minimalist image slide with subtle caption.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Story').meta({ description: "Slide title" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Minimalist workspace and design'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>
                <div className="flex flex-col h-full p-16">
                    <h2 className="text-4xl font-light mb-8" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Visual Story'}
                    </h2>

                    <div className="flex-1 overflow-hidden">
                        <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
