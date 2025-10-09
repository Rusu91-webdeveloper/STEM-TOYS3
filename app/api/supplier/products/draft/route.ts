import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// This is a simple draft API that could be extended to save drafts server-side
// For now, it just validates the session and returns success
// Actual draft saving is handled client-side in localStorage

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();

    // In a full implementation, you could save drafts to database here
    // For now, we acknowledge the draft
    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // In a full implementation, you could retrieve drafts from database here
    // For now, return empty
    return NextResponse.json({
      drafts: [],
      message: "Drafts are stored locally in your browser",
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
