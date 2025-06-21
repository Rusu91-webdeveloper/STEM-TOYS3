import React from "react";
import { Metadata } from "next";
import { BookForm } from "../components/BookForm";

export const metadata: Metadata = {
  title: "Create Book | Admin Dashboard",
  description: "Create a new digital book.",
};

export default function CreateBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create New Digital Book
        </h1>
        <p className="text-muted-foreground">
          Add a new digital book to your collection. You can upload digital
          files later.
        </p>
      </div>

      <BookForm isEditing={false} />
    </div>
  );
}
