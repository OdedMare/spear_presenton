import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    title: z.string().default("Our Team"),
    members: z.array(z.object({
        name: z.string(),
        role: z.string(),
        image: ImageSchema.optional()
    })).min(1).max(4).default([
        { name: "John Doe", role: "CEO" },
        { name: "Jane Smith", role: "CTO" }
    ]),

});

const TeamSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full p-12" style={{ backgroundColor: '#f0fdf4', color: '#14532d' }}>
            <h2 className="text-4xl font-bold mb-12 text-center" style={{ color: '#15803d' }}>{data.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {data.members?.map((member, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center p-6 rounded-lg" style={{ backgroundColor: '#86efac', opacity: 0.9 }}>
                        <div className="w-32 h-32 rounded-full mb-4 overflow-hidden bg-gray-300 border-4" style={{ borderColor: '#15803d' }}>
                            {member.image ? (
                                <img src={member.image.__image_url__} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">
                                    {member.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: '#14532d' }}>{member.name}</h3>
                        <p className="text-md opacity-75" style={{ color: '#166534' }}>{member.role}</p>
                    </div>
                ))}
            </div>
        </div>
    );

};

export const layoutName = "Our Team";
export const layoutDescription = "Team members grid";

export default TeamSlideLayoutComponent;
