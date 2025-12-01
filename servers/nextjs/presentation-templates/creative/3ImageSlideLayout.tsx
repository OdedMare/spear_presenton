import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'creative-image-slide'
export const layoutName = 'Creative Image Slide'
export const layoutDescription = 'Artistic image presentation with playful framing.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Story').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Every image tells a unique and creative story').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Creative and artistic scene'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-10 right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>

                <div className="flex flex-col h-full p-16">
                    <div className="mb-8">
                        <h2 className="text-6xl mb-4" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                            {slideData?.title || 'Visual Story'}
                        </h2>
                        <div className="flex gap-3">
                            <div className="w-20 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                            <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-4 rounded-3xl" style={{ borderColor: "var(--primary-accent-color, #e76f51)", transform: "rotate(-2deg)" }}></div>
                        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                            <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <p className="text-xl font-light mt-8 text-center"
                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                        {slideData?.description || 'Every image tells a unique and creative story'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
