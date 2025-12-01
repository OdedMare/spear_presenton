import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-timeline-slide'
export const layoutName = 'Professional Timeline Slide'
export const layoutDescription = 'Business timeline with milestone tracking.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Company Milestones').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2018', title: 'Founded', description: 'Company established with clear vision' },
        { year: '2020', title: 'Market Expansion', description: 'Extended reach to new markets' },
        { year: '2023', title: 'Industry Leader', description: 'Recognized as market leader' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Roboto, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-medium tracking-wide" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-2" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Company Milestones'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                        <div className="space-y-12 ml-12">
                            {(slideData?.items || [
                                { year: '2018', title: 'Founded', description: 'Company established with clear vision' },
                                { year: '2020', title: 'Market Expansion', description: 'Extended reach to new markets' },
                                { year: '2023', title: 'Industry Leader', description: 'Recognized as market leader' },
                            ]).map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-14 top-2 w-5 h-5 rounded-full border-4"
                                         style={{ borderColor: "var(--primary-accent-color, #1e40af)", background: "var(--card-background-color, #ffffff)" }}></div>

                                    <div className="text-sm font-bold tracking-widest mb-2" style={{ color: "var(--primary-accent-color, #1e40af)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light"
                                       style={{ color: "var(--text-body-color, #4b5563)" }}>
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
