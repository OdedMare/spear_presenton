import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'tech-image-slide'
export const layoutName = 'Tech Image Slide'
export const layoutDescription = 'Technology-focused image slide.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Innovation Showcase').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Cutting-edge technology visualization').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a',
        __image_prompt__: 'Modern technology and innovation'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0f0f23)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                <div className="relative h-full">
                    <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover opacity-60" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                    <div className="absolute bottom-0 left-0 right-0 px-16 pb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-1" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                            <div className="w-6 h-1" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                        </div>
                        <h2 className="text-5xl font-bold mb-4" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Innovation Showcase'}
                        </h2>
                        <p className="text-xl" style={{ color: "var(--text-body-color, #a0a0b5)" }}>
                            {slideData?.description || 'Cutting-edge technology visualization'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
