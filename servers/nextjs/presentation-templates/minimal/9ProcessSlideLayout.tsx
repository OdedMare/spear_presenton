import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-process-slide'
export const layoutName = 'Minimal Process Slide'
export const layoutDescription = 'Clean minimalist process flow.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Process').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Simplify', description: 'Remove all unnecessary complexity' },
        { number: '02', title: 'Focus', description: 'Concentrate on what truly matters' },
        { number: '03', title: 'Perfect', description: 'Refine until nothing can be removed' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-xs font-light tracking-widest" style={{ color: "var(--primary-accent-color, #000000)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-5xl font-extralight mb-16" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Process'}
                    </h2>

                    <div className="flex gap-16 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Simplify', description: 'Remove all unnecessary complexity' },
                            { number: '02', title: 'Focus', description: 'Concentrate on what truly matters' },
                            { number: '03', title: 'Perfect', description: 'Refine until nothing can be removed' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 text-center">
                                    <div className="mb-8">
                                        <div className="text-6xl font-extralight" style={{ color: "var(--primary-accent-color, #000000)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-light mb-4" style={{ color: "var(--text-heading-color, #000000)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light px-4"
                                       style={{ color: "var(--text-body-color, #666666)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-px h-32 flex-shrink-0" style={{ background: "var(--primary-accent-color, #000000)" }}></div>
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
