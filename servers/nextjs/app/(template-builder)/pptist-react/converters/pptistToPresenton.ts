import type { PptistProject } from "../../template-builder/types";
import {
  convertPptistToPresentonLayout,
  presentonSlideToHtml,
} from "../../template-builder/utils/pptistAdapter";

export { convertPptistToPresentonLayout, presentonSlideToHtml };

// Thin re-export so the new React editor can reuse the tested adapter path.
export type { PptistProject };

