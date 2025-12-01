import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'gradient-image-slide'
export const layoutName = 'Gradient Image Slide'
export const layoutDescription = 'Modern image slide with flowing gradient background.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Flow').meta({ description: "Slide title" }),
    description: z.string().min(10).max(200).default('Where modern gradients meet powerful imagery').meta({ description: "Image description" }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Modern and dynamic scene'
    }).meta({ description: "Main image" })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

const ImageSlideLayout: React.FC<{data?: Partial<ImageSlideData>}> = ({ data: slideData }) => {
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

                <div className="flex h-full p-12">
                    <div className="flex-1 flex flex-col justify-center pr-8">
                        <h2 className="text-5xl font-bold leading-tight mb-6" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Visual Flow'}
                        </h2>

                        <div className="w-20 h-1 mb-8 rounded-full bg-white/40"></div>

                        <p className="text-xl font-light leading-relaxed max-w-md text-white/90">
                            {slideData?.description || 'Where modern gradients meet powerful imagery'}
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-end">
                        <div className="w-full max-w-lg h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                            <img src={slideData?.image?.__image_url__ || ''} alt={slideData?.image?.__image_prompt__ || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSlideLayout
