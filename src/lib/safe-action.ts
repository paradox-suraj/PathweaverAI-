import { headers } from "next/headers";

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

/**
 * Validates that the Server Action was invoked from a trusted origin.
 * This is an elite-level defense against CSRF attacks.
 */
export async function verifyOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");

  if (!origin || !host) {
    // Some legitimate requests might lack an origin (e.g. from a mobile app without CORS),
    // but for an elite-secured web application, we mandate it for Server Actions.
    console.warn(`[SECURITY] Missing Origin or Host header. Host: ${host}, Origin: ${origin}`);
    throw new SecurityError("Invalid request origin");
  }

  const originUrl = new URL(origin);
  
  // Strip ports for comparison if needed, or compare exactly
  if (originUrl.host !== host) {
    console.error(`[SECURITY] CSRF ATTEMPT BLOCKED. Origin: ${originUrl.host} !== Host: ${host}`);
    throw new SecurityError("CSRF attempt blocked");
  }
}
