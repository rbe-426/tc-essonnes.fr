import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[photos-backend] Relayant requête pour slug: ${slug}`);

    // Utiliser BACKEND_URL ou fallback
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    console.log(`[photos-backend] Backend URL: ${backendUrl}`);

    const apiUrl = `${backendUrl}/api/photos/${slug}`;
    console.log(`[photos-backend] Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`[photos-backend] Backend error: ${response.status}`);
      return NextResponse.json(
        { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[photos-backend] Backend returned ${data.photos?.length || 0} photos`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[photos-backend] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error relaying to backend" },
      { status: 500 }
    );
  }
}
