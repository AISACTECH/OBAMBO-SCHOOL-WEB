import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/security";

const secretKey = new TextEncoder().encode(getAuthSecret());
const SESSION_ISSUER = "stmarks-obambo";
const SESSION_AUDIENCE = "stmarks-digital-campus";

async function isAuthenticated(req: NextRequest, cookieName: string) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const ok = await isAuthenticated(req, "stmarks_admin_session");
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/portal") && pathname !== "/portal/login" && !pathname.startsWith("/portal/forgot-password")) {
    const ok = await isAuthenticated(req, "stmarks_student_session");
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/alumni/dashboard")) {
    const ok = await isAuthenticated(req, "stmarks_alumni_session");
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/alumni/login";
      url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/alumni/dashboard/:path*"],
};
