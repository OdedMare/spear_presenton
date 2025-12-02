import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-timeline-slide'
export const layoutName = 'Tech Timeline Slide'
export const layoutDescription = 'Modern tech timeline with glowing milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Tech Evolution').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2020', title: 'Cloud Migration', description: 'Moved infrastructure to cloud-native architecture' },
        { year: '2022', title: 'AI Integration', description: 'Deployed machine learning models at scale' },
        { year: '2024', title: 'Edge Computing', description: 'Distributed processing across global network' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Tech Evolution'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, var(--primary-accent-color, #00d9ff), var(--secondary-accent-color, #8b5cf6))` }}></div>

                        <div className="space-y-10 ml-16">
                            {(slideData?.items || [
                                { year: '2020', title: 'Cloud Migration', description: 'Moved infrastructure to cloud-native architecture' },
                                { year: '2022', title: 'AI Integration', description: 'Deployed machine learning models at scale' },
                                { year: '2024', title: 'Edge Computing', description: 'Distributed processing across global network' },
                            ]).map((item, i) => (
                                <div key={i} className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                                    <div className="absolute -left-20 top-8 w-8 h-8 rounded-full border-4 flex items-center justify-center"
                                         style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #00d9ff)" : "var(--secondary-accent-color, #8b5cf6)", background: "var(--card-background-color, #0a0e1a)" }}>
                                        <div className="w-3 h-3 rounded-full" style={{ background: i % 2 === 0 ? "var(--primary-accent-color, #00d9ff)" : "var(--secondary-accent-color, #8b5cf6)" }}></div>
                                    </div>

                                    <div className="text-sm font-bold tracking-wider mb-2" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light text-white/70">
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
