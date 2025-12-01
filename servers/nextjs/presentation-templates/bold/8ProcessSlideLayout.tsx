import React from 'react'
import * as z from "zod";

export const layoutId = 'bold-process-slide'
export const layoutName = 'Bold Process Slide'
export const layoutDescription = 'Powerful process visualization with impact.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('EXECUTION PLAN').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'STRATEGIZE', description: 'Define bold objectives and roadmap' },
        { number: '02', title: 'EXECUTE', description: 'Implement with power and precision' },
        { number: '03', title: 'DOMINATE', description: 'Achieve market-leading results' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-black mb-16 uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'EXECUTION PLAN'}
                    </h2>

                    <div className="flex gap-6 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'STRATEGIZE', description: 'Define bold objectives and roadmap' },
                            { number: '02', title: 'EXECUTE', description: 'Implement with power and precision' },
                            { number: '03', title: 'DOMINATE', description: 'Achieve market-leading results' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 border-4 p-8" style={{ borderColor: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto flex items-center justify-center text-4xl font-black border-4"
                                             style={{ borderColor: "var(--primary-accent-color, #ff6b35)", color: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black mb-4 text-center uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-normal text-center text-white/70">
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex-shrink-0">
                                        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                                            <path d="M10 25 L40 25 M35 20 L40 25 L35 30" stroke="currentColor" strokeWidth="4" strokeLinecap="square" style={{ color: "var(--primary-accent-color, #ff6b35)" }}/>
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
