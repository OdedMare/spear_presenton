import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'corporate-image-slide'
export const layoutName = 'Corporate Image Slide'
export const layoutDescription = 'Professional image slide with caption.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Excellence').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Professional imagery that communicates your message clearly').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
        __image_prompt__: 'Professional business team meeting'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>
                <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 z-10">
                        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--primary-accent-color, #003d82)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="flex h-full px-16 pt-24 pb-12">
                    <div className="w-2 mr-8" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-4xl font-bold mb-8" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                            {slideData?.title || 'Visual Excellence'}
                        </h2>

                        <div className="flex-1 rounded-lg overflow-hidden shadow-lg mb-6">
                            <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                        </div>

                        <p className="text-lg" style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                            {slideData?.description || 'Professional imagery that communicates your message clearly'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
