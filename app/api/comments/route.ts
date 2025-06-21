import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db-utils";
import { z } from "zod";

// Validate the comment data
const commentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment is too long"),
});

// GET all comments
export async function GET() {
  try {
    const comments = await query`
      SELECT * FROM comments
      ORDER BY created_at DESC
    `;

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate the request body
    const result = commentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { comment } = result.data;

    // Insert the comment into the database
    await execute`
      INSERT INTO comments (comment)
      VALUES (${comment})
    `;

    return NextResponse.json(
      { message: "Comment added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
