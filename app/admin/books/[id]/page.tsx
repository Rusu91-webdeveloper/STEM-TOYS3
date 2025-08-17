import {
  BookOpen,
  Upload,
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminBookDetailsPage({ params }: Props) {
  const { id } = await params;
  const book = await db.book.findUnique({
    where: { id },
    include: {
      digitalFiles: {
        orderBy: { createdAt: "desc" },
      },
      languages: true,
      orderItems: {
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              total: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
        take: 10, // Show latest 10 sales
      },
    },
  });

  if (!book) {
    notFound();
  }

  // Get counts separately
  const digitalFilesCount = await db.digitalFile.count({
    where: { bookId: id },
  });

  const orderItemsCount = await db.orderItem.count({
    where: { bookId: id },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);

  const totalRevenue = book.orderItems.reduce(
    (sum: number, item: any) => sum + item.price,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/books">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la Cărți
          </Link>
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{book.name}</h1>
          <p className="text-muted-foreground">de {book.author}</p>
        </div>

        <Button asChild>
          <Link href={`/admin/books/${book.id}/digital-files`}>
            <Upload className="h-4 w-4 mr-2" />
            Gestionează Fișiere Digitale
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Book Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informații Carte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {book.coverImage && (
              <div className="flex justify-center">
                <img
                  src={book.coverImage}
                  alt={book.name}
                  className="w-32 h-42 object-cover rounded-lg border"
                />
              </div>
            )}

            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Nume
                </dt>
                <dd className="text-sm">{book.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Autor
                </dt>
                <dd className="text-sm">{book.author}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Preț
                </dt>
                <dd className="text-sm font-semibold text-green-600">
                  {formatPrice(book.price)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Status
                </dt>
                <dd>
                  <Badge variant={book.isActive ? "default" : "secondary"}>
                    {book.isActive ? "Activ" : "Inactiv"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Data Creării
                </dt>
                <dd className="text-sm">
                  {new Date(book.createdAt).toLocaleDateString("ro-RO")}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Limbi Disponibile</h4>
              <div className="flex gap-2">
                {book.languages.map((language: any) => (
                  <Badge key={language.id} variant="outline">
                    {language.name}
                  </Badge>
                ))}
              </div>
            </div>

            {book.description && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Descriere</h4>
                <p className="text-sm text-muted-foreground">
                  {book.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fișiere Digitale
                    </p>
                    <p className="text-2xl font-bold">{digitalFilesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Vânzări
                    </p>
                    <p className="text-2xl font-bold">{orderItemsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Venituri Totale
                    </p>
                    <p className="text-2xl font-bold">
                      {formatPrice(totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Digital Files Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fișiere Digitale</CardTitle>
              <CardDescription>
                Fișierele EPUB și PDF disponibile pentru această carte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {book.digitalFiles.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Nu există fișiere digitale încărcate
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/admin/books/${book.id}/digital-files`}>
                      <Upload className="h-4 w-4 mr-2" />
                      Încarcă Primul Fișier
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {book.digitalFiles.slice(0, 5).map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{file.fileName}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {file.format.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {file.language === "en" ? "English" : "Română"}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant={file.isActive ? "default" : "secondary"}>
                        {file.isActive ? "Activ" : "Inactiv"}
                      </Badge>
                    </div>
                  ))}

                  {book.digitalFiles.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      și încă {book.digitalFiles.length - 5} fișiere...
                    </p>
                  )}

                  <div className="pt-3">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/admin/books/${book.id}/digital-files`}>
                        Vezi Toate Fișierele
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sales */}
      {book.orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Vânzări Recente
            </CardTitle>
            <CardDescription>
              Ultimele {Math.min(book.orderItems.length, 10)} comenzi care
              conțin această carte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {book.orderItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Comanda #{item.order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.order.createdAt).toLocaleDateString(
                        "ro-RO"
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(item.price)}
                    </p>
                    <Badge
                      variant={
                        item.order.paymentStatus === "PAID"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
