import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'bold-image-slide'
export const layoutName = 'Bold Image Slide'
export const layoutDescription = 'Bold slide with large image and text overlay.'

const imageSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Visual Impact').meta({
        description: "Slide title",
    }),
    description: z.string().min(10).max(200).default('Powerful imagery that tells your story').meta({
        description: "Image description",
    }),
    image: ImageSchema.default({
        __image_url__: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        __image_prompt__: 'Business team collaboration and success'
    }).meta({
        description: "Main image",
    })
})

export const Schema = imageSlideSchema
export type ImageSlideData = z.infer<typeof imageSlideSchema>

interface ImageSlideLayoutProps {
    data?: Partial<ImageSlideData>
}

const ImageSlideLayout: React.FC<ImageSlideLayoutProps> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                style={{ fontFamily: "var(--heading-font-family, Montserrat, sans-serif)" }}
            >
                {/* Full Image Background */}
                <img
                    src={slideData?.image?.__image_url__ || ''}
                    alt={slideData?.image?.__image_prompt__ || ''}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>

                {/* Company Name */}
                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-6 left-12 z-10">
                        <span className="text-sm font-bold tracking-wider uppercase text-white/80">
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-end h-full px-16 pb-16">
                    <h2 className="text-6xl font-black uppercase mb-6" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Visual Impact'}
                    </h2>

                    <div className="w-24 h-2 mb-6" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>

                    <p className="text-2xl font-semibold max-w-3xl"
                       style={{ color: "var(--text-body-color, #e5e5e5)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                        {slideData?.description || 'Powerful imagery that tells your story'}
                    </p>
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
            </div>
        </>
    )
}

export default ImageSlideLayout
