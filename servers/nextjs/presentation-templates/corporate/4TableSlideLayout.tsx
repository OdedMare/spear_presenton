import React from 'react'
import * as z from "zod";

export const layoutId = 'corporate-table-slide'
export const layoutName = 'Corporate Table Slide'
export const layoutDescription = 'Professional table for structured data.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Key Metrics Overview').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Quarter', 'Revenue', 'Growth']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Q1 2024', col2: '$2.5M', col3: '+15%' },
        { col1: 'Q2 2024', col2: '$3.1M', col3: '+24%' },
        { col1: 'Q3 2024', col2: '$3.8M', col3: '+23%' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #ffffff)", fontFamily: "var(--heading-font-family, 'IBM Plex Sans', sans-serif)" }}>
                <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16">
                        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--primary-accent-color, #003d82)' }}>
                            {(slideData as any)?.__companyName__}
                        </span>
                    </div>
                )}

                <div className="flex h-full px-16 pt-24 pb-12">
                    <div className="w-2 mr-8" style={{ background: "var(--primary-accent-color, #003d82)" }}></div>
                    <div className="flex-1">
                        <h2 className="text-4xl font-bold mb-12" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                            {slideData?.title || 'Key Metrics Overview'}
                        </h2>

                        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: "var(--primary-accent-color, #003d82)" }}>
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: "var(--primary-accent-color, #003d82)" }}>
                                        {(slideData?.headers || ['Quarter', 'Revenue', 'Growth']).map((header, i) => (
                                            <th key={i} className="px-6 py-4 text-left text-lg font-bold text-white">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(slideData?.rows || [
                                        { col1: 'Q1 2024', col2: '$2.5M', col3: '+15%' },
                                        { col1: 'Q2 2024', col2: '$3.1M', col3: '+24%' },
                                        { col1: 'Q3 2024', col2: '$3.8M', col3: '+23%' },
                                    ]).map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                            <td className="px-6 py-4 text-lg font-semibold" style={{ color: "var(--text-heading-color, #1a1a1a)" }}>
                                                {row.col1}
                                            </td>
                                            <td className="px-6 py-4 text-lg" style={{ color: "var(--text-body-color, #4a4a4a)" }}>
                                                {row.col2}
                                            </td>
                                            <td className="px-6 py-4 text-lg font-semibold" style={{ color: "var(--primary-accent-color, #003d82)" }}>
                                                {row.col3}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TableSlideLayout
