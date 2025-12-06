import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    stats: z.array(z.object({
        value: z.string(),
        label: z.string()
    })).min(1).max(3).default([
        { value: "100%", label: "Satisfaction" },
        { value: "24/7", label: "Support" },
        { value: "50k+", label: "Users" }
    ]),

});

const StatsSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex items-center justify-around p-12" style={{ backgroundColor: '#f0fdf4', color: '#14532d' }}>
            {data.stats?.map((stat, idx) => (
                <div key={idx} className="text-center p-8 rounded-2xl w-1/3 mx-4" style={{ border: `2px solid #86efac` }}>
                    <div className="text-7xl font-black mb-4" style={{ color: '#15803d' }}>{stat.value}</div>
                    <div className="text-2xl font-medium tracking-wider uppercase" style={{ color: '#166534' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );

};

export const layoutName = "Key Statistics";
export const layoutDescription = "Showcase huge numbers";

export default StatsSlideLayoutComponent;
