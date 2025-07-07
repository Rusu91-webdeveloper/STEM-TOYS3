import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Querying Products ---");
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    console.log("No products found.");
  } else {
    console.log(products);
  }

  console.log("\n--- Querying Books with include ---");
  const books = await prisma.book.findMany({
    include: {
      languages: true,
    },
  });
  if (books.length === 0) {
    console.log("No books found.");
  } else {
    console.log(JSON.stringify(books, null, 2));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
