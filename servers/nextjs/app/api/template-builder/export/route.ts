import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { v4 as uuidv4 } from "uuid";
import puppeteer from "puppeteer";
import {
  convertPptistToPresentonLayout,
  presentonSlideToHtml,
} from "@/app/(presentation-generator)/template-builder/utils/pptistAdapter";
import {
  PptistProject,
  PresentonLayout,
  PresentonSlide,
} from "@/app/(presentation-generator)/template-builder/types";

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

const getAppDataDir = () =>
  process.env.APP_DATA_DIRECTORY ||
  resolve(process.cwd(), "..", "..", "app_data");

const getImagesDir = () => join(getAppDataDir(), "images", "pptist");

const persistBufferAsPng = async (buffer: Buffer | Uint8Array, filename: string) => {
  const dir = getImagesDir();
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, filename);
  const normalizedBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await writeFile(filePath, normalizedBuffer);
  return `/app_data/images/pptist/${filename}`;
};

const persistDataUrl = async (dataUrl: string, filename: string) => {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Invalid data URL");
  const buffer = Buffer.from(base64, "base64");
  return persistBufferAsPng(buffer, filename);
};

const screenshotHtml = async (html: string, width: number, height: number) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: Math.round(width), height: Math.round(height) });
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.screenshot({ fullPage: true, type: "png" });
  await browser.close();
  return buffer;
};

const callSlideToHtml = async (
  html: string,
  imagePath: string,
  fonts: string[]
): Promise<string> => {
  try {
    const res = await fetch(`${FASTAPI_BASE}/api/v1/ppt/slide-to-html/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imagePath, xml: html, fonts }),
    });
    const data = await res.json();
    if (res.ok && data?.html) return data.html as string;
    console.warn("slide-to-html failed, falling back to generated HTML", data);
  } catch (error) {
    console.warn("slide-to-html error", error);
  }
  return html;
};

const callHtmlToReact = async (html: string, imagePath?: string) => {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/ppt/html-to-react/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, image: imagePath }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || "html-to-react failed");
  }
  return (data.react_component || data.component_code || "").toString();
};

const saveLayouts = async (
  presentationId: string,
  title: string,
  layouts: {
    presentation: string;
    layout_id: string;
    layout_name: string;
    layout_code: string;
    fonts: string[];
  }[],
  fonts: string[]
) => {
  await fetch(`${FASTAPI_BASE}/api/v1/ppt/template-management/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: presentationId,
      name: title,
      description: "Imported from PPTist",
    }),
  });

  const res = await fetch(
    `${FASTAPI_BASE}/api/v1/ppt/template-management/save-templates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        layouts,
        fonts,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.detail || "Failed to save templates");
  }
  return data;
};

const buildHtmlAndScreenshot = async (
  slide: PresentonSlide,
  layout: PresentonLayout,
  requestedPreview?: string
) => {
  const html = presentonSlideToHtml(slide, layout.meta);
  if (requestedPreview) {
    const imagePath = await persistDataUrl(
      requestedPreview,
      `${layout.id}-${slide.id}.png`
    );
    return { html, imagePath };
  }

  const screenshot = await screenshotHtml(
    html,
    layout.meta.width || 1280,
    layout.meta.height || 720
  );
  const imagePath = await persistBufferAsPng(
    screenshot,
    `${layout.id}-${slide.id}.png`
  );
  return { html, imagePath };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = body?.project as PptistProject | undefined;

    if (!project?.slides?.length) {
      return NextResponse.json(
        { success: false, error: "Missing PPTist payload" },
        { status: 400 }
      );
    }

    const layout = convertPptistToPresentonLayout(project);
    const presentationId = body.presentationId || layout.id || uuidv4();
    const fonts = layout.meta.fonts || [];

    const layoutResults = [];
    for (const slide of layout.slides) {
      const { html: generatedHtml, imagePath } = await buildHtmlAndScreenshot(
        slide,
        layout,
        body?.preview
      );
      const slideHtml = await callSlideToHtml(generatedHtml, imagePath, fonts);
      const reactComponent = await callHtmlToReact(slideHtml, imagePath);

      layoutResults.push({
        presentation: presentationId,
        layout_id: slide.id,
        layout_name: slide.name,
        layout_code: reactComponent,
        fonts,
      });
    }

    await saveLayouts(presentationId, layout.title, layoutResults, fonts);

    return NextResponse.json({
      success: true,
      presentationId,
      savedCount: layoutResults.length,
      layouts: layoutResults.map((item) => ({ layoutId: item.layout_id })),
    });
  } catch (error: any) {
    console.error("Template builder export failed", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
