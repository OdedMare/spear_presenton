import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    heading: z.string().describe("Section heading").default("Introduction"),
    content: z.string().describe("Main introductory text").default("Welcome to the presentation. Here we will discuss..."),

});

const IntroductionSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex flex-row p-12" style={{ backgroundColor: '#fff1f2', color: '#881337' }}>
            <div className="w-1/3 border-r-4 pr-8 flex items-center justify-end" style={{ borderColor: '#f43f5e' }}>
                 <h2 className="text-5xl font-bold text-right" style={{ color: '#e11d48' }}>{data.heading}</h2>
            </div>
            <div className="w-2/3 pl-12 flex items-center">
                <p className="text-2xl leading-relaxed">{data.content}</p>
            </div>
        </div>
    );

};

export const layoutName = "Introduction";
export const layoutDescription = "Introduction to the topic";

export default IntroductionSlideLayoutComponent;
