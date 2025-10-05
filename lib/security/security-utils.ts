import crypto from "crypto";

export function encryptSecurityAnswer(answer: string): string {
  const algorithm = "aes-256-gcm";
  const key = crypto.scryptSync(
    process.env.SECURITY_QUESTIONS_KEY || "default-key-change-in-production",
    "salt",
    32
  );
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipherGCM(algorithm, key);
  cipher.setIV(iv);

  let encrypted = cipher.update(answer, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

export function verifySecurityAnswer(
  encryptedAnswer: string,
  providedAnswer: string
): boolean {
  try {
    const [ivHex, encrypted, tagHex] = encryptedAnswer.split(":");
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(
      process.env.SECURITY_QUESTIONS_KEY || "default-key-change-in-production",
      "salt",
      32
    );

    const decipher = crypto.createDecipherGCM(algorithm, key);
    decipher.setIV(Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted === providedAnswer;
  } catch (error) {
    return false;
  }
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  hashedPassword: string
): boolean {
  const [salt, hash] = hashedPassword.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
}
