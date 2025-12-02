import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-timeline-slide'
export const layoutName = 'Minimal Timeline Slide'
export const layoutDescription = 'Clean minimalist timeline.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Timeline').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2021', title: 'Begin', description: 'Started with simple idea' },
        { year: '2022', title: 'Grow', description: 'Expanded with focus and clarity' },
        { year: '2024', title: 'Lead', description: 'Achieved minimalist excellence' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-xs font-light tracking-widest" style={{ color: "var(--primary-accent-color, #000000)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-5xl font-extralight mb-16" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Timeline'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "var(--primary-accent-color, #000000)" }}></div>

                        <div className="space-y-16 ml-12">
                            {(slideData?.items || [
                                { year: '2021', title: 'Begin', description: 'Started with simple idea' },
                                { year: '2022', title: 'Grow', description: 'Expanded with focus and clarity' },
                                { year: '2024', title: 'Lead', description: 'Achieved minimalist excellence' },
                            ]).map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-14 top-2 w-3 h-3 rounded-full border"
                                         style={{ borderColor: "var(--primary-accent-color, #000000)", background: "var(--card-background-color, #ffffff)" }}></div>

                                    <div className="text-xs font-light tracking-widest mb-2 uppercase" style={{ color: "var(--text-body-color, #666666)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-light mb-2" style={{ color: "var(--text-heading-color, #000000)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light"
                                       style={{ color: "var(--text-body-color, #666666)" }}>
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
