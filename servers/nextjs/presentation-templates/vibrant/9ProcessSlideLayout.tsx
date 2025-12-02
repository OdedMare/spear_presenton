import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-process-slide'
export const layoutName = 'Vibrant Process Slide'
export const layoutDescription = 'Colorful process workflow with energy.'

const processStepSchema = z.object({
    number: z.string().min(1).max(5).meta({ description: "Step number" }),
    title: z.string().min(2).max(40).meta({ description: "Step title" }),
    description: z.string().min(5).max(80).meta({ description: "Step description" }),
})

const processSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Method').meta({ description: "Slide title" }),
    steps: z.array(processStepSchema).min(3).max(4).default([
        { number: '01', title: 'Discover', description: 'Explore ideas with colorful creativity' },
        { number: '02', title: 'Design', description: 'Create vibrant solutions that pop' },
        { number: '03', title: 'Deliver', description: 'Launch with energy and excitement' },
    ]).meta({ description: "Process steps" }),
})

export const Schema = processSlideSchema
export type ProcessSlideData = z.infer<typeof processSlideSchema>

const ProcessSlideLayout: React.FC<{data?: Partial<ProcessSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-20 right-20 w-44 h-44 rounded-full opacity-10" style={{ background: "#4ecdc4" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Our Method'}
                    </h2>

                    <div className="flex gap-2 mb-12">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <div className="flex gap-6 flex-1 items-center">
                        {(slideData?.steps || [
                            { number: '01', title: 'Discover', description: 'Explore ideas with colorful creativity' },
                            { number: '02', title: 'Design', description: 'Create vibrant solutions that pop' },
                            { number: '03', title: 'Deliver', description: 'Launch with energy and excitement' },
                        ]).map((step, i, arr) => {
                            const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4'];
                            return (
                                <React.Fragment key={i}>
                                    <div className="flex-1 rounded-3xl p-8 border-4" style={{ borderColor: colors[i % colors.length], background: `${colors[i % colors.length]}10` }}>
                                        <div className="mb-6">
                                            <div className="w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                                                 style={{ borderColor: colors[i % colors.length], color: colors[i % colors.length] }}>
                                                {step.number}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4 text-center" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                                            {step.title}
                                        </h3>
                                        <p className="text-lg font-semibold text-center"
                                           style={{ color: "var(--text-body-color, #636e72)" }}>
                                            {step.description}
                                        </p>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="flex-shrink-0">
                                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                                                <path d="M10 25 L40 25 M35 20 L40 25 L35 30" stroke={colors[(i + 1) % colors.length]} strokeWidth="4" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProcessSlideLayout
