import React from 'react'
import * as z from "zod";

export const layoutId = 'tech-table-slide'
export const layoutName = 'Tech Table Slide'
export const layoutDescription = 'Technology-focused table layout.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Performance Metrics').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Metric', 'Current', 'Target']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'API Latency', col2: '45ms', col3: '<50ms' },
        { col1: 'Uptime', col2: '99.9%', col3: '99.99%' },
        { col1: 'Requests/sec', col2: '10K', col3: '15K' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0f0f23)", fontFamily: "var(--heading-font-family, 'Space Grotesk', sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'var(--primary-accent-color, #00d9ff)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full px-16 pt-24 pb-12">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-1" style={{ background: "var(--primary-accent-color, #00d9ff)" }}></div>
                            <div className="w-6 h-1" style={{ background: "var(--secondary-accent-color, #8b5cf6)" }}></div>
                        </div>
                        <h2 className="text-5xl font-bold" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                            {slideData?.title || 'Performance Metrics'}
                        </h2>
                    </div>

                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--primary-accent-color, #00d9ff)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--primary-accent-color, #00d9ff)", color: "#0f0f23" }}>
                                    {(slideData?.headers || ['Metric', 'Current', 'Target']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-lg font-bold">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'API Latency', col2: '45ms', col3: '<50ms' },
                                    { col1: 'Uptime', col2: '99.9%', col3: '99.99%' },
                                    { col1: 'Requests/sec', col2: '10K', col3: '15K' },
                                ]).map((row, i) => (
                                    <tr key={i} className="border-b" style={{ borderColor: "rgba(0, 217, 255, 0.2)" }}>
                                        <td className="px-6 py-4 text-lg font-semibold" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-4 text-lg" style={{ color: "var(--text-body-color, #a0a0b5)" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-4 text-lg font-semibold" style={{ color: "var(--primary-accent-color, #00d9ff)" }}>
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
