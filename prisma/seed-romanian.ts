import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database update to Romanian language...");

  // Romanian category translations
  const categoryTranslations = {
    Science: {
      name: "Ştiinţă",
      description:
        "Jucării educaționale care predau principii științifice și încurajează explorarea",
    },
    Technology: {
      name: "Tehnologie",
      description:
        "Jucării care introduc copiii în programare, robotică și alfabetizare digitală",
    },
    Engineering: {
      name: "Inginerie",
      description:
        "Kituri de construcție și jucării care dezvoltă abilitățile de rezolvare a problemelor",
    },
    Mathematics: {
      name: "Matematică",
      description:
        "Jocuri și puzzle-uri care fac învățarea conceptelor matematice distractivă și captivantă",
    },
    "Educational Books": {
      name: "Cărți Educaționale",
      description: "Cărți care educă și inspiră minți tinere",
    },
    "STEM Education": {
      name: "Educație STEM",
      description: "Articole despre educația STEM și învățare",
    },
  };

  // Romanian product translations
  const productTranslations = {
    "Chemistry Lab Kit": {
      name: "Kit Laborator de Chimie",
      description:
        "Un set complet de chimie pentru tinerii oameni de știință pentru a efectua experimente sigure și captivante acasă. Include peste 30 de experimente cu instrucțiuni detaliate.",
    },
    "Coding Robot for Beginners": {
      name: "Robot de Programare pentru Începători",
      description:
        "Un robot interactiv care predă fundamentele programării prin joacă. Perfect pentru începători fără experiență anterioară în programare. Controlează mișcările, luminile și sunetele.",
    },
    "Bridge Builder Engineering Kit": {
      name: "Kit de Inginerie pentru Construcția Podurilor",
      description:
        "Construiește și testează diferite design-uri de poduri cu acest kit cuprinzător de inginerie. Învață despre principii structurale, distribuția încărcăturii și proiectarea inginerească.",
    },
    "Mathematical Puzzle Cube Set": {
      name: "Set de Cuburi Puzzle Matematice",
      description:
        "O colecție de 5 cuburi puzzle matematice cu niveluri de dificultate variabile. Dezvoltă raționamentul spațial, abilitățile de rezolvare a problemelor și gândirea matematică.",
    },
    "Solar System Planetarium": {
      name: "Planetariu al Sistemului Solar",
      description:
        "Un model interactiv al sistemului nostru solar care îi învață pe copii despre planete, orbite și astronomie. Include lumini și mișcare pentru o experiență captivantă.",
    },
    "Renewable Energy Science Kit": {
      name: "Kit Științific de Energie Regenerabilă",
      description:
        "Învață despre energia solară, eoliană și hidroelectrică prin experimente practice. Construiește propriile tale dispozitive de energie regenerabilă și observă știința în acțiune.",
    },
    "Born for the Future (English)": {
      name: "Născut pentru Viitor (Engleză)",
      description:
        "Această carte inovatoare explorează modul în care expunerea timpurie la concepte STEM modelează dezvoltarea cognitivă și pregătește copiii pentru succes într-o lume din ce în ce mai orientată spre tehnologie. Disponibilă în Engleză.",
    },
    "Born for the Future (Romanian)": {
      name: "Născut pentru Viitor (Română)",
      description:
        "Această carte inovatoare explorează modul în care expunerea timpurie la concepte STEM modelează dezvoltarea cognitivă și pregătește copiii pentru succes într-o lume din ce în ce mai orientată spre tehnologie. Disponibilă în Română.",
    },
    "STEM Play for Neurodiverse Minds (English)": {
      name: "Joacă STEM pentru Minți Neurodiverse (Engleză)",
      description:
        "Acest ghid esențial explică modul în care jucăriile STEM special concepute pot ajuta copiii cu ADHD și autism să dezvolte concentrarea, să reducă anxietatea și să construiască abilități sociale. Disponibil în Engleză.",
    },
    "STEM Play for Neurodiverse Minds (Romanian)": {
      name: "Joacă STEM pentru Minți Neurodiverse (Română)",
      description:
        "Acest ghid esențial explică modul în care jucăriile STEM special concepute pot ajuta copiii cu ADHD și autism să dezvolte concentrarea, să reducă anxietatea și să construiască abilități sociale. Disponibil în Română.",
    },
  };

  // Romanian blog post translations
  const blogTranslations = {
    "Top 10 STEM Toys for Early Childhood Development": {
      title: "Top 10 Jucării STEM pentru Dezvoltarea Timpurie a Copilăriei",
      excerpt:
        "Descoperă cele mai bune jucării STEM care ajută preșcolarii să dezvolte abilități esențiale timpurii în timp ce se distrează.",
      content:
        "Acesta este un conținut detaliat al articolului de blog despre jucării STEM pentru dezvoltarea timpurie a copilăriei. Aici am discutat despre diverse jucării, beneficiile lor și cum contribuie la diferite aspecte ale dezvoltării, inclusiv abilități cognitive, motorii și sociale.",
    },
    "How Coding Toys Prepare Children for the Future": {
      title: "Cum Jucăriile de Programare Pregătesc Copiii pentru Viitor",
      excerpt:
        "Află cum jucăriile și jocurile de programare pot ajuta la dezvoltarea gândirii computaționale și pregăti copiii pentru locurile de muncă de mâine.",
      content:
        "Acest articol de blog explorează modul în care jucăriile și jocurile de programare nu doar îi învață pe copii concepte de programare, dar îi ajută și să dezvolte gândirea logică, abilitățile de rezolvare a problemelor și alte abilități care vor fi valoroase pe piața muncii viitoare.",
    },
    "Math Games That Make Learning Fun": {
      title: "Jocuri Matematice Care Fac Învățarea Distractivă",
      excerpt:
        "Transformă anxietatea matematică în entuziasm matematic cu aceste jocuri și activități captivante.",
      content:
        "Matematica nu trebuie să fie intimidantă. Acest articol prezintă diverse jocuri și activități interactive care fac învățarea conceptelor matematice plăcută pentru copii de diferite grupe de vârstă.",
    },
    "Building Bridges: Engineering Projects for Kids": {
      title: "Construirea Podurilor: Proiecte de Inginerie pentru Copii",
      excerpt:
        "Proiecte simple de inginerie care predau concepte fundamentale în timp ce implică creativitatea copiilor.",
      content:
        "Ingineria nu este doar pentru adulți. Acest post prezintă mai multe proiecte de inginerie adecvate vârstei pe care copiii le pot face acasă sau la școală, explicând principiile științifice din spatele fiecărei activități.",
    },
    "The Future of STEM Education": {
      title: "Viitorul Educației STEM",
      excerpt:
        "Explorarea tendințelor și tehnologiilor emergente care vor modela modul în care copiii învață materii STEM în anii următori.",
      content:
        "Acest articol examinează modul în care realitatea virtuală, inteligența artificială și alte tehnologii emergente schimbă peisajul educației, în special în științe, tehnologie, inginerie și matematică.",
    },
  };

  // Update Categories
  console.log("Updating categories to Romanian...");
  const categories = await prisma.category.findMany();

  for (const category of categories) {
    const translation =
      categoryTranslations[category.name as keyof typeof categoryTranslations];
    if (translation) {
      await prisma.category.update({
        where: { id: category.id },
        data: {
          name: translation.name,
          description: translation.description,
        },
      });
      console.log(`Updated category: ${category.name} -> ${translation.name}`);
    }
  }

  // Update Products
  console.log("Updating products to Romanian...");
  const products = await prisma.product.findMany();

  for (const product of products) {
    const translation =
      productTranslations[product.name as keyof typeof productTranslations];
    if (translation) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          name: translation.name,
          description: translation.description,
        },
      });
      console.log(`Updated product: ${product.name} -> ${translation.name}`);
    }
  }

  // Update Blog Posts
  console.log("Updating blog posts to Romanian...");
  const blogs = await prisma.blog.findMany();

  for (const blog of blogs) {
    const translation =
      blogTranslations[blog.title as keyof typeof blogTranslations];
    if (translation) {
      await prisma.blog.update({
        where: { id: blog.id },
        data: {
          title: translation.title,
          excerpt: translation.excerpt,
          content: translation.content,
        },
      });
      console.log(`Updated blog post: ${blog.title} -> ${translation.title}`);
    }
  }

  console.log("Database content updated to Romanian successfully!");
}

main()
  .catch((e) => {
    console.error("Error updating database to Romanian:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
