import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-process-slide'
export const layoutName = 'Dark Process Slide'
export const layoutDescription = 'Elegant dark theme process workflow.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Methodology').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Envision', description: 'Conceptualize with elegant clarity' },
        { number: '02', title: 'Refine', description: 'Polish to sophisticated perfection' },
        { number: '03', title: 'Deliver', description: 'Execute with graceful precision' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Methodology'}
                    </h2>

                    <div className="flex gap-8 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Envision', description: 'Conceptualize with elegant clarity' },
                            { number: '02', title: 'Refine', description: 'Polish to sophisticated perfection' },
                            { number: '03', title: 'Deliver', description: 'Execute with graceful precision' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 text-center border border-white/10 rounded-xl p-8">
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center text-3xl font-bold"
                                             style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #6366f1)" : "var(--secondary-accent-color, #8b5cf6)", color: i % 2 === 0 ? "var(--primary-accent-color, #6366f1)" : "var(--secondary-accent-color, #8b5cf6)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light px-4 text-white/70"
                                       style={{ fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-12 h-px flex-shrink-0" style={{ background: `linear-gradient(90deg, ${i % 2 === 0 ? 'var(--primary-accent-color, #6366f1)' : 'var(--secondary-accent-color, #8b5cf6)'}, ${i % 2 === 0 ? 'var(--secondary-accent-color, #8b5cf6)' : 'var(--primary-accent-color, #6366f1)'})` }}></div>
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
