import crypto from "crypto";

// Get encryption key from environment variables and ensure it's 32 bytes
let ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "fallback-key-for-development-only-32";

// Ensure the key is exactly 32 bytes (32 characters for ASCII/UTF-8)
if (ENCRYPTION_KEY.length < 32) {
  // If key is too short, pad it with zeros
  ENCRYPTION_KEY = ENCRYPTION_KEY.padEnd(32, "0");
} else if (ENCRYPTION_KEY.length > 32) {
  // If key is too long, truncate it
  ENCRYPTION_KEY = ENCRYPTION_KEY.substring(0, 32);
}

const ALGORITHM = "aes-256-cbc";

if (process.env.NODE_ENV === "production" && !process.env.ENCRYPTION_KEY) {
  console.error(
    "WARNING: ENCRYPTION_KEY is not set in production. Using fallback key which is insecure."
  );
}

/**
 * Encrypt sensitive data using AES-256-CBC
 */
export function encryptData(text: string): string {
  try {
    // Create an initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the data
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return the IV and encrypted data
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive data that was encrypted with AES-256-CBC
 */
export function decryptData(encryptedText: string): string {
  try {
    // Split the IV and encrypted data
    const [ivHex, encryptedData] = encryptedText.split(":");

    if (!ivHex || !encryptedData) {
      throw new Error("Invalid encrypted data format");
    }

    // Convert IV from hex to Buffer
    const iv = Buffer.from(ivHex, "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash sensitive data (one-way) for storage or comparison
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Mask a card number to only show the last 4 digits
 */
export function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Extract the card type from a card number
 */
export function getCardType(cardNumber: string): string {
  // Remove all non-numeric characters
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Check card type based on pattern
  if (/^4/.test(cleanNumber)) return "visa";
  if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
  if (/^3[47]/.test(cleanNumber)) return "amex";
  if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
  if (/^62/.test(cleanNumber)) return "unionpay";
  if (/^35(?:2[89]|[3-8][0-9])/.test(cleanNumber)) return "jcb";
  if (/^(?:5[0678]\d\d|6304|6390|67\d\d)/.test(cleanNumber)) return "maestro";
  if (/^(508[5-9]|6050|6051|601[3-4]|57\d\d)/.test(cleanNumber))
    return "dinersclub";

  return "unknown";
}

/**
 * Card format validation rules by card type
 */
const CARD_FORMAT_RULES = {
  visa: { length: [13, 16, 19], prefixes: ["4"] },
  mastercard: { length: [16], prefixes: ["51", "52", "53", "54", "55"] },
  amex: { length: [15], prefixes: ["34", "37"] },
  discover: {
    length: [16, 19],
    prefixes: ["6011", "644", "645", "646", "647", "648", "649", "65"],
  },
  unionpay: { length: [16, 17, 18, 19], prefixes: ["62"] },
  jcb: { length: [15, 16], prefixes: ["35"] },
  maestro: {
    length: [12, 13, 14, 15, 16, 17, 18, 19],
    prefixes: ["5018", "5020", "5038", "6304", "6759", "6761", "6762", "6763"],
  },
  dinersclub: { length: [14, 16, 19], prefixes: ["36", "38", "39"] },
};

/**
 * Validate a credit card number using Luhn algorithm and card-specific rules
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remove all non-numeric characters
  const cleanNumber = cardNumber.replace(/\D/g, "");

  if (cleanNumber.length < 12 || cleanNumber.length > 19) {
    return false;
  }

  // Get card type
  const cardType = getCardType(cleanNumber);

  // If card type is unknown or doesn't match expected length, fail validation
  if (cardType === "unknown") {
    return false;
  }

  // Check card-specific format rules if available
  const rules = CARD_FORMAT_RULES[cardType as keyof typeof CARD_FORMAT_RULES];
  if (rules) {
    // Check length
    if (!rules.length.includes(cleanNumber.length)) {
      return false;
    }

    // Check prefix
    const validPrefix = rules.prefixes.some(
      (prefix) => cleanNumber.substring(0, prefix.length) === prefix
    );

    if (!validPrefix) {
      return false;
    }
  }

  // Luhn algorithm
  let sum = 0;
  let double = false;

  // Start from the rightmost digit
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

/**
 * Validate card expiry date (MM/YY format)
 */
export function validateCardExpiry(month: string, year: string): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const expiryMonth = parseInt(month, 10);
  const expiryYear = parseInt(year, 10);

  // Check if month is valid
  if (expiryMonth < 1 || expiryMonth > 12) {
    return false;
  }

  // Check if the card is expired
  if (
    expiryYear < currentYear ||
    (expiryYear === currentYear && expiryMonth < currentMonth)
  ) {
    return false;
  }

  return true;
}
