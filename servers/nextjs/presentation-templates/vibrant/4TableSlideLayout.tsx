import React from 'react'
import * as z from "zod";

export const layoutId = 'vibrant-table-slide'
export const layoutName = 'Vibrant Table Slide'
export const layoutDescription = 'Colorful table with vibrant design.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Performance Data').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Category', 'Result', 'Status']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Engagement', col2: '85%', col3: 'Excellent' },
        { col1: 'Reach', col2: '50K', col3: 'Growing' },
        { col1: 'Satisfaction', col2: '92%', col3: 'Outstanding' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Quicksand, sans-serif)" }}>

                <div className="absolute top-20 right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                        {slideData?.title || 'Performance Data'}
                    </h2>

                    <div className="flex gap-2 mb-12">
                        <div className="w-16 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #ff6b6b)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #ffd93d)" }}></div>
                        <div className="w-8 h-2 rounded-full" style={{ background: "#4ecdc4" }}></div>
                    </div>

                    <div className="border-4 rounded-2xl overflow-hidden" style={{ borderColor: "var(--primary-accent-color, #ff6b6b)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #ff6b6b) 0%, var(--secondary-accent-color, #ffd93d) 100%)" }}>
                                    {(slideData?.headers || ['Category', 'Result', 'Status']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-xl font-bold text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'Engagement', col2: '85%', col3: 'Excellent' },
                                    { col1: 'Reach', col2: '50K', col3: 'Growing' },
                                    { col1: 'Satisfaction', col2: '92%', col3: 'Outstanding' },
                                ]).map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-red-50' : 'bg-yellow-50'}>
                                        <td className="px-6 py-5 text-xl font-bold" style={{ color: "var(--text-heading-color, #2d3436)" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-xl font-semibold" style={{ color: "var(--text-body-color, #636e72)" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-xl font-bold" style={{ color: "var(--primary-accent-color, #ff6b6b)" }}>
                                            {row.col3}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TableSlideLayout
