import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    title: z.string().default("Agenda"),
    items: z.array(z.string()).min(1).max(6).default(["Topic 1", "Topic 2", "Topic 3"]),

});

const AgendaSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full p-12" style={{ backgroundColor: '#09090b', color: '#e4e4e7' }}>
            <h2 className="text-4xl font-bold mb-12 border-b-2 pb-4" style={{ borderColor: '#22d3ee', color: '#d946ef' }}>{data.title}</h2>
            <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
                {data.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center p-6 rounded-xl shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                        <span className="text-3xl font-bold mr-6 w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#d946ef', color: '#09090b' }}>{idx + 1}</span>
                        <span className="text-2xl font-medium">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );

};

export const layoutName = "Agenda";
export const layoutDescription = "Table of contents or agenda";

export default AgendaSlideLayoutComponent;
