import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-process-slide'
export const layoutName = 'Corporate Process Slide'
export const layoutDescription = 'Professional business process workflow.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Strategic Framework').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Analysis', description: 'Comprehensive market and business analysis' },
        { number: '02', title: 'Strategy', description: 'Development of strategic initiatives' },
        { number: '03', title: 'Implementation', description: 'Execution of strategic plan' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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
                        {slideData?.title || 'Strategic Framework'}
                    </h2>

                    <div className="flex gap-8 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Analysis', description: 'Comprehensive market and business analysis' },
                            { number: '02', title: 'Strategy', description: 'Development of strategic initiatives' },
                            { number: '03', title: 'Implementation', description: 'Execution of strategic plan' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 text-center bg-white rounded-lg shadow-md p-8">
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                                             style={{ borderColor: "var(--primary-accent-color, #003d82)", color: "var(--primary-accent-color, #003d82)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light px-4"
                                       style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-12 h-1 flex-shrink-0" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
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
