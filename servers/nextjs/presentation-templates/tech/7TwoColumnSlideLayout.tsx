import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-two-column-slide'
export const layoutName = 'Tech Two Column Slide'
export const layoutDescription = 'Modern tech two-column comparison.'

const twoColumnSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Tech Stack').meta({ description: "Slide title" }),
    leftTitle: z.string().min(2).max(40).default('Frontend').meta({ description: "Left column title" }),
    leftPoints: z.array(z.string()).min(2).max(4).default([
        'React & Next.js',
        'TypeScript',
        'Tailwind CSS'
    ]).meta({ description: "Left column points" }),
    rightTitle: z.string().min(2).max(40).default('Backend').meta({ description: "Right column title" }),
    rightPoints: z.array(z.string()).min(2).max(4).default([
        'Node.js & FastAPI',
        'PostgreSQL',
        'Redis Cache'
    ]).meta({ description: "Right column points" }),
})

export const Schema = twoColumnSlideSchema
export type TwoColumnSlideData = z.infer<typeof twoColumnSlideSchema>

const TwoColumnSlideLayout: React.FC<{data?: Partial<TwoColumnSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0e1a)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-12" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Tech Stack'}
                    </h2>

                    <div className="flex gap-10 flex-1">
                        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/30">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                                    {slideData?.leftTitle || 'Frontend'}
                                </h3>
                                <div className="w-16 h-1 rounded-full" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.leftPoints || ['React & Next.js', 'TypeScript', 'Tailwind CSS']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full mt-2.5" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                                        <p className="text-xl font-light text-white/80">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--secondary-accent-color, #8b5cf6)" }}>
                                    {slideData?.rightTitle || 'Backend'}
                                </h3>
                                <div className="w-16 h-1 rounded-full" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                            </div>
                            <div className="space-y-4">
                                {(slideData?.rightPoints || ['Node.js & FastAPI', 'PostgreSQL', 'Redis Cache']).map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full mt-2.5" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                                        <p className="text-xl font-light text-white/80">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TwoColumnSlideLayout
