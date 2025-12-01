import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'bold-team-slide'
export const layoutName = 'Bold Team Slide'
export const layoutDescription = 'Strong team presentation with impact.'

const teamMemberSchema = z.object({
    name: z.string().min(2).max(40).meta({ description: "Team member name" }),
    role: z.string().min(2).max(40).meta({ description: "Team member role" }),
    image: ImageSchema.optional().meta({ description: "Team member photo" }),
})

const teamSlideSchema = z.object({
    title: z.string().min(3).max(60).default('POWER TEAM').meta({ description: "Slide title" }),
    members: z.array(teamMemberSchema).min(2).max(3).default([
        { name: 'Marcus Stone', role: 'CEO & Founder', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
        { name: 'Victoria Sharp', role: 'Chief Strategy Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
        { name: 'Dante Cruz', role: 'Innovation Director', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
    ]).meta({ description: "Team members" }),
})

export const Schema = teamSlideSchema
export type TeamSlideData = z.infer<typeof teamSlideSchema>

const TeamSlideLayout: React.FC<{data?: Partial<TeamSlideData>}> = ({ data: slideData }) => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
            <div className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
                 style={{ background: "var(--card-background-color, linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%))", fontFamily: "var(--heading-font-family, Montserrat, sans-serif)" }}>

                {(slideData as any)?.__companyName__ && (
                    <div className="absolute top-8 left-16 text-sm font-bold tracking-widest text-white/60">
                        {(slideData as any)?.__companyName__}
                    </div>
                )}

                <div className="absolute inset-0 opacity-5">
                    <div className="absolute bottom-20 left-20 w-80 h-80" style={{ background: "var(--secondary-accent-color, #f7931e)", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}></div>
                </div>

                <div className="relative z-10 flex flex-col h-full px-20 py-16">
                    <h2 className="text-6xl font-black mb-16 text-center uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'POWER TEAM'}
                    </h2>

                    <div className="flex gap-12 justify-center items-start flex-1">
                        {(slideData?.members || [
                            { name: 'Marcus Stone', role: 'CEO & Founder', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
                            { name: 'Victoria Sharp', role: 'Chief Strategy Officer', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
                            { name: 'Dante Cruz', role: 'Innovation Director', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
                        ]).map((member, i) => (
                            <div key={i} className="text-center">
                                <div className="relative mb-6 inline-block">
                                    <div className="w-44 h-44 overflow-hidden border-4" style={{ borderColor: "var(--primary-accent-color, #ff6b35)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                        {member.image?.__image_url__ && (
                                            <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                                    {member.name}
                                </h3>
                                <p className="text-lg font-bold uppercase tracking-wide" style={{ color: "var(--primary-accent-color, #ff6b35)" }}>
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
