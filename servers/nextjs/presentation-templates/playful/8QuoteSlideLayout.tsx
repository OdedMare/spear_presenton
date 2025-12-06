import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    quote: z.string().default("Innovation distinguishes between a leader and a follower."),
    author: z.string().default("Steve Jobs"),

});

const QuoteSlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full flex flex-col items-center justify-center p-20 text-center" style={{ backgroundColor: '#fff1f2', color: '#881337' }}>
            <div className="text-9xl opacity-20 font-serif leading-none" style={{ color: '#e11d48' }}>"</div>
            <p className="text-4xl font-serif italic mb-12 -mt-8 relative z-10">{data.quote}</p>
            <div className="w-24 h-1 mb-6" style={{ backgroundColor: '#fb7185' }} />
            <p className="text-xl font-bold uppercase tracking-widest" style={{ color: '#e11d48' }}>— {data.author}</p>
        </div>
    );

};

export const layoutName = "Quote";
export const layoutDescription = "Big inspirational quote";

export default QuoteSlideLayoutComponent;
