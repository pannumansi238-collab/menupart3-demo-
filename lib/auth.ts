import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rasoi_staff_session";
const SESSION_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.STAFF_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("STAFF_SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createStaffToken() {
  return new SignJWT({ role: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}

export async function hasStaffSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "staff";
  } catch {
    return false;
  }
}

export const staffCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS
};
