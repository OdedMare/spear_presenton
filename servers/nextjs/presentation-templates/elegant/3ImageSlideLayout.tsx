import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'elegant-image-slide'
export const layoutName = 'Elegant Image Slide'
export const layoutDescription = 'Refined image presentation with sophisticated framing.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Refinement').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Where elegance meets visual storytelling').meta({ description: "Image description" }),
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
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lato:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #faf8f5)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="flex h-full p-16">
                    <div className="flex-1 flex flex-col justify-center pr-12">
                        <h2 className="text-5xl font-light leading-tight mb-6" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                            {slideData?.title || 'Visual Refinement'}
                        </h2>

                        <div className="w-20 h-px mb-8" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                        <p className="text-xl font-light leading-relaxed max-w-md"
                           style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                            {slideData?.description || 'Where elegance meets visual storytelling'}
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-end">
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-full h-full border-2 rounded" style={{ borderColor: "var(--primary-accent-color, #8b7355)" }}></div>
                            <div className="relative w-full max-w-lg h-96 rounded overflow-hidden shadow-xl">
                                <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
