import { create } from "zustand";
import { ToolbarStates } from "../../../../pptist/types/toolbar";
import type { DialogForExportTypes } from "../../../../pptist/types/export";
import type {
  CreatingElement,
  ShapeFormatPainter,
  TextFormatPainter,
} from "../../../../pptist/types/edit";
import type { TextAttrs } from "../../../../pptist/utils/prosemirror/utils";
import { defaultRichTextAttrs } from "../../../../pptist/utils/prosemirror/utils";

export interface MainState {
  activeElementIdList: string[];
  handleElementId: string;
  activeGroupElementId: string;
  hiddenElementIdList: string[];
  canvasPercentage: number;
  canvasScale: number;
  canvasDragged: boolean;
  thumbnailsFocus: boolean;
  editorAreaFocus: boolean;
  disableHotkeys: boolean;
  gridLineSize: number;
  showRuler: boolean;
  creatingElement: CreatingElement | null;
  creatingCustomShape: boolean;
  toolbarState: ToolbarStates;
  clipingImageElementId: string;
  isScaling: boolean;
  richTextAttrs: TextAttrs;
  selectedTableCells: string[];
  selectedSlidesIndex: number[];
  dialogForExport: DialogForExportTypes | "presenton";
  databaseId: string;
  textFormatPainter: TextFormatPainter | null;
  shapeFormatPainter: ShapeFormatPainter | null;
  showSelectPanel: boolean;
  showSearchPanel: boolean;
  showNotesPanel: boolean;
  showSymbolPanel: boolean;
  showMarkupPanel: boolean;
  showImageLibPanel: boolean;
  showAIPPTDialog: boolean;
}

type MainActions = {
  setActiveElementIdList: (ids: string[]) => void;
  setHandleElementId: (id: string) => void;
  setActiveGroupElementId: (id: string) => void;
  setHiddenElementIdList: (ids: string[]) => void;
  setCanvasPercentage: (percentage: number) => void;
  setCanvasScale: (scale: number) => void;
  setCanvasDragged: (dragged: boolean) => void;
  setThumbnailsFocus: (focus: boolean) => void;
  setEditorareaFocus: (focus: boolean) => void;
  setDisableHotkeysState: (disable: boolean) => void;
  setGridLineSize: (size: number) => void;
  setRulerState: (show: boolean) => void;
  setCreatingElement: (el: CreatingElement | null) => void;
  setCreatingCustomShapeState: (state: boolean) => void;
  setToolbarState: (state: ToolbarStates) => void;
  setClipingImageElementId: (id: string) => void;
  setRichtextAttrs: (attrs: TextAttrs) => void;
  setSelectedTableCells: (cells: string[]) => void;
  setScalingState: (scaling: boolean) => void;
  updateSelectedSlidesIndex: (indexes: number[]) => void;
  setDialogForExport: (type: DialogForExportTypes | "presenton") => void;
  setTextFormatPainter: (painter: TextFormatPainter | null) => void;
  setShapeFormatPainter: (painter: ShapeFormatPainter | null) => void;
  setSelectPanelState: (show: boolean) => void;
  setSearchPanelState: (show: boolean) => void;
  setNotesPanelState: (show: boolean) => void;
  setSymbolPanelState: (show: boolean) => void;
  setMarkupPanelState: (show: boolean) => void;
  setImageLibPanelState: (show: boolean) => void;
  setAIPPTDialogState: (show: boolean) => void;
};

export const useMainStore = create<MainState & MainActions>((set) => ({
  activeElementIdList: [],
  handleElementId: "",
  activeGroupElementId: "",
  hiddenElementIdList: [],
  canvasPercentage: 90,
  canvasScale: 1,
  canvasDragged: false,
  thumbnailsFocus: false,
  editorAreaFocus: false,
  disableHotkeys: false,
  gridLineSize: 0,
  showRuler: false,
  creatingElement: null,
  creatingCustomShape: false,
  toolbarState: ToolbarStates.SLIDE_DESIGN,
  clipingImageElementId: "",
  isScaling: false,
  richTextAttrs: defaultRichTextAttrs,
  selectedTableCells: [],
  selectedSlidesIndex: [],
  dialogForExport: "",
  databaseId: "",
  textFormatPainter: null,
  shapeFormatPainter: null,
  showSelectPanel: false,
  showSearchPanel: false,
  showNotesPanel: false,
  showSymbolPanel: false,
  showMarkupPanel: false,
  showImageLibPanel: false,
  showAIPPTDialog: false,
  setActiveElementIdList: (ids) =>
    set((state) => ({
      activeElementIdList: ids,
      handleElementId: ids.length === 1 ? ids[0] : state.handleElementId,
    })),
  setHandleElementId: (id) => set({ handleElementId: id }),
  setActiveGroupElementId: (id) => set({ activeGroupElementId: id }),
  setHiddenElementIdList: (ids) => set({ hiddenElementIdList: ids }),
  setCanvasPercentage: (percentage) => set({ canvasPercentage: percentage }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setCanvasDragged: (dragged) => set({ canvasDragged: dragged }),
  setThumbnailsFocus: (focus) => set({ thumbnailsFocus: focus }),
  setEditorareaFocus: (focus) => set({ editorAreaFocus: focus }),
  setDisableHotkeysState: (disable) => set({ disableHotkeys: disable }),
  setGridLineSize: (size) => set({ gridLineSize: size }),
  setRulerState: (show) => set({ showRuler: show }),
  setCreatingElement: (el) => set({ creatingElement: el }),
  setCreatingCustomShapeState: (state) => set({ creatingCustomShape: state }),
  setToolbarState: (state) => set({ toolbarState: state }),
  setClipingImageElementId: (id) => set({ clipingImageElementId: id }),
  setRichtextAttrs: (attrs) => set({ richTextAttrs: attrs }),
  setSelectedTableCells: (cells) => set({ selectedTableCells: cells }),
  setScalingState: (scaling) => set({ isScaling: scaling }),
  updateSelectedSlidesIndex: (indexes) => set({ selectedSlidesIndex: indexes }),
  setDialogForExport: (type) => set({ dialogForExport: type }),
  setTextFormatPainter: (painter) => set({ textFormatPainter: painter }),
  setShapeFormatPainter: (painter) => set({ shapeFormatPainter: painter }),
  setSelectPanelState: (show) => set({ showSelectPanel: show }),
  setSearchPanelState: (show) => set({ showSearchPanel: show }),
  setNotesPanelState: (show) => set({ showNotesPanel: show }),
  setSymbolPanelState: (show) => set({ showSymbolPanel: show }),
  setMarkupPanelState: (show) => set({ showMarkupPanel: show }),
  setImageLibPanelState: (show) => set({ showImageLibPanel: show }),
  setAIPPTDialogState: (show) => set({ showAIPPTDialog: show }),
}));
