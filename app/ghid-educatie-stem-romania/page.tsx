/**
 * Comprehensive STEM Education Guide for Romania
 * Targets: "educație STEM România", "ghid părinți STEM", "curriculum STEM românesc"
 */

import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { generateSTEMEducationFAQSchema, generateSTEMLearningPathSchema } from "@/lib/seo/advanced-schema";
import { AdvancedSEOHead } from "@/components/seo/AdvancedSEOHead";

export const metadata: Metadata = createMetadata({
  title: "Ghid Complet Educație STEM pentru Copii în România 2025 | TechTots",
  description: "Ghidul definitiv pentru educația STEM în România: curriculum național, jucării certificate, metode de învățare și resurse pentru părinți și educatori.",
  keywords: [
    "educație STEM România",
    "curriculum STEM românesc", 
    "jucării educaționale STEM",
    "ghid părinți STEM",
    "dezvoltare abilități STEM copii",
    "Ministerul Educației STEM",
    "competențe cheie România",
    "învățământ tehnologic România",
    "robotică educațională România",
    "experimente științifice copii",
    "matematică distractivă copii",
    "inginerie pentru copii România"
  ],
  ogImage: "/images/ghid-stem-romania-2025.jpg",
  pathWithoutLocale: "/ghid-educatie-stem-romania",
  structuredData: [
    generateSTEMEducationFAQSchema(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Ghid Complet Educație STEM România 2025",
      description: "Resursa definitivă pentru educația STEM în România",
      inLanguage: "ro",
      about: {
        "@type": "Thing",
        name: "Educație STEM România",
        description: "Sistemul educațional STEM aliniat cu curriculumul național românesc"
      }
    }
  ]
});

export default function STEMEducationGuidePage() {
  return (
    <>
      <AdvancedSEOHead 
        pageType="blog"
        customSchema={[generateSTEMEducationFAQSchema()]}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">
              Ghidul Complet pentru Educația STEM în România 2025
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Tot ce trebuie să știți despre educația STEM: curriculum românesc, jucării certificate, 
              metode de învățare și resurse pentru părinți și educatori.
            </p>
            <div className="flex justify-center space-x-4">
              <span className="bg-white/20 px-4 py-2 rounded-full">📚 Curriculum Românesc</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">🎯 Competențe Cheie</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">🏆 Certificat MECTS</span>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Cuprins</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">🎓 Fundamentele STEM</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Ce înseamnă educația STEM</li>
                    <li>• Importanța STEM în curriculumul românesc</li>
                    <li>• Competențele cheie dezvoltate</li>
                    <li>• Alinierea cu standardele MECTS</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">🧸 Alegerea Jucăriilor</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Criterii de selecție după vârstă</li>
                    <li>• Certificări și siguranță</li>
                    <li>• Jucării pentru fiecare disciplină STEM</li>
                    <li>• Buget și raport calitate-preț</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">👨‍👩‍👧‍👦 Ghid pentru Părinți</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Cum să încurajați învățarea STEM acasă</li>
                    <li>• Activități practice și experimente</li>
                    <li>• Integrarea cu temele școlare</li>
                    <li>• Urmărirea progresului copilului</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">🏫 Resurse pentru Educatori</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Planuri de lecție STEM</li>
                    <li>• Integrarea în orele de curs</li>
                    <li>• Evaluarea competențelor STEM</li>
                    <li>• Proiecte de grup și colaborare</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg">
              
              {/* Section 1: What is STEM Education */}
              <div className="mb-16">
                <h2 className="text-4xl font-bold mb-8 text-blue-800">
                  Ce este Educația STEM și de ce este Crucială pentru Copiii din România?
                </h2>
                
                <div className="bg-blue-50 p-8 rounded-lg mb-8">
                  <p className="text-lg leading-relaxed">
                    <strong>STEM</strong> (Știință, Tehnologie, Inginerie, Matematică) reprezintă o abordare 
                    educațională integrată care pregătește copiii români pentru provocările secolului XXI. 
                    În contextul <strong>Curriculumului Național Românesc</strong>, educația STEM dezvoltă 
                    <strong>competențele cheie</strong> necesare pentru succesul academic și profesional.
                  </p>
                </div>

                <h3 className="text-2xl font-bold mb-4">Beneficiile Educației STEM pentru Copiii Români</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 border-l-4 border-blue-500">
                    <h4 className="font-bold text-lg mb-2">🧠 Dezvoltarea Cognitivă</h4>
                    <p>Gândirea critică, rezolvarea problemelor, și analiza logică - abilități esențiale 
                    în curriculumul românesc pentru toate nivelurile educaționale.</p>
                  </div>
                  <div className="bg-white p-6 border-l-4 border-green-500">
                    <h4 className="font-bold text-lg mb-2">🎨 Creativitatea și Inovația</h4>
                    <p>Stimularea imaginației și a gândirii creative prin proiecte practice, 
                    aliniate cu obiectivele educaționale românești.</p>
                  </div>
                  <div className="bg-white p-6 border-l-4 border-purple-500">
                    <h4 className="font-bold text-lg mb-2">🤝 Colaborarea și Comunicarea</h4>
                    <p>Dezvoltarea abilităților sociale și de comunicare prin proiecte de echipă, 
                    esențiale pentru competențele cheie românești.</p>
                  </div>
                  <div className="bg-white p-6 border-l-4 border-orange-500">
                    <h4 className="font-bold text-lg mb-2">💻 Alfabetizarea Digitală</h4>
                    <p>Pregătirea pentru lumea digitală prin robotică și programare, 
                    prioritate în educația românească 2025.</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Romanian Curriculum Alignment */}
              <div className="mb-16">
                <h2 className="text-4xl font-bold mb-8 text-green-800">
                  Alinierea cu Curriculumul Național Românesc
                </h2>
                
                <div className="bg-green-50 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold mb-4">Competențele Cheie STEM în România</h3>
                  <p className="mb-4">
                    Conform <strong>Ministerului Educației din România</strong>, educația STEM contribuie 
                    direct la dezvoltarea următoarelor competențe cheie:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-bold text-blue-600">🔬 Competența Științifică</h4>
                      <p className="text-sm">Înțelegerea fenomenelor naturale și aplicarea metodei științifice</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-bold text-purple-600">💻 Competența Digitală</h4>
                      <p className="text-sm">Utilizarea tehnologiei pentru învățare și comunicare</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-bold text-orange-600">🎯 Competența de Rezolvare a Problemelor</h4>
                      <p className="text-sm">Gândirea critică și găsirea soluțiilor creative</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4">Integrarea STEM pe Niveluri Educaționale</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-bold text-blue-600">🌱 Învățământul Preșcolar (3-5 ani)</h4>
                    <p>Explorarea prin joacă, dezvoltarea curiosității naturale, activități senzoriale și motorii.</p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Jucării recomandate:</strong> Puzzle-uri simple, jocuri de construcție, experimente cu apă și nisip.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-bold text-green-600">📚 Învățământul Primar (6-10 ani)</h4>
                    <p>Introducerea conceptelor STEM de bază, experimente simple, proiecte practice.</p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Jucării recomandate:</strong> Kituri de experimente, robotică de bază, jocuri de logică.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h4 className="text-xl font-bold text-purple-600">🎓 Învățământul Gimnazial (11-14 ani)</h4>
                    <p>Aprofundarea conceptelor STEM, proiecte complexe, introducerea programării.</p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Jucării recomandate:</strong> Robotică avansată, kituri de programare, experimente chimice.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-6">
                    <h4 className="text-xl font-bold text-orange-600">🚀 Învățământul Liceal (15-18 ani)</h4>
                    <p>Specializarea în domenii STEM, proiecte de cercetare, pregătirea pentru facultate.</p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Jucării recomandate:</strong> Kituri profesionale, platforme de dezvoltare, echipamente de laborator.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Choosing STEM Toys by Age */}
              <div className="mb-16">
                <h2 className="text-4xl font-bold mb-8 text-purple-800">
                  Cum să Alegeți Jucăriile STEM Potrivite pentru Copilul Dumneavoastră
                </h2>
                
                <div className="bg-purple-50 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold mb-4">Criteriile de Selecție pentru Părinții Români</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-purple-600">🎯 Alinierea Educațională</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>✅ Certificare MECTS (Ministerul Educației)</li>
                        <li>✅ Aliniere cu curriculumul național</li>
                        <li>✅ Dezvoltarea competențelor cheie</li>
                        <li>✅ Potrivire cu vârsta și nivelul educațional</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-green-600">🛡️ Siguranța și Calitatea</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>✅ Certificare CE pentru piața europeană</li>
                        <li>✅ Materiale non-toxice și durabile</li>
                        <li>✅ Instrucțiuni în limba română</li>
                        <li>✅ Suport tehnic local</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Age-specific recommendations */}
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-2xl font-bold mb-4 text-blue-600">
                      🧸 Preșcolari (3-5 ani) - Explorarea prin Joacă
                    </h3>
                    <p className="mb-4">
                      La această vârstă, copiii români dezvoltă curiozitatea naturală și abilitățile motorii de bază. 
                      Jucăriile STEM trebuie să fie simple, sigure și să stimuleze explorarea senzorială.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🧩</div>
                        <h4 className="font-bold">Puzzle-uri Logice</h4>
                        <p className="text-sm text-gray-600">Dezvoltă gândirea spațială</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔧</div>
                        <h4 className="font-bold">Jocuri de Construcție</h4>
                        <p className="text-sm text-gray-600">Stimulează creativitatea</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎨</div>
                        <h4 className="font-bold">Experimente Senzoriale</h4>
                        <p className="text-sm text-gray-600">Explorează prin simțuri</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-2xl font-bold mb-4 text-green-600">
                      📚 Școlari Mici (6-8 ani) - Învățarea Structurată
                    </h3>
                    <p className="mb-4">
                      Copiii de vârstă școlară mică din România încep să înțeleagă concepte mai complexe 
                      și pot urma instrucțiuni structurate. Este momentul perfect pentru kituri educaționale.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔬</div>
                        <h4 className="font-bold">Kituri de Experimente</h4>
                        <p className="text-sm text-gray-600">Metoda științifică de bază</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🤖</div>
                        <h4 className="font-bold">Robotică Simplă</h4>
                        <p className="text-sm text-gray-600">Introducere în tehnologie</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔢</div>
                        <h4 className="font-bold">Jocuri Matematice</h4>
                        <p className="text-sm text-gray-600">Matematică distractivă</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-2xl font-bold mb-4 text-purple-600">
                      🎓 Gimnaziști (9-12 ani) - Aprofundarea Cunoștințelor
                    </h3>
                    <p className="mb-4">
                      Elevii de gimnaziu din România sunt gata pentru provocări mai complexe și pot înțelege 
                      concepte avansate de inginerie și programare.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">⚡</div>
                        <h4 className="font-bold">Electronică Avansată</h4>
                        <p className="text-sm text-gray-600">Circuite și componente</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">💻</div>
                        <h4 className="font-bold">Programare și Coding</h4>
                        <p className="text-sm text-gray-600">Limbaje de programare</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏗️</div>
                        <h4 className="font-bold">Inginerie Complexă</h4>
                        <p className="text-sm text-gray-600">Proiecte de construcție</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Implementation at Home */}
              <div className="mb-16">
                <h2 className="text-4xl font-bold mb-8 text-orange-800">
                  Implementarea Educației STEM Acasă - Ghid Practic pentru Părinții Români
                </h2>
                
                <div className="bg-orange-50 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold mb-4">Planul Săptămânal STEM</h3>
                  <div className="grid md:grid-cols-7 gap-2 text-center">
                    <div className="bg-blue-100 p-3 rounded">
                      <div className="font-bold">Luni</div>
                      <div className="text-sm">🔬 Știință</div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded">
                      <div className="font-bold">Marți</div>
                      <div className="text-sm">💻 Tehnologie</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded">
                      <div className="font-bold">Miercuri</div>
                      <div className="text-sm">🏗️ Inginerie</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded">
                      <div className="font-bold">Joi</div>
                      <div className="text-sm">🔢 Matematică</div>
                    </div>
                    <div className="bg-pink-100 p-3 rounded">
                      <div className="font-bold">Vineri</div>
                      <div className="text-sm">🎨 Proiect Creativ</div>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded">
                      <div className="font-bold">Sâmbătă</div>
                      <div className="text-sm">🤖 Robotică</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded">
                      <div className="font-bold">Duminică</div>
                      <div className="text-sm">📝 Evaluare</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4">Activități STEM Recomandate pentru Acasă</h3>
                <div className="space-y-6">
                  {/* Daily activities */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold mb-3 text-blue-600">🌅 Activități de Dimineață (15-20 minute)</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      <li>• Puzzle-uri logice cu cafeaua</li>
                      <li>• Observarea naturii și fenomenelor</li>
                      <li>• Jocuri matematice rapide</li>
                      <li>• Experimente simple cu materiale casnice</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold mb-3 text-green-600">🌆 Activități de Seară (30-45 minute)</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      <li>• Proiecte de construcție în familie</li>
                      <li>• Programarea robotului educațional</li>
                      <li>• Experimente cu circuite electrice</li>
                      <li>• Discuții despre ce am învățat astăzi</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Începeți Aventura STEM a Copilului Dumneavoastră Astăzi!
                </h2>
                <p className="text-lg mb-6">
                  Descoperiți colecția noastră de jucării STEM certificate și aliniate cu curriculumul românesc.
                  Fiecare produs este selectat special pentru a dezvolta competențele cheie ale copiilor români.
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="/products" 
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
                  >
                    Vezi Toate Produsele STEM
                  </a>
                  <a 
                    href="/jucarii-stem-dupa-varsta" 
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition"
                  >
                    Găsește după Vârstă
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
