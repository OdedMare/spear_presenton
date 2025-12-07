import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export const dynamic = "force-dynamic"; // Ensure this route is not cached

export async function GET() {
    const checks: Record<string, any> = {
        timestamp: new Date().toISOString(),
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
        },
        env: {
            APP_DATA_DIRECTORY: process.env.APP_DATA_DIRECTORY || "NOT_SET",
            TEMP_DIRECTORY: process.env.TEMP_DIRECTORY || "NOT_SET",
            PUPPETEER_EXECUTABLE_PATH:
                process.env.PUPPETEER_EXECUTABLE_PATH || "NOT_SET",
        },
    };

    // 1. Check Temporary Directory Permissions
    try {
        const tempDir = process.env.TEMP_DIRECTORY || "/tmp/presenton";
        const testFile = path.join(tempDir, `diag_${Date.now()}.txt`);

        // Try to write
        fs.writeFileSync(testFile, "test permission");
        // Try to read
        const content = fs.readFileSync(testFile, "utf-8");
        // Try to delete
        fs.unlinkSync(testFile);

        checks.tempDirectory = {
            status: content === "test permission" ? "OK" : "FAIL",
            path: tempDir,
            message: "Write/Read/Delete successful",
        };
    } catch (err: any) {
        checks.tempDirectory = {
            status: "FAIL",
            error: err.message,
        };
    }

    // 2. Check Puppeteer/Browser
    try {
        const browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        });
        const version = await browser.version();
        await browser.close();

        checks.puppeteer = {
            status: "OK",
            version: version,
        };
    } catch (err: any) {
        checks.puppeteer = {
            status: "FAIL",
            error: err.message,
            suggestion: "Missing system dependencies (libnss3, libatk, etc.)?",
        };
    }

    // 3. Check Internal Connectivity to Next.js (Localhost:3000)
    try {
        const res = await fetch("http://localhost:3000/api/diagnostics/ping", {
            next: { revalidate: 0 }
        });
        // We haven't created this ping route, but if we get 404 it means we connected!
        // Getting ECONNREFUSED means we failed.
        checks.internalConnectivity = {
            status: "OK",
            message: `Connected (Status: ${res.status}) - Loopback works`
        }
    } catch (err: any) {
        checks.internalConnectivity = {
            status: "FAIL",
            error: err.message,
            hint: "Is 'localhost' resolving correctly in the container?"
        }
    }

    // 4. Check Connectivity to FastAPI (via existing rewrite or direct port)
    // We can try to hit the layouts endpoint which proxies to :8000
    try {
        const res = await fetch("http://localhost:3000/api/v1/ppt/layouts", {
            method: "GET",
            next: { revalidate: 0 }
        });
        // 200 or 401/404 is fine, implies connectivity.
        checks.fastApiConnectivity = {
            status: res.ok ? "OK" : "WARN",
            statusCode: res.status,
            message: "Connected to Python Backend"
        }

    } catch (err: any) {
        checks.fastApiConnectivity = {
            status: "FAIL",
            error: err.message,
            hint: "Is the Python server running on port 8000?"
        }
    }

    return NextResponse.json(checks);
}
