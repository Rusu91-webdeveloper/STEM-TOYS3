import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";

import { SettingsConflict, SettingsMissingBackup } from "./settings-service";

const headers = { "Cache-Control": "private, no-store" };
export async function settingsRequest(
  request: NextRequest,
  handler: (actor: string) => unknown | Promise<unknown>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Acces rezervat administratorilor." },
        { status: 403, headers }
      );
    const origin = request.headers.get("origin");
    if (request.method !== "GET" && origin && origin !== request.nextUrl.origin)
      return NextResponse.json(
        { error: "Originea cererii nu este permisă." },
        { status: 403, headers }
      );
    const result = await handler(
      session.user.name || session.user.email || session.user.id
    );
    if (result instanceof NextResponse) {
      result.headers.set("Cache-Control", headers["Cache-Control"]);
      return result;
    }
    return NextResponse.json(result, { headers });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: error.issues.map(issue => issue.message).join(" ") },
        { status: 400, headers }
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Cererea nu conține date valide." },
        { status: 400, headers }
      );
    if (
      error instanceof SettingsConflict ||
      error instanceof SettingsMissingBackup
    )
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof SettingsConflict ? 409 : 404, headers }
      );
    console.error("Admin settings request failed:", error);
    return NextResponse.json(
      { error: "Setările nu au putut fi procesate. Încearcă din nou." },
      { status: 500, headers }
    );
  }
}
