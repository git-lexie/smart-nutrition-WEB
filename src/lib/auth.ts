import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// 1. Define the shape of your JWT payload
export interface CustomJwtPayload extends jwt.JwtPayload {
  id: string; 
}

/**
 * Verifies the JWT from the Authorization header.
 * Works with both NextRequest (App Router) and standard Request.
 */
export function verifyAuth(req: NextRequest | Request): CustomJwtPayload | null {
  try {
    // 2. Extract the token from the "Authorization" header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return null;
    }

    // 3. Verify the token
    const decoded = jwt.verify(token, secret);

    // 4. Type Guard: Ensure decoded is an object and contains the id
    if (typeof decoded === "string" || !decoded.id) {
      return null;
    }

    return decoded as CustomJwtPayload;
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.error("JWT Verification Error:", error);
    return null; 
  }
}