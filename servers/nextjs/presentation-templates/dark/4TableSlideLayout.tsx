import React from 'react'
import * as z from "zod";

export const layoutId = 'dark-table-slide'
export const layoutName = 'Dark Table Slide'
export const layoutDescription = 'Elegant dark theme table layout.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Data Insights').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Metric', 'Value', 'Trend']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Revenue', col2: '$2.5M', col3: '↑ 15%' },
        { col1: 'Users', col2: '50K', col3: '↑ 24%' },
        { col1: 'Growth', col2: '18%', col3: '↑ 5%' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #0a0a0a)", fontFamily: "var(--heading-font-family, 'Playfair Display', serif)" }}>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-bold mb-8" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Data Insights'}
                    </h2>

                    <div className="w-24 h-1 mb-12" style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #6366f1) 0%, transparent 100%)" }}></div>

                    <div className="border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #6366f1) 0%, var(--secondary-accent-color, #8b5cf6) 100%)" }}>
                                    {(slideData?.headers || ['Metric', 'Value', 'Trend']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-lg font-bold text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'Revenue', col2: '$2.5M', col3: '↑ 15%' },
                                    { col1: 'Users', col2: '50K', col3: '↑ 24%' },
                                    { col1: 'Growth', col2: '18%', col3: '↑ 5%' },
                                ]).map((row, i) => (
                                    <tr key={i} className="border-b border-white/5" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        <td className="px-6 py-5 text-lg font-semibold" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-light"
                                            style={{ color: "var(--text-body-color, #a3a3a3)", fontFamily: "var(--body-font-family, Inter, sans-serif)" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-semibold" style={{ color: "var(--primary-accent-color, #6366f1)" }}>
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
