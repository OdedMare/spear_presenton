import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'creative-team-slide'
export const layoutName = 'Creative Team Slide'
export const layoutDescription = 'Artistic team presentation with playful layout.'

const teamMemberSchema = z.object({
    name: z.string().min(2).max(40).meta({ description: "Team member name" }),
    role: z.string().min(2).max(40).meta({ description: "Team member role" }),
    image: ImageSchema.optional().meta({ description: "Team member photo" }),
})

const teamSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Creative Minds').meta({ description: "Slide title" }),
    members: z.array(teamMemberSchema).min(2).max(3).default([
        { name: 'Maya Santos', role: 'Creative Director', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
        { name: 'Leo Park', role: 'Art Director', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
        { name: 'Zara Ahmed', role: 'Innovation Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
    ]).meta({ description: "Team members" }),
})

export const Schema = teamSlideSchema
export type TeamSlideData = z.infer<typeof teamSlideSchema>

const TeamSlideLayout: React.FC<{data?: Partial<TeamSlideData>}> = ({ data: slideData }) => {
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

                <div className="absolute top-10 right-10 w-40 h-40 opacity-10" style={{ background: "var(--secondary-accent-color, #f4a261)", transform: "rotate(45deg)" }}></div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-7xl mb-16 text-center" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                        {slideData?.title || 'Creative Minds'}
                    </h2>

                    <div className="flex gap-12 justify-center items-start flex-1">
                        {(slideData?.members || [
                            { name: 'Maya Santos', role: 'Creative Director', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
                            { name: 'Leo Park', role: 'Art Director', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
                            { name: 'Zara Ahmed', role: 'Innovation Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
                        ]).map((member, i) => (
                            <div key={i} className="text-center">
                                <div className="relative mb-6 inline-block transform" style={{ transform: i % 2 === 0 ? "rotate(-3deg)" : "rotate(3deg)" }}>
                                    <div className="w-44 h-44 rounded-3xl overflow-hidden border-4" style={{ borderColor: i % 2 === 0 ? "var(--primary-accent-color, #e76f51)" : "var(--secondary-accent-color, #f4a261)" }}>
                                        {member.image?.__image_url__ && (
                                            <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl mb-2" style={{ color: "var(--text-heading-color, #2a2a2a)" }}>
                                    {member.name}
                                </h3>
                                <p className="text-lg font-light"
                                   style={{ color: "var(--text-body-color, #5a5a5a)", fontFamily: "var(--body-font-family, Raleway, sans-serif)" }}>
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
