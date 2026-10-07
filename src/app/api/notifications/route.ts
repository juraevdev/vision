import { ApiError } from "@/lib/api";
import { getNotifications } from "@/lib/data";

export async function GET() {
  try {
    return Response.json(await getNotifications(12));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return Response.json({ error: "Unauthorized" }, { status: status === 401 ? 401 : 502 });
  }
}
