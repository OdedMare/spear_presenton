import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-timeline-slide'
export const layoutName = 'Vibrant Timeline Slide'
export const layoutDescription = 'Colorful timeline with energetic milestones.'

const timelineItemSchema = z.object({
    year: z.string().min(1).max(20).meta({ description: "Year or date" }),
    title: z.string().min(2).max(50).meta({ description: "Milestone title" }),
    description: z.string().min(5).max(100).meta({ description: "Milestone description" }),
})

const timelineSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Adventure').meta({ description: "Slide title" }),
    items: z.array(timelineItemSchema).min(3).max(4).default([
        { year: '2020', title: 'Launch Party', description: 'Started with a splash of color and energy' },
        { year: '2022', title: 'Growth Spurt', description: 'Expanded with vibrant new features' },
        { year: '2024', title: 'Full Bloom', description: 'Flourishing with colorful success' },
    ]).meta({ description: "Timeline items" }),
})

export const Schema = timelineSlideSchema
export type TimelineSlideData = z.infer<typeof timelineSlideSchema>

const TimelineSlideLayout: React.FC<{data?: Partial<TimelineSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Our Adventure'}
                    </h2>

                    <div className="flex gap-2 mb-12">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <div className="relative flex-1">
                        <div className="absolute left-6 top-0 bottom-0 w-2 rounded-full" style={{ background: `linear-gradient(to bottom, var(--primary-accent-color, #ff6b6b), var(--secondary-accent-color, #ffd93d), #4ecdc4)` }}></div>

                        <div className="space-y-10 ml-20">
                            {(slideData?.items || [
                                { year: '2020', title: 'Launch Party', description: 'Started with a splash of color and energy' },
                                { year: '2022', title: 'Growth Spurt', description: 'Expanded with vibrant new features' },
                                { year: '2024', title: 'Full Bloom', description: 'Flourishing with colorful success' },
                            ]).map((item, i) => {
                                const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4'];
                                return (
                                    <div key={i} className="relative rounded-3xl p-6 border-4" style={{ borderColor: colors[i % colors.length], background: `${colors[i % colors.length]}10` }}>
                                        <div className="absolute -left-24 top-8 w-10 h-10 rounded-full border-4 flex items-center justify-center"
                                             style={{ borderColor: colors[i % colors.length], background: "var(--card-background-color, #ffffff)" }}>
                                            <div className="w-4 h-4 rounded-full" style={{ background: colors[i % colors.length] }}></div>
                                        </div>

                                        <div className="text-sm font-bold tracking-wider mb-2" style={{ color: colors[i % colors.length] }}>
                                            {item.year}
                                        </div>
                                        <h3 className="text-3xl font-bold mb-2" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                                            {item.title}
                                        </h3>
                                        <p className="text-lg font-semibold"
                                           style={{ color: "var(--text-body-color, #636e72)" }}>
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TimelineSlideLayout
