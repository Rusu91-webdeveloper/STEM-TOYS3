import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating educational books to Romanian...");

  try {
    // Find the educational books category and update its name and description to Romanian
    const educationalBooksCategory = await prisma.category.findFirst({
      where: {
        slug: "educational-books",
      },
    });

    if (educationalBooksCategory) {
      await prisma.category.update({
        where: { id: educationalBooksCategory.id },
        data: {
          name: "Cărți Educaționale",
          description: "Cărți care educă și inspiră minți tinere",
        },
      });
      console.log("Updated Educational Books category to Romanian");
    }

    // Update Born for the Future (English) product
    const bornForFutureEnglish = await prisma.product.findUnique({
      where: { slug: "born-for-the-future-english" },
    });

    if (bornForFutureEnglish) {
      await prisma.product.update({
        where: { id: bornForFutureEnglish.id },
        data: {
          name: "Născut pentru Viitor (Engleză)",
          description:
            "Această carte inovatoare explorează modul în care expunerea timpurie la concepte STEM modelează dezvoltarea cognitivă și pregătește copiii pentru succes într-o lume din ce în ce mai orientată spre tehnologie. Disponibilă în Engleză.",
        },
      });
      console.log("Updated Born for the Future (English) to Romanian");
    }

    // Update Born for the Future (Romanian) product
    const bornForFutureRomanian = await prisma.product.findUnique({
      where: { slug: "born-for-the-future-romanian" },
    });

    if (bornForFutureRomanian) {
      await prisma.product.update({
        where: { id: bornForFutureRomanian.id },
        data: {
          name: "Născut pentru Viitor (Română)",
          description:
            "Această carte inovatoare explorează modul în care expunerea timpurie la concepte STEM modelează dezvoltarea cognitivă și pregătește copiii pentru succes într-o lume din ce în ce mai orientată spre tehnologie. Disponibilă în Română.",
        },
      });
      console.log("Updated Born for the Future (Romanian) to Romanian");
    }

    // Update STEM Play for Neurodiverse Minds (English) product
    const stemPlayEnglish = await prisma.product.findUnique({
      where: { slug: "stem-play-neurodiverse-minds-english" },
    });

    if (stemPlayEnglish) {
      await prisma.product.update({
        where: { id: stemPlayEnglish.id },
        data: {
          name: "Joacă STEM pentru Minți Neurodiverse (Engleză)",
          description:
            "Acest ghid esențial explică modul în care jucăriile STEM special concepute pot ajuta copiii cu ADHD și autism să dezvolte concentrarea, să reducă anxietatea și să construiască abilități sociale. Disponibil în Engleză.",
        },
      });
      console.log(
        "Updated STEM Play for Neurodiverse Minds (English) to Romanian"
      );
    }

    // Update STEM Play for Neurodiverse Minds (Romanian) product
    const stemPlayRomanian = await prisma.product.findUnique({
      where: { slug: "stem-play-neurodiverse-minds-romanian" },
    });

    if (stemPlayRomanian) {
      await prisma.product.update({
        where: { id: stemPlayRomanian.id },
        data: {
          name: "Joacă STEM pentru Minți Neurodiverse (Română)",
          description:
            "Acest ghid esențial explică modul în care jucăriile STEM special concepute pot ajuta copiii cu ADHD și autism să dezvolte concentrarea, să reducă anxietatea și să construiască abilități sociale. Disponibil în Română.",
        },
      });
      console.log(
        "Updated STEM Play for Neurodiverse Minds (Romanian) to Romanian"
      );
    }

    // Update book attributes for all books
    const allBooks = await prisma.product.findMany({
      where: {
        OR: [
          { slug: "born-for-the-future-english" },
          { slug: "born-for-the-future-romanian" },
          { slug: "stem-play-neurodiverse-minds-english" },
          { slug: "stem-play-neurodiverse-minds-romanian" },
        ],
      },
    });

    for (const book of allBooks) {
      const currentAttributes = (book.attributes as any) || {};

      // Update the type attribute to Romanian
      if (currentAttributes && typeof currentAttributes === "object") {
        const updatedAttributes = {
          ...currentAttributes,
          type: "Carte Educațională",
        };

        // If this is a Romanian book, update the language attribute too
        if (book.slug.endsWith("-romanian")) {
          updatedAttributes.language = "Română";
        }

        await prisma.product.update({
          where: { id: book.id },
          data: {
            attributes: updatedAttributes,
            tags: book.slug.endsWith("-romanian")
              ? ["carte", "educațională", "română"]
              : ["carte", "educațională", "engleză"],
          },
        });
      }
    }

    console.log("Updated book attributes for all educational books");
    console.log(
      "All educational books have been successfully updated to Romanian!"
    );
  } catch (error) {
    console.error("Error updating books to Romanian:", error);
  } finally {
    await prisma.$disconnect();
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
