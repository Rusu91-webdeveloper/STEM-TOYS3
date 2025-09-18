/**
 * STEM Toys for 6-8 Years Old - High-converting landing page
 * Targets: "jucării STEM 6 ani", "jucării educaționale 7 ani", "STEM toys Romania elementary"
 */

import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { generateAgeGroupSchema } from "@/lib/seo/advanced-schema";
import { AdvancedSEOHead } from "@/components/seo/AdvancedSEOHead";
import { db } from "@/lib/db";

export const metadata: Metadata = createMetadata({
  title: "Jucării STEM pentru Copii 6-8 Ani - Certificate România | TechTots",
  description: "Descoperiți jucăriile STEM perfecte pentru copiii de 6-8 ani! Certificate MECTS, aliniate cu curriculumul românesc. Robotică, experimente și matematică distractivă.",
  keywords: [
    "jucării STEM 6 ani",
    "jucării STEM 7 ani", 
    "jucării STEM 8 ani",
    "jucării educaționale clasa 1",
    "jucării educaționale clasa 2",
    "robotică copii 6 ani",
    "experimente științifice 7 ani",
    "matematică distractivă 8 ani",
    "jucării STEM școlari mici",
    "educație STEM primar România",
    "dezvoltare abilități STEM copii",
    "jucării certificate MECTS",
    "curriculum românesc STEM",
    "competențe cheie copii 6-8 ani"
  ],
  ogImage: "/images/stem-toys-6-8-years.jpg",
  pathWithoutLocale: "/jucarii-stem-copii-6-8-ani",
});

// Fetch products for this age group
async function getElementaryProducts() {
  try {
    return await db.product.findMany({
      where: {
        ageGroup: "ELEMENTARY_6_8",
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        featured: "desc",
      },
      take: 12,
    });
  } catch (error) {
    console.error("Error fetching elementary products:", error);
    return [];
  }
}

export default async function STEMToys6to8Page() {
  const products = await getElementaryProducts();

  return (
    <>
      <AdvancedSEOHead 
        pageType="category"
        ageGroup="ELEMENTARY_6_8"
        customSchema={[generateAgeGroupSchema("ELEMENTARY_6_8", products)]}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">
              Jucării STEM pentru Copii 6-8 Ani
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Descoperiți colecția noastră de jucării educaționale STEM perfecte pentru școlarii mici! 
              Certificate MECTS și aliniate cu curriculumul românesc pentru clasele I-II.
            </p>
            <div className="flex justify-center flex-wrap gap-4">
              <span className="bg-white/20 px-4 py-2 rounded-full">🎓 Certificate MECTS</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">📚 Curriculum Românesc</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">🧠 Dezvoltare Cognitivă</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">🤝 Învățare Colaborativă</span>
            </div>
          </div>
        </section>

        {/* Educational Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              De ce sunt Ideale Jucăriile STEM pentru Vârsta 6-8 Ani?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center bg-blue-50 p-8 rounded-lg">
                <div className="text-6xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold mb-4 text-blue-600">Dezvoltarea Cognitivă</h3>
                <p className="text-gray-700">
                  La 6-8 ani, copiii români dezvoltă gândirea logică și capacitatea de a urmări instrucțiuni complexe. 
                  Jucăriile STEM stimulează această dezvoltare naturală.
                </p>
              </div>
              
              <div className="text-center bg-green-50 p-8 rounded-lg">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-4 text-green-600">Aliniere Curriculară</h3>
                <p className="text-gray-700">
                  Toate produsele noastre sunt aliniate cu curriculumul românesc pentru clasele I-II, 
                  susținând învățarea din școală.
                </p>
              </div>
              
              <div className="text-center bg-purple-50 p-8 rounded-lg">
                <div className="text-6xl mb-4">🤝</div>
                <h3 className="text-2xl font-bold mb-4 text-purple-600">Învățare Socială</h3>
                <p className="text-gray-700">
                  Copiii învață să colaboreze, să comunice și să rezolve probleme împreună, 
                  dezvoltând competențe sociale esențiale.
                </p>
              </div>
            </div>

            {/* Curriculum Alignment */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Alinierea cu Curriculumul Românesc - Clasele I-II
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔬</div>
                  <h4 className="font-bold text-blue-600">Științe</h4>
                  <p className="text-sm text-gray-600">Observarea naturii, experimente simple, înțelegerea fenomenelor</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💻</div>
                  <h4 className="font-bold text-purple-600">Tehnologie</h4>
                  <p className="text-sm text-gray-600">Introducere în robotică, utilizarea dispozitivelor, programare vizuală</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🏗️</div>
                  <h4 className="font-bold text-green-600">Inginerie</h4>
                  <p className="text-sm text-gray-600">Construcții simple, mecanisme de bază, design și planificare</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔢</div>
                  <h4 className="font-bold text-orange-600">Matematică</h4>
                  <p className="text-sm text-gray-600">Numărarea, forme geometrice, măsurători, logică</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              Jucării STEM Recomandate pentru 6-8 Ani
            </h2>
            
            {products.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {product.description?.substring(0, 100)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-600">
                          {product.price} RON
                        </span>
                        <a 
                          href={`/products/${product.slug}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                          Vezi Detalii
                        </a>
                      </div>
                      {/* Educational badges */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {product.romanianMinistryApproval && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            ✅ Certificat MECTS
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {product.stemDiscipline}
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {product.productType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Se încarcă produsele...</p>
              </div>
            )}
          </div>
        </section>

        {/* Educational Activities */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              Activități STEM Recomandate pentru 6-8 Ani
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-blue-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-blue-600">🔬 Experimente Științifice</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>Experimentul cu vulcanul:</strong> Învață despre reacții chimice folosind bicarbonat și oțet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>Grădina în borcan:</strong> Observă ciclul plantelor și ecosistemele</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>Magnetismul în acțiune:</strong> Explorează forțele magnetice cu experimente simple</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-green-600">🤖 Robotică de Bază</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>Primul robot:</strong> Construiește un robot simplu care se mișcă</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>Programare vizuală:</strong> Învață concepte de programare cu blocuri colorate</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>Senzori și mișcare:</strong> Înțelege cum robotul "vede" și reacționează</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Parent Resources */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              Resurse pentru Părinții Români
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  📋 Checklist pentru Alegerea Jucăriilor STEM (6-8 ani)
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold mb-4 text-green-600">✅ Criterii Obligatorii</h4>
                    <ul className="space-y-2">
                      <li>□ Certificare CE pentru siguranță</li>
                      <li>□ Aprobare MECTS pentru educație</li>
                      <li>□ Instrucțiuni în limba română</li>
                      <li>□ Potrivire cu vârsta copilului</li>
                      <li>□ Aliniere cu curriculumul școlar</li>
                      <li>□ Materiale non-toxice și durabile</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold mb-4 text-blue-600">🎯 Beneficii Educaționale</h4>
                    <ul className="space-y-2">
                      <li>□ Dezvoltă gândirea critică</li>
                      <li>□ Stimulează creativitatea</li>
                      <li>□ Îmbunătățește abilitățile motorii</li>
                      <li>□ Încurajează colaborarea</li>
                      <li>□ Pregătește pentru viitor</li>
                      <li>□ Susține performanța școlară</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              Întrebări Frecvente - Jucării STEM 6-8 Ani
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">
                  Q: Ce jucării STEM sunt potrivite pentru un copil de 6 ani care începe clasa I?
                </h3>
                <p className="text-gray-700">
                  Pentru copiii de 6 ani care încep școala, recomandăm jucării care dezvoltă abilitățile de bază: 
                  puzzle-uri logice, kituri de construcție simple, experimente cu apă și culori, și robotică de introducere. 
                  Acestea susțin adaptarea la mediul școlar și dezvoltă concentrarea.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">
                  Q: Cum pot integra jucăriile STEM cu temele de la școală?
                </h3>
                <p className="text-gray-700">
                  Jucăriile STEM se integrează perfect cu materiile din curriculum: matematica devine distractivă 
                  prin jocuri de numărare și forme, științele prin experimente practice, iar tehnologia prin 
                  robotică simplă. Oferim ghiduri specifice pentru fiecare materie.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">
                  Q: Cât timp pe zi ar trebui să petreacă copilul cu jucăriile STEM?
                </h3>
                <p className="text-gray-700">
                  Pentru copiii de 6-8 ani, recomandăm 20-30 de minute zilnic de activități STEM structurate, 
                  plus timp liber pentru explorare. Aceasta susține dezvoltarea fără a provoca oboseală.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">
                  Q: Sunt jucăriile STEM sigure pentru copiii de această vârstă?
                </h3>
                <p className="text-gray-700">
                  Da! Toate jucăriile noastre sunt certificate CE și au aprobare MECTS pentru siguranță. 
                  Sunt testate special pentru copiii români și respectă cele mai stricte standarde europene.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Începeți Aventura STEM a Copilului Dumneavoastră!
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Alegeți din colecția noastră de jucării STEM certificate și aliniate cu curriculumul românesc. 
              Fiecare produs vine cu ghid educațional în română.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/products?ageGroup=ELEMENTARY_6_8" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
              >
                Vezi Toate Produsele 6-8 Ani
              </a>
              <a 
                href="/contact" 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition"
              >
                Consultanță Educațională Gratuită
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
