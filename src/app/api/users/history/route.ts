import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongoose';
import DietarySession from '@/models/DietarySession';
import { verifyAuth } from '@/lib/auth';
 
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
 
    await dbConnect();
 
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
 
    const history = await DietarySession.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
 
    return NextResponse.json(history);
  } catch (err) {
    console.error("GET /api/user/history error:", err);
    return NextResponse.json({ message: "Error fetching history" }, { status: 500 });
  }
}