import React from 'react'
import * as z from "zod";

export const layoutId = 'elegant-table-slide'
export const layoutName = 'Elegant Table Slide'
export const layoutDescription = 'Sophisticated data presentation with refined styling.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Data Overview').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Category', 'Value', 'Notes']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Revenue', col2: '$2.4M', col3: 'Q4 2024' },
        { col1: 'Growth', col2: '12%', col3: 'Year over year' },
        { col1: 'Market Share', col2: '18%', col3: 'Industry leading' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-light mb-4" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Data Overview'}
                    </h2>

                    <div className="w-20 h-px mb-12" style={{ background: "var(--primary-accent-color, #8b7355)" }}></div>

                    <div className="border rounded overflow-hidden" style={{ borderColor: "var(--primary-accent-color, #8b7355)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--primary-accent-color, #8b7355)" }}>
                                    {(slideData?.headers || ['Category', 'Value', 'Notes']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-lg font-normal text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(slideData?.rows || [
                                    { col1: 'Revenue', col2: '$2.4M', col3: 'Q4 2024' },
                                    { col1: 'Growth', col2: '12%', col3: 'Year over year' },
                                    { col1: 'Market Share', col2: '18%', col3: 'Industry leading' },
                                ]).map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-stone-50'}>
                                        <td className="px-6 py-5 text-lg font-normal" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-light" style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-lg font-light" style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
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
