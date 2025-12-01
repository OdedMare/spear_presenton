import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-closing-slide'
export const layoutName = 'Bold Closing Slide'
export const layoutDescription = 'Powerful closing with strong call to action.'

const closingSlideSchema = z.object({
    title: z.string().min(3).max(80).default('TAKE ACTION NOW').meta({ description: "Closing title" }),
    subtitle: z.string().min(5).max(150).default('Join us in making bold statements that matter').meta({ description: "Closing message" }),
    contact: z.string().min(5).max(100).default('action@bold.studio').meta({ description: "Contact information" }),
})

export const Schema = closingSlideSchema
export type ClosingSlideData = z.infer<typeof closingSlideSchema>

const ClosingSlideLayout: React.FC<{data?: Partial<ClosingSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))", fontFamily: "var(--heading-font-family, Montserrat, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-widest text-white/60 z-20">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96" style={{ background: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center h-full px-20 py-20 text-center">
                    <h1 className="text-8xl font-black mb-8 uppercase tracking-tighter" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'TAKE ACTION NOW'}
                    </h1>

                    <div className="flex gap-4 justify-center mb-12">
                        <div className="w-24 h-2" style={{ background: "var(--primary-accent-color, #ff6b35)" }}></div>
                        <div className="w-24 h-2" style={{ background: "var(--secondary-accent-color, #f7931e)" }}></div>
                    </div>

                    <p className="text-3xl font-bold mb-12 max-w-3xl uppercase tracking-wide text-white/90">
                        {slideData?.subtitle || 'Join us in making bold statements that matter'}
                    </p>

                    <div className="border-4 px-10 py-5" style={{ borderColor: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                        <p className="text-2xl font-black uppercase tracking-wide" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
                            {slideData?.contact || 'action@bold.studio'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClosingSlideLayout
