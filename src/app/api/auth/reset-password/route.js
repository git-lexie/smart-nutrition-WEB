import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, otpCode, newPassword } = await request.json();

    // Check for user with matching token that hasn't expired yet
    const user = await User.findOne({
      email,
      resetPasswordToken: otpCode,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired verification code." }, { status: 400 });
    }

    // Encrypt the new password securely
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear token fields so they can't be used again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, message: "Internal server error occurred." }, { status: 500 });
  }
}