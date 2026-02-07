export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/photos/weekly`, { cache: "no-store" });
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching weekly photo:", error);
    return Response.json({ success: false, photo: null }, { status: 500 });
  }
}
