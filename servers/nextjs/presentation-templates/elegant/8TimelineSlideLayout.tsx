import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-timeline-slide'
export const layoutName = 'Elegant Timeline Slide'
export const layoutDescription = 'Sophisticated timeline layout with refined milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Journey').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2020', title: 'Foundation', description: 'Established with a vision for excellence' },
        { year: '2022', title: 'Growth', description: 'Expanded services and client base' },
        { year: '2024', title: 'Innovation', description: 'Leading with cutting-edge solutions' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lato:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #faf8f5)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-light mb-16" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Our Journey'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                        <div className="space-y-12 ml-12">
                            {(slideData?.items || [
                                { year: '2020', title: 'Foundation', description: 'Established with a vision for excellence' },
                                { year: '2022', title: 'Growth', description: 'Expanded services and client base' },
                                { year: '2024', title: 'Innovation', description: 'Leading with cutting-edge solutions' },
                            ]).map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-14 top-2 w-4 h-4 rounded-full border-2"
                                         style={{ borderColor: "var(--primary-accent-color, #8b7355)", background: "var(--card-background-color, #faf8f5)" }}></div>

                                    <div className="text-sm font-light tracking-widest mb-2" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-normal mb-2" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light"
                                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
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
