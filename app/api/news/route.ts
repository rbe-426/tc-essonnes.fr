import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

function isAuthorized(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const isDev = host.includes("localhost") || host.includes("127.0.0.1");
  if (isDev) return true;

  const cookies = request.headers.get("cookie") || "";
  return cookies.includes("admin-edit-mode=true");
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/news`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erreur GET news (proxy):", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: "Non autorise" }, { status: 401 });
    }

    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/news`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN || "dev-secret"}`,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erreur POST news (proxy):", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
