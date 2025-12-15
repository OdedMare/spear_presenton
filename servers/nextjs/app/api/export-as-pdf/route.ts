import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import { sanitizeFilename } from "@/app/(presentation-generator)/utils/others";
import { NextResponse, NextRequest } from "next/server";
import { logger, logPdfExport, logError } from "@/utils/logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let presentationId: string = '';

  try {
    const { id, title } = await req.json();
    presentationId = id;

    logPdfExport(id, 'started', undefined, { title });

    if (!id) {
      return NextResponse.json(
        { error: "Missing Presentation ID" },
        { status: 400 }
      );
    }

    logger.info(`Starting PDF export for presentation ${id}`);
    const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--disable-crash-reporter",
      "--disable-breakpad",
      "--disable-extensions",
      "--disable-software-rasterizer",
      "--single-process", // Run in single process mode for containerized environments
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.setDefaultNavigationTimeout(300000);
  page.setDefaultTimeout(300000);

  // Use environment variable or 127.0.0.1 for base URL
  // Using 127.0.0.1 instead of localhost for better OpenShift compatibility
  const baseUrl = process.env.NEXTJS_BASE_URL || 'http://127.0.0.1:3000';

  await page.goto(`${baseUrl}/pdf-maker?id=${id}`, {
    waitUntil: "networkidle0",
    timeout: 300000,
  });

  await page.waitForFunction('() => document.readyState === "complete"');

  try {
    await page.waitForFunction(
      `
      () => {
        const allElements = document.querySelectorAll('*');
        let loadedElements = 0;
        let totalElements = allElements.length;
        
        for (let el of allElements) {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0';
            
            if (isVisible && el.offsetWidth > 0 && el.offsetHeight > 0) {
                loadedElements++;
            }
        }
        
        return (loadedElements / totalElements) >= 0.99;
      }
      `,
      { timeout: 300000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.log("Warning: Some content may not have loaded completely:", error);
  }

  const pdfBuffer = await page.pdf({
    width: "1280px",
    height: "720px",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  browser.close();

  const sanitizedTitle = sanitizeFilename(title ?? "presentation");
  const destinationPath = path.join(
    process.env.APP_DATA_DIRECTORY!,
    "exports",
    `${sanitizedTitle}.pdf`
  );
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.promises.writeFile(destinationPath, pdfBuffer);

  const duration = Date.now() - startTime;
  logPdfExport(id, 'completed', duration, { title, filename: `${sanitizedTitle}.pdf` });
  logger.info(`PDF export completed for ${id} in ${duration}ms`);

  return NextResponse.json({
    success: true,
    path: `/api/v1/ppt/files/download/${sanitizedTitle}.pdf`,
  });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logPdfExport(presentationId || 'unknown', 'failed', duration, {
      error: error.message,
      stack: error.stack
    });
    logError(error, 'PDF Export', { presentation_id: presentationId });

    return NextResponse.json(
      { error: `Failed to export PDF: ${error.message}` },
      { status: 500 }
    );
  }
}
