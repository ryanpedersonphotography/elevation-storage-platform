import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/puck-data";

export async function GET(request: NextRequest) {
  const pagePath = request.nextUrl.searchParams.get("path") || "/";
  const data = await dataStore.load(pagePath);

  if (!data) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path: pagePath, data } = body;

  if (!pagePath || !data) {
    return NextResponse.json({ error: "Missing path or data" }, { status: 400 });
  }

  await dataStore.save(pagePath, data);
  return NextResponse.json({ ok: true });
}
