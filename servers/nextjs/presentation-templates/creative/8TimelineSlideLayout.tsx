import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-timeline-slide'
export const layoutName = 'Creative Timeline Slide'
export const layoutDescription = 'Artistic timeline with playful milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Story').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2019', title: 'Spark', description: 'The creative journey begins' },
        { year: '2021', title: 'Flourish', description: 'Ideas bloom into reality' },
        { year: '2024', title: 'Inspire', description: 'Making waves in the industry' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #fffbf0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-wide" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-7xl mb-16" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Our Story'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-6 top-0 bottom-0 w-2 rounded-full" style={{ background: `linear-gradient(to bottom, var(--primary-accent-color, #e76f51), var(--secondary-accent-color, #f4a261))` }}></div>

                        <div className="space-y-10 ml-20">
                            {(slideData?.items || [
                                { year: '2019', title: 'Spark', description: 'The creative journey begins' },
                                { year: '2021', title: 'Flourish', description: 'Ideas bloom into reality' },
                                { year: '2024', title: 'Inspire', description: 'Making waves in the industry' },
                            ]).map((item, i) => (
                                <div key={i} className="relative border-4 rounded-2xl p-6 transform" style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)", transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)" }}>
                                    <div className="absolute -left-28 top-8 w-10 h-10 rounded-full border-4 flex items-center justify-center"
                                         style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)", background: "var(--card-background-color, #fffbf0)" }}>
                                        <div className="w-4 h-4 rounded-full" style={{ background: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)" }}></div>
                                    </div>

                                    <div className="text-sm font-bold tracking-widest mb-2" style={{ color: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl mb-2" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light"
                                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
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
