import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-process-slide'
export const layoutName = 'Professional Process Slide'
export const layoutDescription = 'Business process workflow visualization.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Implementation Process').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Assessment', description: 'Comprehensive analysis of requirements' },
        { number: '02', title: 'Planning', description: 'Strategic roadmap development' },
        { number: '03', title: 'Execution', description: 'Systematic implementation and delivery' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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
                        {slideData?.title || 'Implementation Process'}
                    </h2>

                    <div className="flex gap-8 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Assessment', description: 'Comprehensive analysis of requirements' },
                            { number: '02', title: 'Planning', description: 'Strategic roadmap development' },
                            { number: '03', title: 'Execution', description: 'Systematic implementation and delivery' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 text-center border rounded-lg p-8" style={{ borderColor: "#e5e7eb" }}>
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                                             style={{ borderColor: "var(--primary-accent-color, #1e40af)", color: "var(--primary-accent-color, #1e40af)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light px-4"
                                       style={{ color: "var(--text-body-color, #4b5563)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-12 h-1 flex-shrink-0" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>
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
