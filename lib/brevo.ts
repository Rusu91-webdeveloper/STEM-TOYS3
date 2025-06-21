/**
 * Brevo (formerly Sendinblue) email service integration
 * Supports both API and SMTP methods
 */

import axios from "axios";
import nodemailer from "nodemailer";
import { isDevelopment } from "./security";

// Brevo API configuration
const BREVO_API_BASE_URL = "https://api.brevo.com/v3";

// Create axios instance for Brevo API
const brevoAxios = axios.create({
  baseURL: BREVO_API_BASE_URL,
  headers: {
    accept: "application/json",
    "content-type": "application/json",
  },
});

// Add API key interceptor
brevoAxios.interceptors.request.use((config) => {
  if (process.env.BREVO_API_KEY) {
    config.headers["api-key"] = process.env.BREVO_API_KEY;
  }
  return config;
});

// SMTP transport (alternative for Nodemailer compatibility)
export const brevoTransporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// For development environment, provide console-based email simulation
const devTransporter = {
  sendMail: async (options: any) => {
    // Development mode: Email not sent, but would be sent with these details
    return { messageId: `dev-${Date.now()}@localhost` };
  },
};

// Use dev transporter in development mode if credentials are missing
const activeTransporter =
  isDevelopment() && !process.env.BREVO_API_KEY && !process.env.BREVO_SMTP_KEY
    ? devTransporter
    : brevoTransporter;

// Send an email using Brevo API with axios
export async function sendEmailWithBrevoApi({
  to,
  subject,
  htmlContent,
  textContent,
  from = {
    email: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    name: process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
  },
  params = {}, // Template params for personalization
  templateId, // Optional template ID if using Brevo templates
  attachments = [],
}: {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: { email: string; name: string };
  params?: Record<string, any>;
  templateId?: number;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    encoding?: string;
    contentType?: string;
  }>;
}) {
  try {
    // In development mode with missing credentials, use the dev transporter
    if (isDevelopment() && !process.env.BREVO_API_KEY) {
      // Development mode: Email not sent, but would be sent with these details
      return { success: true, messageId: `dev-${Date.now()}@localhost` };
    }

    // Prepare email payload
    const emailPayload: any = {
      to,
      subject,
      htmlContent,
      sender: from,
    };

    // Add optional fields
    if (textContent) {
      emailPayload.textContent = textContent;
    }

    if (params && Object.keys(params).length > 0) {
      emailPayload.params = params;
    }

    if (templateId) {
      emailPayload.templateId = templateId;
    }

    if (attachments && attachments.length > 0) {
      emailPayload.attachment = attachments.map((a) => ({
        content: a.content,
        name: a.filename,
      }));
    }

    // Send email using the Brevo API with axios
    const response = await brevoAxios.post("/smtp/email", emailPayload);
    const messageId = response.data?.messageId || null;

    // Email sent successfully via Brevo API
    return { success: true, messageId };
  } catch (error) {
    console.error("❌ Error sending email with Brevo API:", error);

    // In development mode, simulate success
    if (isDevelopment()) {
      // Development mode: Email simulation despite error
      return { success: true, messageId: `dev-error-${Date.now()}@localhost` };
    }

    throw error;
  }
}

// Send an email using SMTP via Nodemailer (compatibility option)
export async function sendEmailWithBrevoSmtp({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || "noreply@yourdomain.com",
  attachments = [],
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
}) {
  try {
    // In development mode with missing credentials, use the dev transporter
    if (isDevelopment() && !process.env.BREVO_SMTP_KEY) {
      // Development mode: Email not sent, but would be sent with these details
      return { success: true, messageId: `dev-${Date.now()}@localhost` };
    }

    // Send mail with defined transport object
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments,
    });

    // Email sent successfully via Brevo SMTP
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email with Brevo SMTP:", error);

    // In development mode, simulate success
    if (isDevelopment()) {
      // Development mode: Email simulation despite error
      return { success: true, messageId: `dev-error-${Date.now()}@localhost` };
    }

    throw error;
  }
}

// Simpler interface that can be switched between API and SMTP approaches
export async function sendMail({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || "noreply@yourdomain.com",
  fromName = process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
  params = {},
  templateId,
  attachments = [],
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  params?: Record<string, any>;
  templateId?: number;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
}) {
  // Prefer API method if API key is available
  if (process.env.BREVO_API_KEY) {
    // Convert to format expected by the API
    const toArray = Array.isArray(to)
      ? to.map((email) => ({ email }))
      : [{ email: to }];

    return sendEmailWithBrevoApi({
      to: toArray,
      subject,
      htmlContent: html,
      textContent: text,
      from: { email: from, name: fromName },
      params,
      templateId,
      attachments,
    });
  }

  // Fall back to SMTP method
  return sendEmailWithBrevoSmtp({
    to,
    subject,
    html,
    text,
    from: `${fromName} <${from}>`,
    attachments,
  });
}
