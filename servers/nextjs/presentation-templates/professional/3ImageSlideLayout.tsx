import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'professional-image-slide'
export const layoutName = 'Professional Image Slide'
export const layoutDescription = 'Business-focused image presentation.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Market Leadership').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Driving innovation and excellence in our industry').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Professional business scene'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-medium tracking-wide z-20" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                <div className="flex h-full p-16">
                    <div className="flex-1 flex flex-col justify-center pr-12">
                        <h2 className="text-5xl font-bold leading-tight mb-6" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                            {slideData?.title || 'Market Leadership'}
                        </h2>

                        <div className="w-20 h-1 mb-8" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                        <p className="text-xl font-light leading-relaxed max-w-md"
                           style={{ color: "var(--text-body-color, #4b5563)" }}>
                            {slideData?.description || 'Driving innovation and excellence in our industry'}
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-end">
                        <div className="w-full max-w-lg h-96 rounded-lg overflow-hidden shadow-xl border" style={{ borderColor: "var(--primary-accent-color, #1e40af)" }}>
                            <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
