import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-timeline-slide'
export const layoutName = 'Dark Timeline Slide'
export const layoutDescription = 'Elegant dark theme timeline with milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Legacy').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2018', title: 'Genesis', description: 'Founded with vision of elegant simplicity' },
        { year: '2021', title: 'Elevation', description: 'Achieved excellence and recognition' },
        { year: '2024', title: 'Mastery', description: 'Refined to perfection' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide text-white/60">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-5">
                    <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Our Legacy'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, var(--primary-accent-color, #6366f1), var(--secondary-accent-color, #8b5cf6))` }}></div>

                        <div className="space-y-12 ml-12">
                            {(slideData?.items || [
                                { year: '2018', title: 'Genesis', description: 'Founded with vision of elegant simplicity' },
                                { year: '2021', title: 'Elevation', description: 'Achieved excellence and recognition' },
                                { year: '2024', title: 'Mastery', description: 'Refined to perfection' },
                            ]).map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-14 top-2 w-4 h-4 rounded-full border-2"
                                         style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #6366f1)" : "var(--secondary-accent-color, #8b5cf6)", background: "var(--card-background-color, #0a0a0a)" }}></div>

                                    <div className="text-sm font-light tracking-widest mb-2 uppercase text-white/50">
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light text-white/70"
                                       style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
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
