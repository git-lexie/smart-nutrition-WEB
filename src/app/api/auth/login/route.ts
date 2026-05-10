import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

const logUserAction = async (userId: any, action: string, details = {}) => {
  try { await AuditLog.create({ userId, action, details }); } 
  catch (error) { console.error("Failed to write to audit log:", error); }
};

export async function POST(req: any) {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    await logUserAction(user._id, 'LOGIN', { email: user.email });
    
    return NextResponse.json({ token, user: { 
      id: user._id, 
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email, 
      profile: user.profile 
    }});
  } catch (err) {
    return NextResponse.json({ message: "Server Error during login" }, { status: 500 });
  }
}