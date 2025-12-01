import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-process-slide'
export const layoutName = 'Elegant Process Slide'
export const layoutDescription = 'Refined step-by-step process visualization.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Process').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Discovery', description: 'Understanding your vision and requirements' },
        { number: '02', title: 'Design', description: 'Crafting elegant solutions with precision' },
        { number: '03', title: 'Delivery', description: 'Executing with excellence and refinement' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Lato:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #faf8f5)", fontFamily: "var(--heading-font-family, 'Cormorant Garamond', serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-light tracking-wide" style={{ color: "var(--primary-accent-color, #8b7355)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-light mb-16" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Our Process'}
                    </h2>

                    <div className="flex gap-8 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Discovery', description: 'Understanding your vision and requirements' },
                            { number: '02', title: 'Design', description: 'Crafting elegant solutions with precision' },
                            { number: '03', title: 'Delivery', description: 'Executing with excellence and refinement' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 text-center">
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center text-3xl font-light"
                                             style={{ borderColor: "var(--primary-accent-color, #8b7355)", color: "var(--primary-accent-color, #8b7355)" }}>
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-normal mb-4" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light px-4"
                                       style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-12 h-px flex-shrink-0" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>
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
