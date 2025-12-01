import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-timeline-slide'
export const layoutName = 'Bold Timeline Slide'
export const layoutDescription = 'Strong timeline with impactful milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('MILESTONE JOURNEY').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2020', title: 'LAUNCH', description: 'Revolutionary start with bold vision' },
        { year: '2022', title: 'DOMINATE', description: 'Market leadership established' },
        { year: '2024', title: 'TRANSFORM', description: 'Industry-changing innovation' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))", fontFamily: "var(--heading-font-family, Montserrat, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-widest text-white/60">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-20 right-20 w-96 h-96" style={{ background: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-black mb-16 uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'MILESTONE JOURNEY'}
                    </h2>

                    <div className="relative flex-1">
                        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: `linear-gradient(to bottom, var(--primary-accent-color, #ff6b35), var(--secondary-accent-color, #f7931e))` }}></div>

                        <div className="space-y-10 ml-16">
                            {(slideData?.items || [
                                { year: '2020', title: 'LAUNCH', description: 'Revolutionary start with bold vision' },
                                { year: '2022', title: 'DOMINATE', description: 'Market leadership established' },
                                { year: '2024', title: 'TRANSFORM', description: 'Industry-changing innovation' },
                            ]).map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-20 top-4 w-8 h-8 border-4 flex items-center justify-center"
                                         style={{ borderColor: "var(--primary-accent-color, #ff6b35)", background: "var(--card-background-color, #1a1a1a)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}>
                                    </div>

                                    <div className="text-xs font-black tracking-widest mb-2 uppercase" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
                                        {item.year}
                                    </div>
                                    <h3 className="text-4xl font-black mb-2 uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-xl font-normal text-white/70">
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
