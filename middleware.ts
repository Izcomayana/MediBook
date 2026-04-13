import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Firebase client SDK stores auth in localStorage — not cookies —
// so middleware cannot verify the token server-side without extra setup.
// Route protection is handled client-side by RoleGuard instead.
// This middleware is kept minimal: it just lets all requests through.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/admin/:path*"],
};