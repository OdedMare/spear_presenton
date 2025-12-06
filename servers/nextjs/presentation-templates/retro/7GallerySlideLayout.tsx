import * as z from "zod";
import { ImageSchema, IconSchema } from "@/presentation-templates/defaultSchemes";

export const Schema = z.object({

    images: z.array(z.object({
        src: ImageSchema,
        caption: z.string().optional()
    })).min(1).max(3).default([]),

});

const GallerySlideLayoutComponent = ({ data }: { data: z.infer<typeof Schema> }) => {
    
    return (
        <div className="w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full p-12 grid grid-cols-3 gap-6" style={{ backgroundColor: '#fef3c7' }}>
            {data.images?.map((img, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-xl shadow-lg h-full">
                    <img src={img.src.__image_url__} alt={img.src.__image_prompt__} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {img.caption && (
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-black bg-opacity-60 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.caption}
                        </div>
                    )}
                </div>
            ))}
            {(!data.images || data.images.length === 0) && (
                <div className="col-span-3 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                    No images provided
                </div>
            )}
        </div>
    );

};

export const layoutName = "Image Gallery";
export const layoutDescription = "Three images with captions";

export default GallerySlideLayoutComponent;
