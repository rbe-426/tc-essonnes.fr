import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[photos-backend] Relayant requête pour slug: ${slug}`);

    // Construire l'URL du backend
    let backendUrl = process.env.BACKEND_URL;
    
    if (!backendUrl) {
      // En production sur Railway: utiliser RAILWAY_PRIVATE_URL pour communication inter-services
      if (process.env.NODE_ENV === "production" && process.env.RAILWAY_PRIVATE_URL) {
        backendUrl = `${process.env.RAILWAY_PRIVATE_URL}`;
      } else {
        backendUrl = "http://localhost:3001";
      }
    }
    
    const debugInfo = {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL,
      RAILWAY_PRIVATE_URL: process.env.RAILWAY_PRIVATE_URL,
      computed_backendUrl: backendUrl,
      timestamp: new Date().toISOString(),
    };
    console.log(`[photos-backend] Debug:`, JSON.stringify(debugInfo, null, 2));

    const apiUrl = `${backendUrl}/api/photos/${slug}`;
    console.log(`[photos-backend] Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(could not read)");
      console.error(`[photos-backend] Backend error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json(
        { success: false, message: "Backend error", debug: debugInfo, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[photos-backend] Backend returned ${data.photos?.length || 0} photos`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[photos-backend] Exception:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: "Error relaying to backend", error: errorMsg },
      { status: 500 }
    );
  }
}
