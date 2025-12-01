import React from 'react'
import * as z from "zod";

export const layoutId = 'minimal-table-slide'
export const layoutName = 'Minimal Table Slide'
export const layoutDescription = 'Clean minimalist table layout.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Data Overview').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Item', 'Value', 'Change']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Revenue', col2: '$2.5M', col3: '+15%' },
        { col1: 'Users', col2: '50K', col3: '+24%' },
        { col1: 'Satisfaction', col2: '95%', col3: '+5%' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, Inter, sans-serif)" }}>
                <div className="flex flex-col h-full px-24 py-20">
                    <h2 className="text-5xl font-light mb-16" style={{ color: "var(--text-heading-color, #000000)" }}>
                        {slideData?.title || 'Data Overview'}
                    </h2>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: "var(--primary-accent-color, #000000)" }}>
                                {(slideData?.headers || ['Item', 'Value', 'Change']).map((header, i) => (
                                    <th key={i} className="px-4 py-4 text-left text-xl font-normal" style={{ color: "var(--text-heading-color, #000000)" }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(slideData?.rows || [
                                { col1: 'Revenue', col2: '$2.5M', col3: '+15%' },
                                { col1: 'Users', col2: '50K', col3: '+24%' },
                                { col1: 'Satisfaction', col2: '95%', col3: '+5%' },
                            ]).map((row, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="px-4 py-6 text-xl font-light" style={{ color: "var(--text-heading-color, #000000)" }}>
                                        {row.col1}
                                    </td>
                                    <td className="px-4 py-6 text-xl font-light" style={{ color: "var(--text-body-color, #666666)" }}>
                                        {row.col2}
                                    </td>
                                    <td className="px-4 py-6 text-xl font-light" style={{ color: "var(--text-body-color, #666666)" }}>
                                        {row.col3}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default TableSlideLayout
