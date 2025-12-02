import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-process-slide'
export const layoutName = 'Tech Process Slide'
export const layoutDescription = 'Modern tech process workflow with vibrant design.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Development Pipeline').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Code', description: 'Write and commit to version control' },
        { number: '02', title: 'Build', description: 'Automated CI/CD pipeline execution' },
        { number: '03', title: 'Deploy', description: 'Release to production environment' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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
                        {slideData?.title || 'Development Pipeline'}
                    </h2>

                    <div className="flex gap-6 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Code', description: 'Write and commit to version control' },
                            { number: '02', title: 'Build', description: 'Automated CI/CD pipeline execution' },
                            { number: '03', title: 'Deploy', description: 'Release to production environment' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border" style={{ borderColor: i % 2 === 0 ? "rgba(0, 217, 255, 0.3)" : "rgba(139, 92, 246, 0.3)" }}>
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto rounded-2xl border-2 flex items-center justify-center text-3xl font-bold"
                                             style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #00d9ff)" : "var(--secondary-accent-color, #8b5cf6)", color: i % 2 === 0 ? "var(--primary-accent-color, #00d9ff)" : "var(--secondary-accent-color, #8b5cf6)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 text-center" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light text-center text-white/70">
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex-shrink-0">
                                        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                                            <path d="M10 25 L40 25 M35 20 L40 25 L35 30" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#00d9ff" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
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
