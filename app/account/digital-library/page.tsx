import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DigitalLibrary } from "./DigitalLibrary";

export default async function DigitalLibraryPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Get user's digital book orders
  const orders = await db.order.findMany({
    where: {
      userId: session.user.id,
      paymentStatus: "PAID",
      items: {
        some: {
          isDigital: true,
          book: {
            isNot: null,
          },
        },
      },
    },
    include: {
      items: {
        where: {
          isDigital: true,
        },
        include: {
          book: {
            include: {
              digitalFiles: {
                where: {
                  isActive: true,
                },
              },
            },
          },
          downloads: {
            include: {
              digitalFile: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            📚 Biblioteca Ta Digitală
          </h1>
          <p className="text-muted-foreground">
            Accesează și descarcă cărțile digitale pe care le-ai achiziționat
          </p>
        </div>

        <DigitalLibrary orders={orders.filter(order => 
          order.items.some(item => item.book !== null)
        ).map(order => ({
          ...order,
          items: order.items.filter(item => item.book !== null).map(item => ({
            ...item,
            book: item.book!
          }))
        }))} />
      </div>
    </div>
  );
}
