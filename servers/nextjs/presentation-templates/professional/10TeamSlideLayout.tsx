import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'professional-team-slide'
export const layoutName = 'Professional Team Slide'
export const layoutDescription = 'Business team presentation layout.'

const teamMemberSchema = z.object({
    name: z.string().min(2).max(40).meta({ description: "Team member name" }),
    role: z.string().min(2).max(40).meta({ description: "Team member role" }),
    image: ImageSchema.optional().meta({ description: "Team member photo" }),
})

const teamSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Leadership Team').meta({ description: "Slide title" }),
    members: z.array(teamMemberSchema).min(2).max(3).default([
        { name: 'Robert Chen', role: 'Chief Executive Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
        { name: 'Jennifer Lee', role: 'Chief Operations Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
        { name: 'David Williams', role: 'Chief Technology Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
    ]).meta({ description: "Team members" }),
})

export const Schema = teamSlideSchema
export type TeamSlideData = z.infer<typeof teamSlideSchema>

const TeamSlideLayout: React.FC<{data?: Partial<TeamSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                        {slideData?.title || 'Leadership Team'}
                    </h2>

                    <div className="flex gap-12 justify-center items-start flex-1">
                        {(slideData?.members || [
                            { name: 'Robert Chen', role: 'Chief Executive Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
                            { name: 'Jennifer Lee', role: 'Chief Operations Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
                            { name: 'David Williams', role: 'Chief Technology Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
                        ]).map((member, i) => (
                            <div key={i} className="text-center border rounded-lg p-6" style={{ borderColor: "#e5e7eb" }}>
                                <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4" style={{ borderColor: "var(--primary-accent-color, #1e40af)" }}>
                                    {member.image?.__image_url__ && (
                                        <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-heading-color, #1f2937)" }}>
                                    {member.name}
                                </h3>
                                <p className="text-lg font-medium"
                                   style={{ color: "var(--text-body-color, #4b5563)" }}>
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
