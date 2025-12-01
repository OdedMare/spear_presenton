import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-timeline-slide'
export const layoutName = 'Gradient Timeline Slide'
export const layoutDescription = 'Modern timeline with flowing gradient background.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Evolution').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2021', title: 'Launch', description: 'Initial product release and market entry' },
        { year: '2022', title: 'Scale', description: 'Rapid growth and platform expansion' },
        { year: '2023', title: 'Innovate', description: 'AI integration and feature enhancement' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide text-white/80">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Evolution'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-white/30"></div>

                        <div className="space-y-10 ml-12">
                            {(slideData?.items || [
                                { year: '2021', title: 'Launch', description: 'Initial product release and market entry' },
                                { year: '2022', title: 'Scale', description: 'Rapid growth and platform expansion' },
                                { year: '2023', title: 'Innovate', description: 'AI integration and feature enhancement' },
                            ]).map((item, i) => (
                                <div key={i} className="relative bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <div className="absolute -left-16 top-8 w-8 h-8 rounded-full border-4 border-white bg-purple-400"></div>

                                    <div className="text-sm font-bold tracking-widest mb-2 text-white/70">
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2 text-white">
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light text-white/80">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TimelineSlideLayout
