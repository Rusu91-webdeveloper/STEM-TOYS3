import { db } from "@/lib/db";
import { BooksList } from "./BooksList";

export default async function AdminBooksPage() {
  // Get all digital books only
  const books = await db.book.findMany({
    include: {
      digitalFiles: {
        where: {
          isActive: true,
        },
      },
      languages: true,
      orderItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cărți Digitale</h1>
        <p className="text-muted-foreground">
          Gestionează cărțile digitale și fișierele lor descărcabile (PDF, EPUB,
          etc.)
        </p>
      </div>

      <BooksList books={books} />
    </div>
  );
}
