import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // In development, allow all editor access
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // In production, require EDITOR_SECRET
  const editorSecret = process.env.EDITOR_SECRET;
  if (!editorSecret) {
    return new NextResponse("Editor not configured", { status: 503 });
  }

  const authHeader = request.headers.get("x-editor-secret");
  const authCookie = request.cookies.get("editor-secret")?.value;

  if (authHeader === editorSecret || authCookie === editorSecret) {
    return NextResponse.next();
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/edit/:path*", "/api/puck/:path*"],
};
