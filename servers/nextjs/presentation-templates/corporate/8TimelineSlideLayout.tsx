import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-timeline-slide'
export const layoutName = 'Corporate Timeline Slide'
export const layoutDescription = 'Professional business timeline with milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Corporate History').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2015', title: 'Establishment', description: 'Company founded with vision for excellence' },
        { year: '2019', title: 'Global Reach', description: 'International expansion completed' },
        { year: '2024', title: 'Market Leader', description: 'Industry-leading position achieved' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #f8f9fa)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                        {slideData?.title || 'Corporate History'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                        <div className="space-y-12 ml-12">
                            {(slideData?.items || [
                                { year: '2015', title: 'Establishment', description: 'Company founded with vision for excellence' },
                                { year: '2019', title: 'Global Reach', description: 'International expansion completed' },
                                { year: '2024', title: 'Market Leader', description: 'Industry-leading position achieved' },
                            ]).map((item, i) => (
                                <div key={i} className="relative bg-white rounded-lg shadow-md p-6">
                                    <div className="absolute -left-16 top-8 w-6 h-6 rounded-full border-4"
                                         style={{ borderColor: "var(--primary-accent-color, #003d82)", background: "var(--card-background-color, #f8f9fa)" }}></div>

                                    <div className="text-sm font-bold tracking-wider mb-2" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-lg font-light"
                                       style={{ color: "var(--text-body-color, #4a4a4a)" }}>
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
