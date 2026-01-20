import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logMetric } from "@/lib/monitoring";

/**
 * Middleware for request monitoring, security, and route protection
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;

  // Admin route protection - check for admin key in cookie/header
  if (pathname.startsWith("/admin")) {
    const adminKey = request.cookies.get("astraz_admin_key")?.value;
    const headerKey = request.headers.get("x-admin-key");
    const validKey = process.env.ADMIN_SECRET_KEY || "astraz-admin-2024";

    if (adminKey !== validKey && headerKey !== validKey) {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS headers for API routes
  if (pathname.startsWith("/api")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  // Log metrics after response
  response.headers.set("X-Request-ID", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/user-portal/:path*",
  ],
};

