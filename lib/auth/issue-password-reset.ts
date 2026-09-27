import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Same token record and email as POST /api/auth/forgot-password.
 * The reset handler sets the password and isActive when the link is used.
 */
export async function issuePasswordResetForEmail(email: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  await db.passwordResetToken.create({
    data: {
      token,
      email,
      expires,
    },
  });

  await sendPasswordResetEmail(email, token);
}
