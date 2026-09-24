import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit OTP.
 */
export function generateOTP(): string {
  // Generates a random number between 0 and 999999
  const num = crypto.randomInt(0, 1000000);
  // Pads with leading zeros if necessary
  return num.toString().padStart(6, "0");
}
