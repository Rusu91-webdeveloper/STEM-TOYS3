"use client";

import { BookOpen, FileText, Users, Upload, Eye, Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { BookDeleteButton } from "./components/BookDeleteButton";

interface DigitalFile {
  id: string;
  format: string;
  language: string;
  isActive: boolean;
}

interface Language {
  id: string;
  name: string;
  code: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
}

interface Book {
  id: string;
  name: string;
  author: string;
  price: number;
  coverImage: string | null;
  isActive: boolean;
  createdAt: Date;
  digitalFiles: DigitalFile[];
  languages: Language[];
  orderItems: OrderItem[];
}

interface Props {
  books: Book[];
}

export function BooksList({ books }: Props) {
  const formatPrice = (price: number) => new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);

  const getFileFormats = (digitalFiles: DigitalFile[]) => {
    const formats = [
      ...new Set(digitalFiles.map((file) => file.format.toUpperCase())),
    ];
    return formats;
  };

  const getLanguages = (digitalFiles: DigitalFile[]) => {
    const languages = [...new Set(digitalFiles.map((file) => file.language))];
    return languages.map((lang) => (lang === "en" ? "English" : "Română"));
  };

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Nu există cărți digitale
            </h3>
            <p className="text-muted-foreground mb-4">
              Nu ai încă nicio carte digitală în sistem. Creează prima ta carte
              digitală pentru a începe.
            </p>
            <Button asChild>
              <Link href="/admin/books/create">
                <Plus className="h-4 w-4 mr-2" />
                Creează Prima Carte Digitală
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Cărți Digitale ({books.length})
        </h2>
        <Button asChild>
          <Link href="/admin/books/create">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Carte Nouă
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Card
            key={book.id}
            className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.name}
                    className="w-16 h-20 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2">
                    {book.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    de {book.author}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="default"
                      className="bg-blue-600">
                      Digital
                    </Badge>
                    <Badge variant={book.isActive ? "default" : "secondary"}>
                      {book.isActive ? "Activ" : "Inactiv"}
                    </Badge>
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(book.price)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Digital Files Summary */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Fișiere Digitale
                    </span>
                    <Badge variant="outline">
                      {book.digitalFiles.length} fișiere
                    </Badge>
                  </div>

                  {book.digitalFiles.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex gap-1 flex-wrap">
                        {getFileFormats(book.digitalFiles).map((format) => (
                          <Badge
                            key={format}
                            variant="secondary"
                            className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {getLanguages(book.digitalFiles).map((language) => (
                          <Badge
                            key={language}
                            variant="outline"
                            className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nu există fișiere încărcate
                    </p>
                  )}
                </div>

                {/* Sales Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{book.orderItems.length} vânzări</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{book.languages.length} limbi</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1">
                    <Link href={`/admin/books/${book.id}/digital-files`}>
                      <Upload className="h-4 w-4 mr-2" />
                      Gestionează Fișiere
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm">
                    <Link href={`/admin/books/${book.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Delete Button */}
                <div className="pt-2">
                  <BookDeleteButton
                    bookId={book.id}
                    bookName={book.name}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Creat la{" "}
                  {new Date(book.createdAt).toLocaleDateString("ro-RO")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
