import React from 'react'
import * as z from "zod";

export const layoutId = 'gradient-table-slide'
export const layoutName = 'Gradient Table Slide'
export const layoutDescription = 'Modern data table with gradient styling.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Data Insights').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Metric', 'Current', 'Target']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Conversion', col2: '3.2%', col3: '4.5%' },
        { col1: 'Engagement', col2: '68%', col3: '75%' },
        { col1: 'Retention', col2: '82%', col3: '90%' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-bold mb-4" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Data Insights'}
                    </h2>

                    <div className="w-24 h-1 mb-12 rounded-full bg-white/40"></div>

                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/20">
                                    {(slideData?.headers || ['Metric', 'Current', 'Target']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-lg font-bold text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'Conversion', col2: '3.2%', col3: '4.5%' },
                                    { col1: 'Engagement', col2: '68%', col3: '75%' },
                                    { col1: 'Retention', col2: '82%', col3: '90%' },
                                ]).map((row, i) => (
                                    <tr key={i} className="border-b border-white/10">
                                        <td className="px-6 py-5 text-lg font-semibold text-white">
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-light text-white/80">
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-semibold text-white/90">
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
