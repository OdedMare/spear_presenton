import { create } from "zustand";
import { omit } from "lodash";
import type {
  Slide,
  SlideTemplate,
  SlideTheme,
  PPTElement,
} from "../types/pptist";
import { v4 as uuidv4 } from "uuid";

export interface SlidesState {
  title: string;
  theme: SlideTheme;
  slides: Slide[];
  slideIndex: number;
  viewportSize: number;
  viewportRatio: number;
  templates: SlideTemplate[];
}

export interface SlidesActions {
  setTitle: (title: string) => void;
  setTheme: (theme: Partial<SlideTheme>) => void;
  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide | Slide[]) => void;
  addBlankSlideAfter: (index?: number) => Slide;
  duplicateSlide: (index: number) => void;
  removeSlideProps: (data: { id: string; propName: string | string[] }) => void;
  updateSlide: (props: Partial<Slide>, slideId?: string) => void;
  deleteSlide: (slideId: string | string[]) => void;
  updateSlideIndex: (index: number) => void;
  setViewportSize: (size: number) => void;
  setViewportRatio: (ratio: number) => void;
  setTemplates: (templates: SlideTemplate[]) => void;
  addElement: (element: PPTElement | PPTElement[]) => void;
  deleteElement: (elementId: string | string[]) => void;
  updateElement: (data: { id: string | string[]; props: Partial<PPTElement>; slideId?: string }) => void;
  removeElementProps: (data: { id: string; propName: string | string[] }) => void;
}

const initialState: SlidesState = {
  title: "Untitled Presentation",
  theme: {
    themeColors: [
      "#5b9bd5",
      "#ed7d31",
      "#a5a5a5",
      "#ffc000",
      "#4472c4",
      "#70ad47",
    ],
    fontColor: "#333",
    fontName: "",
    backgroundColor: "#fff",
    shadow: {
      h: 3,
      v: 3,
      blur: 2,
      color: "#808080",
    },
    outline: {
      width: 2,
      color: "#525252",
      style: "solid",
    },
  },
  slides: [],
  slideIndex: 0,
  viewportSize: 1000,
  viewportRatio: 0.5625,
  templates: [
    {
      name: "Crimson Mountains",
      id: "template_1",
      cover: "./imgs/template_1.webp",
      origin: "Official",
    },
    {
      name: "Urban Blue",
      id: "template_2",
      cover: "./imgs/template_2.webp",
      origin: "Official",
    },
    {
      name: "Geometric Sense",
      id: "template_3",
      cover: "./imgs/template_3.webp",
      origin: "Official",
    },
    {
      name: "Soft Morandi",
      id: "template_4",
      cover: "./imgs/template_4.webp",
      origin: "Official",
    },
    {
      name: "Minimal Green",
      id: "template_5",
      cover: "./imgs/template_5.webp",
      origin: "Community + Official Enhanced",
    },
    {
      name: "Warm Retro",
      id: "template_6",
      cover: "./imgs/template_6.webp",
      origin: "Community + Official Enhanced",
    },
    {
      name: "Deep Steady",
      id: "template_7",
      cover: "./imgs/template_7.webp",
      origin: "Community + Official Enhanced",
    },
    {
      name: "Light Blue Fresh",
      id: "template_8",
      cover: "./imgs/template_8.webp",
      origin: "Community + Official Enhanced",
    },
  ],
};

export const useSlidesStore = create<SlidesState & SlidesActions>((set, get) => ({
  ...initialState,
  addBlankSlideAfter: (index) => {
    const slide: Slide = {
      id: uuidv4(),
      elements: [],
      background: { type: "solid", color: "#ffffff" },
    };
    set((state) => {
      const insertIndex =
        typeof index === "number" ? index + 1 : state.slideIndex + 1;
      const slides = [...state.slides];
      slides.splice(insertIndex, 0, slide);
      return { slides, slideIndex: insertIndex };
    });
    return slide;
  },
  duplicateSlide: (index) =>
    set((state) => {
      const srcIndex = Math.min(Math.max(index, 0), state.slides.length - 1);
      const original = state.slides[srcIndex];
      if (!original) return state;
      const clone: Slide = JSON.parse(JSON.stringify(original));
      clone.id = uuidv4();
      const slides = [...state.slides];
      slides.splice(srcIndex + 1, 0, clone);
      return { slides, slideIndex: srcIndex + 1 };
    }),
  setTitle: (title) =>
    set(() => ({
      title: title || "Untitled Presentation",
    })),
  setTheme: (theme) =>
    set((state) => ({
      theme: { ...state.theme, ...theme },
    })),
  setSlides: (slides) =>
    set((state) => {
      const safeIndex = Math.min(Math.max(state.slideIndex, 0), slides.length - 1);
      return { slides, slideIndex: safeIndex < 0 ? 0 : safeIndex };
    }),
  addSlide: (slide) =>
    set((state) => {
      const slides = Array.isArray(slide) ? slide : [slide];
      const addIndex = state.slideIndex + 1;
      const nextSlides = [...state.slides];
      nextSlides.splice(addIndex, 0, ...slides);
      return { slides: nextSlides, slideIndex: addIndex };
    }),
  updateSlide: (props, slideId) =>
    set((state) => {
      const idx = slideId
        ? state.slides.findIndex((s) => s.id === slideId)
        : state.slideIndex;
      if (idx < 0) return state;
      const slides = [...state.slides];
      slides[idx] = { ...slides[idx], ...props };
      return { slides };
    }),
  deleteSlide: (slideId) =>
    set((state) => {
      const ids = Array.isArray(slideId) ? slideId : [slideId];
      const slides = state.slides.filter((s) => !ids.includes(s.id));
      const nextIndex = Math.min(Math.max(state.slideIndex, 0), slides.length - 1);
      return { slides, slideIndex: nextIndex < 0 ? 0 : nextIndex };
    }),
  updateSlideIndex: (index) =>
    set((state) => ({
      slideIndex: Math.min(Math.max(index, 0), Math.max(state.slides.length - 1, 0)),
    })),
  setViewportSize: (size) => set(() => ({ viewportSize: size })),
  setViewportRatio: (ratio) => set(() => ({ viewportRatio: ratio })),
  setTemplates: (templates) => set(() => ({ templates })),
  removeSlideProps: (data) =>
    set((state) => {
      const { id, propName } = data;
      const propNames = Array.isArray(propName) ? propName : [propName];
      const slides = state.slides.map((slide) =>
        slide.id === id ? (omit(slide, propNames) as Slide) : slide
      );
      return { slides };
    }),
  addElement: (element) =>
    set((state) => {
      const elements = Array.isArray(element) ? element : [element];
      const slides = [...state.slides];
      const current = slides[state.slideIndex];
      const newEls = [...(current?.elements || []), ...elements];
      slides[state.slideIndex] = { ...current, elements: newEls } as Slide;
      return { slides };
    }),
  deleteElement: (elementId) =>
    set((state) => {
      const elementIdList = Array.isArray(elementId) ? elementId : [elementId];
      const slides = [...state.slides];
      const current = slides[state.slideIndex];
      const newEls = (current?.elements || []).filter(
        (el) => !elementIdList.includes(el.id)
      );
      slides[state.slideIndex] = { ...current, elements: newEls } as Slide;
      return { slides };
    }),
  updateElement: (data) =>
    set((state) => {
      const { id, props, slideId } = data;
      const elIdList = typeof id === "string" ? [id] : id;
      const slides = [...state.slides];
      const slideIndex = slideId
        ? slides.findIndex((s) => s.id === slideId)
        : state.slideIndex;
      if (slideIndex < 0) return state;
      const slide = slides[slideIndex];
      const elements = (slide?.elements || []).map((el) =>
        elIdList.includes(el.id) ? ({ ...el, ...props } as PPTElement) : el
      );
      slides[slideIndex] = { ...slide, elements } as Slide;
      return { slides };
    }),
  removeElementProps: (data) =>
    set((state) => {
      const { id, propName } = data;
      const propNames = Array.isArray(propName) ? propName : [propName];
      const slides = [...state.slides];
      const slide = slides[state.slideIndex];
      const elements = (slide?.elements || []).map((el) =>
        el.id === id ? (omit(el, propNames) as PPTElement) : el
      );
      slides[state.slideIndex] = { ...slide, elements } as Slide;
      return { slides };
    }),
}));
