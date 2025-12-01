import React from 'react'
import * as z from "zod";

export const layoutId = 'creative-table-slide'
export const layoutName = 'Creative Table Slide'
export const layoutDescription = 'Artistic data table with playful styling.'

const tableRowSchema = z.object({
    col1: z.string().min(1).max(50).meta({ description: "First column" }),
    col2: z.string().min(1).max(50).meta({ description: "Second column" }),
    col3: z.string().min(1).max(50).meta({ description: "Third column" }),
})

const tableSlideSchema = z.object({
    title: z.string().min(3).max(60).default('The Numbers').meta({ description: "Slide title" }),
    headers: z.array(z.string()).length(3).default(['Item', 'Value', 'Impact']).meta({ description: "Table headers" }),
    rows: z.array(tableRowSchema).min(2).max(5).default([
        { col1: 'Ideas Generated', col2: '500+', col3: 'High' },
        { col1: 'Projects Launched', col2: '42', col3: 'Medium' },
        { col1: 'Client Delight', col2: '95%', col3: 'Excellent' },
    ]).meta({ description: "Table rows" }),
})

export const Schema = tableSlideSchema
export type TableSlideData = z.infer<typeof tableSlideSchema>

const TableSlideLayout: React.FC<{data?: Partial<TableSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, #fffbf0)", fontFamily: "var(--heading-font-family, 'Abril Fatface', cursive)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-wide" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute bottom-10 right-10 w-52 h-52 opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)", transform: "rotate(45deg)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-7xl mb-4" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'The Numbers'}
                    </h2>

                    <div className="flex gap-3 mb-12">
                        <div className="w-20 h-2 rounded-full" style={{ background: "var(--primary-accent-color, #e76f51)" }}></div>
                        <div className="w-12 h-2 rounded-full" style={{ background: "var(--secondary-accent-color, #f4a261)" }}></div>
                    </div>

                    <div className="border-4 rounded-3xl overflow-hidden transform -rotate-1" style={{ borderColor: "var(--primary-accent-color, #e76f51)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "linear-gradient(90deg, var(--primary-accent-color, #e76f51) 0%, var(--secondary-accent-color, #f4a261) 100%)" }}>
                                    {(slideData?.headers || ['Item', 'Value', 'Impact']).map((header, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-xl font-bold text-white">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {(slideData?.rows || [
                                    { col1: 'Ideas Generated', col2: '500+', col3: 'High' },
                                    { col1: 'Projects Launched', col2: '42', col3: 'Medium' },
                                    { col1: 'Client Delight', col2: '95%', col3: 'Excellent' },
                                ]).map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-amber-50' : 'bg-white'}>
                                        <td className="px-6 py-5 text-xl font-bold" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                            {row.col1}
                                        </td>
                                        <td className="px-6 py-5 text-xl font-semibold" style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
                                            {row.col2}
                                        </td>
                                        <td className="px-6 py-5 text-xl font-bold" style={{ color: "var(--primary-accent-color, #e76f51)" }}>
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
