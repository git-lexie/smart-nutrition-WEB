import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// 1. Tell TypeScript exactly what data is inside your JWT
export interface CustomJwtPayload extends jwt.JwtPayload {
  id: string; // We explicitly tell TS that 'id' will always be here!
}

export function verifyAuth(req: NextRequest | Request): CustomJwtPayload | null {
  try {
    // Extract the token from the "Authorization" header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null; // No token found or bad format
    }

    const token = authHeader.split(" ")[1];

    // Verify the token and tell TypeScript to treat it as our CustomJwtPayload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as CustomJwtPayload;

    return decoded;
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return null; // Token is invalid or expired
  }
}