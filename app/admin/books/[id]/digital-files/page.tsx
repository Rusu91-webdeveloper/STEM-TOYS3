import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DigitalFilesManager } from "./DigitalFilesManager";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function DigitalFilesPage({ params }: Props) {
  const { id } = await params;

  // Fetch book and available languages separately
  const [book, availableLanguages] = await Promise.all([
    db.book.findUnique({
      where: { id },
      include: {
        digitalFiles: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.language.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!book) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Fișiere Digitale - {book.name}
        </h1>
        <p className="text-muted-foreground">
          Gestionează fișierele EPUB și PDF pentru această carte
        </p>
      </div>

      <DigitalFilesManager
        book={book}
        availableLanguages={availableLanguages}
      />
    </div>
  );
}
