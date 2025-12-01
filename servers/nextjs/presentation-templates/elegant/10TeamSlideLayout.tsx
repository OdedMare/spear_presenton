import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'elegant-team-slide'
export const layoutName = 'Elegant Team Slide'
export const layoutDescription = 'Sophisticated team member presentation.'

const teamMemberSchema = z.object({
    name: z.string().min(2).max(40).meta({ description: "Team member name" }),
    role: z.string().min(2).max(40).meta({ description: "Team member role" }),
    image: ImageSchema.optional().meta({ description: "Team member photo" }),
})

const teamSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Our Team').meta({ description: "Slide title" }),
    members: z.array(teamMemberSchema).min(2).max(3).default([
        { name: 'Sarah Chen', role: 'Creative Director', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
        { name: 'Michael Ross', role: 'Strategy Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
        { name: 'Elena Martinez', role: 'Design Architect', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
    ]).meta({ description: "Team members" }),
})

export const Schema = teamSlideSchema
export type TeamSlideData = z.infer<typeof teamSlideSchema>

const TeamSlideLayout: React.FC<{data?: Partial<TeamSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-light mb-16 text-center" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                        {slideData?.title || 'Our Team'}
                    </h2>

                    <div className="flex gap-12 justify-center items-start flex-1">
                        {(slideData?.members || [
                            { name: 'Sarah Chen', role: 'Creative Director', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
                            { name: 'Michael Ross', role: 'Strategy Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
                            { name: 'Elena Martinez', role: 'Design Architect', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
                        ]).map((member, i) => (
                            <div key={i} className="text-center">
                                <div className="relative mb-6 inline-block">
                                    <div className="absolute -top-2 -left-2 w-full h-full border rounded-full"
                                         style={{ borderColor: "var(--primary-accent-color, #8b7355)" }}></div>
                                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4"
                                         style={{ borderColor: "var(--card-background-color, #faf8f5)" }}>
                                        {member.image?.__image_url__ && (
                                            <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-normal mb-2" style={{ color: "var(--text-heading-color, #3a3a3a)" }}>
                                    {member.name}
                                </h3>
                                <p className="text-lg font-light"
                                   style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Lato, sans-serif)" }}>
                                    {member.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default TeamSlideLayout
