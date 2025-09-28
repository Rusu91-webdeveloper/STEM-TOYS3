import { notFound } from "next/navigation";

import { BookForm } from "../../components/BookForm";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;

  const book = await db.book.findUnique({
    where: { id },
  });

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editează Carte</h1>
        <p className="text-muted-foreground">
          Modifică informațiile pentru cartea digitală.
        </p>
      </div>

      <BookForm
        initialData={{
          id: book.id,
          name: book.name,
          author: book.author,
          description: book.description,
          price: book.price,
          coverImage: book.coverImage,
          isActive: book.isActive,
          slug: book.slug,
        }}
        isEditing={true}
      />
    </div>
  );
}
