import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    // 1. Connect to Database
    await dbConnect();
    
    // 2. Get Data
    const { name, email, password } = await req.json();

    // 3. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create User
    user = await User.create({ name, email, password: hashedPassword });
    
    return NextResponse.json({ message: "User created successfully!" }, { status: 201 });
    
  } catch (err: any) {
    console.error("🔴 BACKEND SIGNUP ERROR:", err); 
    
    // THIS IS THE MAGIC FIX: We are now sending the EXACT error to the frontend!
    const errorMessage = err instanceof Error ? err.message : "Unknown Server Error";
    return NextResponse.json({ message: `Crash Reason: ${errorMessage}` }, { status: 500 });
  }
}