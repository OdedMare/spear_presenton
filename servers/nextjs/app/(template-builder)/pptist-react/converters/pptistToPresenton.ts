import type { PptistProject } from "@/app/(presentation-generator)/template-builder/types";
import {
  convertPptistToPresentonLayout,
  presentonSlideToHtml,
} from "@/app/(presentation-generator)/template-builder/utils/pptistAdapter";

export { convertPptistToPresentonLayout, presentonSlideToHtml };

// Thin re-export so the new React editor can reuse the tested adapter path.
export type { PptistProject };
