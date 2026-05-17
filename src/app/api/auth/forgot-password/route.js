import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User account not found." }, { status: 404 });
    }

    // Generate a 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set token details with a 10-minute expiration window
    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = Date.now() + 600000; 
    await user.save();

    // Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

    const mailOptions = {
      from: `"NutriAI Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "NutriAI - Your Password Reset Verification Code",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 400px; border: 1px solid #eee; border-radius: 12px; background-color: #0f172a; color: #ffffff;">
          <h2 style="color: #10b981; margin-bottom: 4px;">NutriAI Reset Request</h2>
          <p style="color: #94a3b8; font-size: 14px;">Use the verification code below to change your password. This code will expire in 10 minutes.</p>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #10b981; margin: 20px 0; border: 1px solid #334155;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 11px;">If you didn't request this change, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: "Verification code sent to email." }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, message: "Internal server error occurred." }, { status: 500 });
  }
}