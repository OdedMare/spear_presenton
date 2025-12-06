import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    leftTitle: z.string().default("Problem"),
    leftContent: z.string().default("Description of the problem..."),
    rightTitle: z.string().default("Solution"),
    rightContent: z.string().default("Description of the solution..."),

});

const TwoColumnSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex" style={{ backgroundColor: '#fff7ed' }}>
            <div className="w-1/2 p-16 flex flex-col justify-center" style={{ backgroundColor: '#c2410c', color: '#fff7ed' }}>
                <h3 className="text-3xl font-bold mb-6 border-b border-white/30 pb-4">{data.leftTitle}</h3>
                <p className="text-xl leading-relaxed opacity-90">{data.leftContent}</p>
            </div>
            <div className="w-1/2 p-16 flex flex-col justify-center" style={{ color: '#7c2d12' }}>
                <h3 className="text-3xl font-bold mb-6 border-b pb-4" style={{ borderColor: '#fdba74' }}>{data.rightTitle}</h3>
                <p className="text-xl leading-relaxed opacity-80">{data.rightContent}</p>
            </div>
        </div>
    );

};

export const layoutName = "Two Column Text";
export const layoutDescription = "Split text content";

export default TwoColumnSlideLayoutComponent;
