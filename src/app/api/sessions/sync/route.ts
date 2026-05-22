import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import DietarySession from "@/models/DietarySession";
import AuditLog from "@/models/AuditLog";
import { verifyAuth } from "@/lib/auth";

const logUserAction = async (userId: any, action: string, details = {}) => {
  try {
    await AuditLog.create({ userId, action, details });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};

export async function POST(req: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { sessions } = body;

    if (!sessions || !Array.isArray(sessions))
      return NextResponse.json(
        { message: "Invalid session array." },
        { status: 400 },
      );

    const syncPromises = sessions.map((offlineSession) => {
      return DietarySession.create({
        userId: decoded.id,
        goal: "Synced Offline Session",
        date: offlineSession.timestamp,
        foods: offlineSession.meal_items,
        macros: {
          calories: offlineSession.total_calories,
          protein: offlineSession.total_protein,
          carbs: offlineSession.total_carbs,
          fats: offlineSession.total_fat,
        },
        advice: "This meal was logged offline and synced automatically.",
        quote: "Data successfully restored!",
      });
    });

    await Promise.all(syncPromises);
    await logUserAction(decoded.id, "OFFLINE_SYNC", { COUNT: sessions.length });

    return NextResponse.json({
      message: `Successfully synced ${sessions.length} offline sessions.`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to sync offline data." },
      { status: 500 },
    );
  }
}
