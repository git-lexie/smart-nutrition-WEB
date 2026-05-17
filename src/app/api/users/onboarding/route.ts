import { NextResponse } from "next/server";
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifyAuth } from '@/lib/auth';

const logUserAction = async (userId: any, action: string, details = {}) => {
  try { await AuditLog.create({ userId, action, details }); } 
  catch (error) { console.error("Failed to write to audit log:", error); }
};

export async function PUT(req: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    await dbConnect();
    const body = await req.json();
    const { age, gender, height, weight, goal, activityLevel, voiceGender } = body;
    
    const updateFields: any = { "profile.isProfileComplete": true };
    if (age) updateFields["profile.age"] = age;
    if (gender) updateFields["profile.gender"] = gender;
    if (height) updateFields["profile.height"] = height;
    if (weight) updateFields["profile.weight"] = weight;
    if (goal) updateFields["profile.goal"] = goal;
    if (activityLevel) updateFields["profile.activityLevel"] = activityLevel;
    if (voiceGender) updateFields["profile.voiceGender"] = voiceGender;

    const updatedUser = await User.findByIdAndUpdate(decoded.id, { $set: updateFields }, { new: true }).lean();
    await logUserAction(decoded.id, 'PROFILE_UPDATE', { updateFields });
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    return NextResponse.json({ message: "Error updating profile" }, { status: 500 });
  }
}