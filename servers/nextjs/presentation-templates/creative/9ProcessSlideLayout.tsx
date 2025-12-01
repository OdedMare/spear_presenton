import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-process-slide'
export const layoutName = 'Creative Process Slide'
export const layoutDescription = 'Playful process visualization with artistic flow.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Creative Flow').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Ideate', description: 'Brainstorm and explore possibilities' },
        { number: '02', title: 'Create', description: 'Bring ideas to life with passion' },
        { number: '03', title: 'Share', description: 'Inspire others with your work' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-20 right-20 w-40 h-40 rounded-full opacity-10" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-7xl mb-16" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Creative Flow'}
                    </h2>

                    <div className="flex gap-6 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Ideate', description: 'Brainstorm and explore possibilities' },
                            { number: '02', title: 'Create', description: 'Bring ideas to life with passion' },
                            { number: '03', title: 'Share', description: 'Inspire others with your work' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 border-4 rounded-3xl p-8 transform" style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)", transform: i % 2 === 0 ? "rotate(-2deg)" : "rotate(2deg)" }}>
                                    <div className="mb-6">
                                        <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-bold mx-auto"
                                             style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)", color: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl mb-4 text-center" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light text-center"
                                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex-shrink-0">
                                        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                                            <path d="M10 25 Q25 10, 40 25" stroke="currentColor" strokeWidth="3" fill="none" style={{ color: "var(--primary-accent-color, #e76f51)" }}/>
                                            <circle cx="40" cy="25" r="4" fill="currentColor" style={{ color: "var(--primary-accent-color, #e76f51)" }}/>
                                        </svg>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProcessSlideLayout
