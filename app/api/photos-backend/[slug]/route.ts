import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[photos-backend] Relayant requête pour slug: ${slug}`);

    // Utiliser BACKEND_URL ou construire depuis l'env
    const backendUrl = process.env.BACKEND_URL || 
                       process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}:8080` :
                       "http://localhost:3001";
    
    const debugInfo = {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL,
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
      RAILWAY_PRIVATE_URL: process.env.RAILWAY_PRIVATE_URL,
      computed_backendUrl: backendUrl,
    };
    console.log(`[photos-backend] Debug:`, debugInfo);

    const apiUrl = `${backendUrl}/api/photos/${slug}`;
    console.log(`[photos-backend] Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`[photos-backend] Backend error: ${response.status}`);
      return NextResponse.json(
        { success: false, message: "Backend error", debug: debugInfo },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[photos-backend] Backend returned ${data.photos?.length || 0} photos`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[photos-backend] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error relaying to backend", error: String(error) },
      { status: 500 }
    );
  }
}
