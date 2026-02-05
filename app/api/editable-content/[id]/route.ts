import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[editable-content] GET ${id}`);

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const apiUrl = `${backendUrl}/api/editable-content/${id}`;
    console.log(`[editable-content] Proxying to: ${apiUrl}`);

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
    console.error("[editable-content] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log(`[editable-content] POST ${id}`, body);

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const apiUrl = `${backendUrl}/api/editable-content/${id}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Backend error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[editable-content] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error" },
      { status: 500 }
    );
  }
}
