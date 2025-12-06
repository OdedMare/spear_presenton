import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    steps: z.array(z.object({
        title: z.string(),
        description: z.string()
    })).min(3).max(4).default([
        { title: "Step 1", description: "Plan" },
        { title: "Step 2", description: "Execute" },
        { title: "Step 3", description: "Review" }
    ]),

});

const ProcessSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex flex-col justify-center p-12" style={{ backgroundColor: '#09090b', color: '#e4e4e7' }}>
            <div className="flex justify-between items-start relative">
                {/* Connecting Line */}
                <div className="absolute top-8 left-0 w-full h-2 -z-10" style={{ backgroundColor: '#22d3ee' }} />
                
                {data.steps?.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center w-64 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 z-10 border-4" 
                             style={{ backgroundColor: '#d946ef', color: '#09090b', borderColor: '#09090b' }}>
                            {idx + 1}
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#8b5cf6' }}>{step.title}</h3>
                        <p className="text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

};

export const layoutName = "Process Flow";
export const layoutDescription = "Step by step process";

export default ProcessSlideLayoutComponent;
