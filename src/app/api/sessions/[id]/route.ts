import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import DietarySession from '@/models/DietarySession';
import AuditLog from '@/models/AuditLog';
import { verifyAuth } from '@/lib/auth';
import { analyzeFoodList } from '@/services/aiService';

const logUserAction = async (userId: any, action: string, details = {}) => {
  try { await AuditLog.create({ userId, action, details }); } 
  catch (error) { console.error("Failed to write to audit log:", error); }
};

// UPDATE / EDIT SESSION
export async function PUT(req: any, context: { params: { id: string } }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    await dbConnect();
    const { id: sessionId } = await context.params; // Fixed Next.js param access
    const { foods, goal, totalMacros, date } = await req.json(); // Fixed missing ()

    const session = await DietarySession.findOne({ _id: sessionId, userId: decoded.id });
    if (!session) return NextResponse.json({ message: "Session not found" }, { status: 404 });

    const user = await User.findById(decoded.id).lean();
    const sessionHistory = await DietarySession.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(3).lean();
    
    let analysisResult: any = {};
    if (typeof analyzeFoodList === 'function') {
      analysisResult = await analyzeFoodList(foods, user?.profile || {}, sessionHistory);
    } else {
      analysisResult = { advice: "Meal updated successfully.", recommendedActivity: null, recommendedFoods: [], quote: "Adjustments lead to progress." };
    }

    const updatedSession = await DietarySession.findByIdAndUpdate(
      sessionId,
      { foods, macros: totalMacros, date: date || session.date, advice: analysisResult.advice, recommendedActivity: analysisResult.recommendedActivity, recommendedFoods: analysisResult.recommendedFoods, quote: analysisResult.quote },
      { new: true }
    );

    await logUserAction(decoded.id, 'SESSION_EDITED', { sessionId, UserId: decoded.id });
    return NextResponse.json(updatedSession);
  } catch (error) {
    return NextResponse.json({ message: "Server Error during update" }, { status: 500 });
  }
}

// DELETE SESSION
export async function DELETE(req: any, context: { params: { id: string } }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    await dbConnect();
    const { id: sessionId } = await context.params; 
    const session = await DietarySession.findOne({ _id: sessionId, userId: decoded.id });
    if (!session) return NextResponse.json({ message: "Session not found or unauthorized" });

    await DietarySession.deleteOne({ _id: sessionId, userId: decoded.id });
    await logUserAction(decoded.id, 'SESSION_DELETED', { sessionId });
    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Server Error during deletion" }, { status: 500 });
  }
}