import { PrismaClient, StemCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting blog cleanup and Romanian translation...");

  try {
    // Get the admin user to use as author for any new blogs
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      throw new Error("No admin user found in database");
    }

    // Get the default category for blogs
    const stemCategory =
      (await prisma.category.findFirst({
        where: { name: "Educație STEM" },
      })) || (await prisma.category.findFirst());

    if (!stemCategory) {
      throw new Error("No categories found in database");
    }

    // The 4 most important blogs to keep (or create if they don't exist)
    const importantBlogs = [
      {
        title: "Top 10 Jucării STEM pentru Dezvoltarea Timpurie a Copilăriei",
        slug: "top-10-jucarii-stem-pentru-dezvoltarea-timpurie",
        excerpt:
          "Descoperă cele mai bune jucării STEM care ajută preșcolarii să dezvolte abilități esențiale timpurii în timp ce se distrează.",
        content: `
          <h2>Cele mai bune jucării STEM pentru preșcolari</h2>
          <p>În primii ani de viață, creierul copiilor se dezvoltă cu o viteză uimitoare. Jucăriile STEM pot valorifica această perioadă critică, stimulând curiozitatea naturală și dezvoltând abilități fundamentale care vor servi copiii pe tot parcursul vieții lor.</p>
          
          <h3>1. Blocuri magnetice de construcție</h3>
          <p>Aceste jucării colorate încurajează gândirea spațială, recunoașterea formelor și creativitatea. Magnetismul adaugă un element de știință prin experimentare.</p>
          
          <h3>2. Kit-uri simple de știință</h3>
          <p>Experimente sigure și ușoare care introduc concepte științifice de bază prin joc și observație.</p>
          
          <h3>3. Puzzle-uri cu numere și forme</h3>
          <p>Dezvoltă recunoașterea numerelor și a formelor, construind baza pentru abilitățile matematice.</p>
          
          <h3>4. Jucării de sortare și stivuire</h3>
          <p>Îmbunătățesc abilitățile motorii fine și înțelegerea relațiilor spațiale.</p>
          
          <h3>5. Roboți simpli pentru preșcolari</h3>
          <p>Introduc concepte de bază de programare într-un mod tangibil și distractiv.</p>
          
          <h3>6. Jocuri cu apă și nisip</h3>
          <p>Oferă experiențe practice cu proprietățile materialelor și fizica de bază.</p>
          
          <h3>7. Truse de observare a naturii</h3>
          <p>Încurajează observația științifică și conexiunea cu lumea naturală.</p>
          
          <h3>8. Jucării muzicale</h3>
          <p>Conectează matematica (ritm, model) cu expresia creativă și dezvoltarea limbajului.</p>
          
          <h3>9. Set de unelte pentru grădinărit</h3>
          <p>Introduce concepte de biologie și oferă experiențe practice de cercetare și observare.</p>
          
          <h3>10. Cărți interactive STEM</h3>
          <p>Combină alfabetizarea cu concepte STEM prin povești captivante și elemente interactive.</p>
          
          <h2>Cum să maximizezi beneficiile jucăriilor STEM</h2>
          <p>Pentru a obține cele mai multe beneficii educaționale din jucăriile STEM, încurajați jocul ghidat la început, apoi permiteți explorarea independentă. Puneți întrebări deschise și lăsați copilul să descopere răspunsuri prin experiență directă. Cel mai important, păstrați distracția în prim-plan - învățarea în această etapă ar trebui să fie întotdeauna jucăușă!</p>
        `,
        coverImage: "/images/category_banner_science_01.png",
        authorId: adminUser.id,
        categoryId: stemCategory.id,
        stemCategory: "SCIENCE" as StemCategory,
        tags: ["jucării", "preșcolari", "dezvoltare", "știință"],
        isPublished: true,
        publishedAt: new Date(),
        readingTime: 8,
      },
      {
        title: "Cum Jucăriile de Programare Pregătesc Copiii pentru Viitor",
        slug: "cum-jucariile-de-programare-pregatesc-copiii-pentru-viitor",
        excerpt:
          "Află cum jucăriile și jocurile de programare pot ajuta la dezvoltarea gândirii computaționale și pregăti copiii pentru locurile de muncă de mâine.",
        content: `
          <h2>Gândirea computațională pentru viitorul digital</h2>
          <p>Într-o lume din ce în ce mai digitalizată, abilitățile de programare au devenit esențiale. Dar beneficiile învățării programării depășesc cu mult capacitatea de a scrie cod - dezvoltă un mod de gândire care poate fi aplicat în aproape orice domeniu.</p>
          
          <h3>Ce este gândirea computațională?</h3>
          <p>Gândirea computațională implică descompunerea problemelor complexe, recunoașterea tiparelor, abstractizarea detaliilor și proiectarea algoritmilor. Aceste abilități sunt valoroase în multe domenii, de la știință și matematică până la artă și design.</p>
          
          <h3>Jucării de programare pentru diferite vârste</h3>
          <p><strong>Pentru preșcolari (3-5 ani):</strong> Roboții simpli cum ar fi Bee-Bot și jocurile de codare fără ecran introduc secvențierea și logica de bază.</p>
          
          <p><strong>Pentru școala primară (6-10 ani):</strong> Scratch Jr, LEGO WeDo și roboții Dash și Dot fac programarea vizuală accesibilă și distractivă.</p>
          
          <p><strong>Pentru preadolescenți (11-13 ani):</strong> Kits precum Micro:bit, mBot și Sphero SPRK+ permit proiecte mai complexe și aplicații practice.</p>
          
          <p><strong>Pentru adolescenți (14+ ani):</strong> Arduino, Raspberry Pi și platforme de dezvoltare de jocuri oferă o tranziție spre programarea reală utilizată în industrie.</p>
          
          <h3>Beneficii dincolo de tehnologie</h3>
          <ul>
            <li><strong>Rezolvarea problemelor:</strong> Programarea învață copiii să abordeze problemele metodic.</li>
            <li><strong>Perseverență:</strong> Depanarea codului construiește reziliență și o mentalitate de creștere.</li>
            <li><strong>Creativitate:</strong> Crearea propriilor jocuri și animații încurajează expresia creativă.</li>
            <li><strong>Colaborare:</strong> Multe jucării de codare încurajează proiectele în echipă.</li>
          </ul>
          
          <h3>Recomandări pentru părinți</h3>
          <p>Începeți devreme cu concepte simple, progresați la ritmul copilului dvs., și amintiți-vă că scopul este să faceți învățarea distractivă. Nu e nevoie să fiți expert în programare - învățați împreună cu copilul dvs., modelând astfel și învățarea pe tot parcursul vieții.</p>
        `,
        coverImage: "/images/category_banner_technology_01.png",
        authorId: adminUser.id,
        categoryId: stemCategory.id,
        stemCategory: "TECHNOLOGY" as StemCategory,
        tags: ["programare", "tehnologie", "abilități pentru viitor"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        readingTime: 10,
      },
      {
        title: "Jocuri Matematice Care Fac Învățarea Distractivă",
        slug: "jocuri-matematice-care-fac-invatarea-distractiva",
        excerpt:
          "Transformă anxietatea matematică în entuziasm matematic cu aceste jocuri și activități captivante pentru copii.",
        content: `
          <h2>Matematica poate și ar trebui să fie distractivă!</h2>
          <p>Mulți copii dezvoltă anxietate matematică devreme în viața lor școlară. Totuși, când matematica este prezentată prin joc, barierele dispar și copiii devin dornici să se implice cu concepte care altfel ar putea părea intimidante.</p>
          
          <h3>Jocuri de matematică pentru învățarea timpurie (3-6 ani)</h3>
          <ul>
            <li><strong>Vânătoarea de forme:</strong> Găsește forme specifice în mediul înconjurător pentru a construi recunoașterea spațială.</li>
            <li><strong>Jocuri de numărare:</strong> Utilizarea jocurilor de cărți, zaruri sau jocuri de masă pentru a dezvolta concepte numerice.</li>
            <li><strong>Cântece matematice:</strong> Melodii care încorporează număratul, adunarea și scăderea.</li>
            <li><strong>Jocuri de sortare:</strong> Clasificarea obiectelor după caracteristici dezvoltă abilități pre-algebrice.</li>
          </ul>
          
          <h3>Activități pentru școala primară (7-10 ani)</h3>
          <ul>
            <li><strong>Monopoly și jocuri de strategie:</strong> Dezvoltă abilitățile de gestionare a banilor și probabilitate.</li>
            <li><strong>Puzzle-uri logice:</strong> Dezvoltă gândirea matematică și raționamentul deductiv.</li>
            <li><strong>Origami:</strong> Conectează geometria cu artele manuale într-un mod practic.</li>
            <li><strong>Gătit împreună:</strong> Măsurarea ingredientelor dezvoltă înțelegerea fracțiilor și măsurătorilor.</li>
          </ul>
          
          <h3>Provocări pentru preadolescenți și adolescenți (11+ ani)</h3>
          <ul>
            <li><strong>Jocuri de strategie complexe:</strong> Șah, backgammon și jocuri moderne de masă care implică gândire matematică avansată.</li>
            <li><strong>Design și construcție:</strong> Proiecte care necesită măsurători precise și calcule.</li>
            <li><strong>Programarea jocurilor:</strong> Crearea propriilor jocuri digitale care aplică concepte matematice.</li>
            <li><strong>Escape rooms matematice:</strong> Provocări care necesită rezolvarea de probleme matematice pentru a progresa.</li>
          </ul>
          
          <h3>Aplicații și resurse digitale</h3>
          <p>Există numeroase aplicații excelente care transformă învățarea matematicii într-o aventură captivantă. Căutați aplicații care adaptează dificultatea la nivelul copilului și încorporează elemente de joc pentru a menține motivația.</p>
          
          <h3>Sfaturi pentru părinți și educatori</h3>
          <p>Cel mai important este să mențineți o atitudine pozitivă față de matematică. Evitați să spuneți "Nu am fost niciodată bun la matematică" - acest tip de mentalitate se poate transmite copiilor. În schimb, tratați provocările matematice ca oportunități de învățare și sărbătoriți progresul, nu doar răspunsurile corecte.</p>
        `,
        coverImage: "/images/category_banner_math_01.png",
        authorId: adminUser.id,
        categoryId: stemCategory.id,
        stemCategory: "MATHEMATICS" as StemCategory,
        tags: ["matematică", "jocuri", "învățare"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        readingTime: 7,
      },
      {
        title: "Construirea Podurilor: Proiecte de Inginerie pentru Copii",
        slug: "construirea-podurilor-proiecte-de-inginerie-pentru-copii",
        excerpt:
          "Proiecte simple de inginerie care predau concepte fundamentale în timp ce implică creativitatea copiilor.",
        content: `
          <h2>Micii ingineri de poduri</h2>
          <p>Construirea podurilor este una dintre cele mai accesibile și educative activități de inginerie pentru copii. Aceste proiecte combină principii de fizică, matematică și design într-un mod practic și captivant.</p>
          
          <h3>De ce să construiești poduri cu copiii?</h3>
          <p>Proiectele de poduri dezvoltă:</p>
          <ul>
            <li>Înțelegerea forțelor de bază (compresie, tensiune, gravitație)</li>
            <li>Abilități de rezolvare a problemelor</li>
            <li>Gândire critică și evaluare a design-ului</li>
            <li>Persistență și învățare din eșec</li>
            <li>Creativitate în limitele constrângerilor fizice</li>
            <li>Colaborare (pentru proiecte de grup)</li>
          </ul>
          
          <h3>Proiect pentru preșcolari: Pod din paie de băut</h3>
          <p><strong>Materiale necesare:</strong> Paie de băut din plastic, bandă adezivă, foarfeci, câteva monede sau mașinuțe mici pentru testare.</p>
          <p><strong>Instrucțiuni:</strong> Ajutați copiii să construiască o structură simplă de pod folosind paie și bandă. Apoi testați cât de multă greutate poate susține adăugând monede.</p>
          <p><strong>Conceptul de învățare:</strong> Introducerea formelor de bază care oferă stabilitate (triunghiurile sunt mai puternice decât pătratele).</p>
          
          <h3>Proiect pentru școala primară: Podul din hârtie</h3>
          <p><strong>Materiale necesare:</strong> Coli de hârtie A4, benzi adezive, cărți pentru suporturi, greutăți mici.</p>
          <p><strong>Instrucțiuni:</strong> Provocați copiii să creeze un pod doar din hârtie care să traverseze un spațiu de 20 cm și să susțină cât mai multă greutate. Ei pot împături și rula hârtia, dar nu pot folosi alte materiale în afară de bandă pentru îmbinări.</p>
          <p><strong>Conceptul de învățare:</strong> Cum forma materialelor (de exemplu, hârtia plată vs. rulată în cilindru) afectează dramatic rezistența.</p>
          
          <h3>Proiect pentru preadolescenți: Pod suspendat</h3>
          <p><strong>Materiale necesare:</strong> Sfoară sau șnur, bețișoare de lemn (de înghețată), carton, foarfeci, lipici, greutăți pentru testare.</p>
          <p><strong>Instrucțiuni:</strong> Construiți un pod suspendat utilizând principiile inginerești reale de suspensie.</p>
          <p><strong>Conceptul de învățare:</strong> Distribuția forțelor în cabluri și suporturi, echilibrul tensiunii.</p>
          
          <h3>Provocare pentru adolescenți: Poduri din paste</h3>
          <p><strong>Materiale necesare:</strong> Paste uscate (spaghete sunt ideale), lipici, cântar pentru măsurarea greutății.</p>
          <p><strong>Instrucțiuni:</strong> Proiectați și construiți un pod utilizând doar paste și lipici, apoi organizați o competiție pentru a vedea al cui pod poate susține cea mai mare greutate înainte de a se rupe.</p>
          <p><strong>Conceptul de învățare:</strong> Distribuirea tensiunii, importanța fermelor în designul podurilor, compromisul între greutatea materialelor și forța structurii.</p>
          
          <h3>Extensii educaționale</h3>
          <p>După construirea podurilor, explorați podurile faimoase din lume, perspectivele istorice asupra designului de poduri, sau cariere în ingineria civilă și structurală. Aceste conexiuni interdisciplinare consolidează învățarea și plasează activitățile practice într-un context mai larg.</p>
        `,
        coverImage: "/images/category_banner_engineering_01.png",
        authorId: adminUser.id,
        categoryId: stemCategory.id,
        stemCategory: "ENGINEERING" as StemCategory,
        tags: ["inginerie", "proiecte", "activități practice"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        readingTime: 9,
      },
    ];

    // First delete all existing blog posts
    console.log("Deleting existing blog posts...");
    await prisma.blog.deleteMany({});
    console.log("All existing blog posts have been deleted.");

    // Then create the 4 important blogs
    console.log("Creating the 4 most important blog posts in Romanian...");

    for (const blogData of importantBlogs) {
      const blog = await prisma.blog.create({
        data: blogData,
      });
      console.log(`Created blog post: ${blog.title}`);
    }

    console.log("Successfully created 4 important blog posts in Romanian!");
  } catch (error) {
    console.error("Error updating blog posts:", error);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
