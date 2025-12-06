import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    title: z.string().describe("Main title of the presentation").min(1).max(100).default("Presentation Title"),
    subtitle: z.string().describe("Subtitle or presenter name").min(1).max(200).default("Subtitle goes here"),
    image: ImageSchema.optional().describe("Optional background or hero image"),

});

const TitleSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    const { title, subtitle, image } = data;
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
            {image && (
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src={image.__image_url__} alt={image.__image_prompt__} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="z-10 relative max-w-4xl space-y-6">
                <h1 className="text-6xl font-bold tracking-tight" style={{ color: '#1d4ed8' }}>{title}</h1>
                <p className="text-2xl opacity-90" style={{ color: '#1e40af' }}>{subtitle}</p>
                <div className="w-32 h-2 rounded-full mx-auto mt-8" style={{ backgroundColor: '#93c5fd' }} />
            </div>
        </div>
    );

};

export const layoutName = "Title Slide";
export const layoutDescription = "Main title slide layout with subtitle";

export default TitleSlideLayoutComponent;
