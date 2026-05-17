import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function PUT(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate user from the token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userId = decoded.id || decoded.userId;

    // 2. Parse the body from the frontend
    const body = await req.json();

    // 3. Destructure and shape the data to match your Mongoose Schema
    const { 
      name, 
      age, 
      height, 
      weight, 
      gender, 
      activityLevel, 
      goal, 
      voiceGender 
    } = body;

    const updatePayload = {
      name: name, // Allow name update
      profile: {
        age,
        height,
        weight,
        gender,
        activityLevel,
        goal,
        voiceGender
      },
      isProfileComplete: true
    };

    // 4. Update the Database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from the response

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    
    // Catch JWT expiration or invalid signatures gracefully
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}