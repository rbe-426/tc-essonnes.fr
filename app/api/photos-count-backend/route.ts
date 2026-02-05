import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[photos-count] GET");

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const apiUrl = `${backendUrl}/api/photos-count`;
    console.log(`[photos-count] Proxying to: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[photos-count] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error" },
      { status: 500 }
    );
  }
}
