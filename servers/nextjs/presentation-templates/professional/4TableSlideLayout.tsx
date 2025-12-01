import React from 'react'
import * as z from "zod";

export const layoutId = 'professional-table-slide'
export const layoutName = 'Professional Table Slide'
export const layoutDescription = 'Classic business data table.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Performance Metrics').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Department', 'Q4 Results', 'YoY Growth']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Sales', col2: '$4.2M', col3: '+18%' },
        { col1: 'Marketing', col2: '$1.8M', col3: '+22%' },
        { col1: 'Operations', col2: '$2.5M', col3: '+15%' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Performance Metrics'}
                    </h2>

                    <div className="w-20 h-1 mb-12" style={{ background: "var(--primary-accent-color, #1e40af)" }}></div>

                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--primary-accent-color, #1e40af)" }}>
                                    {(slideData?.headers || ['Department', 'Q4 Results', 'YoY Growth']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-lg font-bold text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'Sales', col2: '$4.2M', col3: '+18%' },
                                    { col1: 'Marketing', col2: '$1.8M', col3: '+22%' },
                                    { col1: 'Operations', col2: '$2.5M', col3: '+15%' },
                                ]).map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                                        <td className="px-6 py-5 text-lg font-medium border-b" style={{ color: "var(--text-heading-color, #1f2937)", borderColor: "#e5e7eb" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-normal border-b" style={{ color: "var(--text-body-color, #4b5563)", borderColor: "#e5e7eb" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-bold border-b" style={{ color: "var(--primary-accent-color, #1e40af)", borderColor: "#e5e7eb" }}>
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
