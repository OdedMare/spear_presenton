import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'vibrant-image-slide'
export const layoutName = 'Vibrant Image Slide'
export const layoutDescription = 'Colorful image slide with vibrant frame.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Energy').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Vibrant imagery that energizes your message').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Colorful and energetic scene'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                <div className="flex flex-col h-full p-12">
                    <div className="mb-6">
                        <h2 className="text-5xl font-bold mb-3" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                            {slideData?.title || 'Visual Energy'}
                        </h2>
                        <div className="flex gap-2">
                            <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                            <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                            <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                        </div>
                    </div>

                    <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border-4" style={{ borderColor: "var(--primary-accent-color, #ff6b6b)" }}>
                        <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                    </div>

                    <p className="text-xl font-semibold mt-6 text-center" style={{ color: "var(--text-body-color, #636e72)" }}>
                        {slideData?.description || 'Vibrant imagery that energizes your message'}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
