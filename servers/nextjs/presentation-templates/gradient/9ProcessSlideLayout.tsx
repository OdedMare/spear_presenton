import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-process-slide'
export const layoutName = 'Gradient Process Slide'
export const layoutDescription = 'Modern process visualization with gradient flow.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('How It Works').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Connect', description: 'Integrate seamlessly with your workflow' },
        { number: '02', title: 'Automate', description: 'Let AI handle the heavy lifting' },
        { number: '03', title: 'Optimize', description: 'Continuous improvement and insights' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))", fontFamily: "var(--heading-font-family, Poppins, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-semibold tracking-wide text-white/80">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-16" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'How It Works'}
                    </h2>

                    <div className="flex gap-6 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Connect', description: 'Integrate seamlessly with your workflow' },
                            { number: '02', title: 'Automate', description: 'Let AI handle the heavy lifting' },
                            { number: '03', title: 'Optimize', description: 'Continuous improvement and insights' },
                        ]).map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                                            {step.number}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 text-white">
                                        {step.title}
                                    </h3>
                                    <p className="text-lg font-light text-white/80">
                                        {step.description}
                                    </p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex-shrink-0">
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                            <path d="M10 20 L30 20 M25 15 L30 20 L25 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
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
