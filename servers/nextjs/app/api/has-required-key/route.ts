import { NextResponse } from "next/server";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  const userConfigPath = process.env.USER_CONFIG_PATH;

  let configFromFile: Record<string, string> = {};
  if (userConfigPath && fs.existsSync(userConfigPath)) {
    try {
      const raw = fs.readFileSync(userConfigPath, "utf-8");
      configFromFile = JSON.parse(raw || "{}");
    } catch {}
  }

  const getValue = (key: string) =>
    (configFromFile?.[key] || process.env[key] || "").trim();

  const customUrl = getValue("CUSTOM_LLM_URL");
  const customModel = getValue("CUSTOM_MODEL");
  const hasKey = Boolean(customUrl && customModel);

  return NextResponse.json({ hasKey });
}
