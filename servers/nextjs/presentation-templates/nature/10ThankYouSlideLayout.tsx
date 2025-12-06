import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    message: z.string().default("Thank You"),
    email: z.string().default("contact@example.com"),
    website: z.string().default("www.example.com"),

});

const ThankYouSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex flex-col items-center justify-center p-12" style={{ backgroundColor: '#15803d', color: '#f0fdf4' }}>
            <h1 className="text-7xl font-bold mb-12 transform hover:scale-105 transition-transform">{data.message}</h1>
            <div className="flex space-x-12 text-xl font-medium">
                <div className="flex items-center gap-3">
                    <span className="opacity-70">✉️</span> 
                    <span>{data.email}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="opacity-70">🌐</span> 
                    <span>{data.website}</span>
                </div>
            </div>
             <div className="mt-20 opacity-50 text-sm">
                Generated with Spear Presenton
            </div>
        </div>
    );

};

export const layoutName = "Thank You";
export const layoutDescription = "Closing slide with contacts";

export default ThankYouSlideLayoutComponent;
