import React from 'react'
import * as z from "zod";
import { ImageSchema } from '@/presentation-templates/defaultSchemes';

export const layoutId = 'gradient-team-slide'
export const layoutName = 'Gradient Team Slide'
export const layoutDescription = 'Modern team presentation with gradient background.'

const teamMemberSchema = z.object({
    name: z.string().min(2).max(40).meta({ description: "Team member name" }),
    role: z.string().min(2).max(40).meta({ description: "Team member role" }),
    image: ImageSchema.optional().meta({ description: "Team member photo" }),
})

const teamSlideSchema = z.object({
    title: z.string().min(3).max(60).default('Meet the Team').meta({ description: "Slide title" }),
    members: z.array(teamMemberSchema).min(2).max(3).default([
        { name: 'Alex Rivera', role: 'Product Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
        { name: 'Jordan Kim', role: 'Tech Director', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
        { name: 'Taylor Chen', role: 'Design Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
    ]).meta({ description: "Team members" }),
})

export const Schema = teamSlideSchema
export type TeamSlideData = z.infer<typeof teamSlideSchema>

const TeamSlideLayout: React.FC<{data?: Partial<TeamSlideData>}> = ({ data: slideData }) => {
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
                    <h2 className="text-6xl font-bold mb-16 text-center" style={{ color: "var(--text-heading-color, #ffffff)" }}>
                        {slideData?.title || 'Meet the Team'}
                    </h2>

                    <div className="flex gap-8 justify-center items-start flex-1">
                        {(slideData?.members || [
                            { name: 'Alex Rivera', role: 'Product Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', __image_prompt__: 'Professional portrait' } },
                            { name: 'Jordan Kim', role: 'Tech Director', image: { __image_url__: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', __image_prompt__: 'Professional portrait' } },
                            { name: 'Taylor Chen', role: 'Design Lead', image: { __image_url__: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', __image_prompt__: 'Professional portrait' } },
                        ]).map((member, i) => (
                            <div key={i} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/30">
                                    {member.image?.__image_url__ && (
                                        <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">
                                    {member.name}
                                </h3>
                                <p className="text-lg font-light text-white/80">
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
