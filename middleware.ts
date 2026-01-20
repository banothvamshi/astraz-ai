import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for request monitoring, security, and route protection
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next();

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    const adminKey = request.cookies.get("astraz_admin_key")?.value;
    const headerKey = request.headers.get("x-admin-key");
    const validKey = process.env.ADMIN_SECRET_KEY || "astraz-admin-2024";

    if (adminKey !== validKey && headerKey !== validKey) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Dashboard protection - simplified (detailed check happens on client side)
  if (pathname.startsWith("/dashboard") && !pathname.includes("/dashboard/debug-parser")) {
    // Check if user is authenticated (has session cookie)
    const hasSession = request.cookies.has("sb-access-token") ||
      request.cookies.has("supabase-auth-token") ||
      request.cookies.getAll().some(cookie => cookie.name.startsWith("sb-"));

    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // CORS headers for API routes
  if (pathname.startsWith("/api")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

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
