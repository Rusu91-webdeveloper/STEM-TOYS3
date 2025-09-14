import { NextResponse } from "next/server";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name, type } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    let result;

    if (type === "welcome") {
      result = await sendWelcomeEmail(email, name);
    } else if (type === "verification") {
      const verificationToken = "test-token-123";
      result = await sendVerificationEmail(email, name, verificationToken);
    } else {
      return NextResponse.json(
        { error: "Type must be 'welcome' or 'verification'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: result,
      message: `Email sent successfully to ${email}`,
      type: type,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
