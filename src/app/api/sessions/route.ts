import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import DietarySession from '@/models/DietarySession';
import { verifyAuth } from '@/lib/auth';
import { logUserAction } from '@/lib/logger';
import aiService from '@/services/aiService'; 

// GET HISTORY
export async function GET(req: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    await dbConnect();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const history = await DietarySession.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ message: "Error fetching history" }, { status: 500 });
  }
}

// PROCESS & SAVE NEW SESSION
export async function POST(req: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    await dbConnect();
    const { foods, goal, totalMacros, date } = await req.json();
    
    const user = await User.findById(decoded.id).lean();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const sessionHistory = await DietarySession.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(3).lean();
    
    // Using your AI service correctly!
    let analysisResult: any = {};
    if (aiService && typeof aiService.analyzeFoodList === 'function') {
      analysisResult = await aiService.analyzeFoodList(foods, user?.profile || {}, sessionHistory);
    } else {
      analysisResult = { advice: "Great job tracking.", recommendedActivity: null, recommendedFoods: [], quote: "Consistency is key." };
    }

    const newSession = await DietarySession.create({
      userId: decoded.id, goal: goal || user?.profile?.goal, foods, macros: totalMacros, date: date || new Date().toISOString(),
      advice: analysisResult.advice, recommendedActivity: analysisResult.recommendedActivity,
      recommendedFoods: analysisResult.recommendedFoods, quote: analysisResult.quote
    });
    
    // Using our new centralized logger!
    await logUserAction(decoded.id, 'SESSION_CREATED', { sessionGoal: goal, calories: totalMacros?.calories });
    return NextResponse.json(newSession);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "AI Analysis failed" }, { status: 500 });
  }
}