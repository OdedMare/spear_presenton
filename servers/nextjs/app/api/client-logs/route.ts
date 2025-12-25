import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

type ClientLogLevel = "debug" | "info" | "warn" | "error";

const normalizeLevel = (level: unknown): ClientLogLevel => {
  if (typeof level !== "string") {
    return "info";
  }
  switch (level.toLowerCase()) {
    case "debug":
      return "debug";
    case "info":
      return "info";
    case "warn":
      return "warn";
    case "error":
      return "error";
    default:
      return "info";
  }
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    if (
      !payload ||
      typeof payload.message !== "string" ||
      payload.message.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Invalid log payload" },
        { status: 400 }
      );
    }

    const level = normalizeLevel(payload.level);
    const extra =
      typeof payload.extra === "object" && payload.extra !== null
        ? payload.extra
        : {};

    const logData: Record<string, any> = {
      ...extra,
      source: "client",
      client_path: typeof payload.path === "string" ? payload.path : undefined,
      client_timestamp:
        typeof payload.timestamp === "string" ? payload.timestamp : undefined,
      user_agent: request.headers.get("user-agent") || undefined,
    };

    if (typeof payload.event_type === "string" && payload.event_type.trim()) {
      logData.event_type = payload.event_type;
    }

    switch (level) {
      case "debug":
        logger.debug(payload.message, logData);
        break;
      case "warn":
        logger.warn(payload.message, logData);
        break;
      case "error":
        logger.error(payload.message, logData);
        break;
      default:
        logger.info(payload.message, logData);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Client log ingest failed", {
      event_type: "client_log_ingest_failed",
      error,
    });
    return NextResponse.json(
      { error: "Failed to ingest log" },
      { status: 500 }
    );
  }
}
