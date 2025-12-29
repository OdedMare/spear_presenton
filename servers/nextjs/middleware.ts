import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/can-change-keys',
  '/api/has-required-key',
  '/api/telemetry-status',
  '/api/diagnostics',
];

// API routes that are called by Puppeteer (internal) - don't need Bearer token
const INTERNAL_API_ROUTES = [
  '/api/presentation_to_pptx_model',
  '/api/export-as-pdf',
  '/api/template',
];

export function middleware(request: NextRequest) {
  const authRequired = process.env.NEXT_PUBLIC_REQUIRE_AUTH?.toLowerCase() === 'true';

  // If auth is not required, allow all requests
  if (!authRequired) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Only check API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow internal API routes (Puppeteer)
  if (INTERNAL_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  // Let the request proceed - actual validation happens in API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
