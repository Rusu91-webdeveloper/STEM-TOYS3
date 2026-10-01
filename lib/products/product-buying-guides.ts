/** Reviewed against the sources recorded in docs/audits/2026-10-01-product-improvements.md. */
export interface ProductBuyingGuide {
  brand: string;
  age: string;
  summary: string;
  contents: string;
  preparation: string;
  safety: string;
  activities: string[];
}

const GUIDES: Record<string, ProductBuyingGuide> = {
  "set-constructie-plus-plus-tub-240-piese-basic-culori-standard-pp4185": {
    brand: "Plus-Plus",
    age: "3+",
    summary:
      "Piese de îmbinat pentru modele plate și construcții 3D, după propriile idei.",
    contents: "240 de piese Plus-Plus în culori de bază, într-un tub.",
    preparation: "Construcție liberă, fără baterii sau un model obligatoriu.",
    safety: "Piese mici. Nu este potrivit pentru copiii sub 3 ani.",
    activities: [
      "Așază piesele pe masă și creează un model din culori și forme.",
      "Transformă un model plat într-o construcție 3D, îmbinând mai multe piese.",
      "Desfă construcția și refolosește piesele pentru o idee nouă.",
    ],
  },
  "joc-electronic-logiblocs-set-secret-recorder-06808is": {
    brand: "ImagineStation",
    age: "5+",
    summary:
      "Conectează blocurile electronice pentru a înregistra mesaje și a le reda cu un buton sau un senzor de lumină.",
    contents:
      "4 blocuri: bază de alimentare, buton, senzor de lumină și recorder.",
    preparation:
      "3 baterii AAA de 1,5 V, neincluse. Instrucțiuni incluse în engleză.",
    safety:
      "Piese mici. Respectă instrucțiunile de conectare și de montare a bateriilor.",
    activities: [
      "Înregistrează un mesaj și redă-l cu ajutorul butonului.",
      "Folosește senzorul de lumină pentru un mesaj declanșat la deschiderea unui sertar.",
      "Rearanjează blocurile conform instrucțiunilor și observă ce declanșează redarea.",
    ],
  },
  "mega-brat-hidraulic-kidzlabs-4m-03427": {
    brand: "4M",
    age: "8+",
    summary:
      "Asamblează un braț cu clește și controlează mișcarea lui printr-un sistem hidraulic cu apă.",
    contents:
      "Componente pentru braț și bază, seringi, tuburi și elemente de fixare.",
    preparation:
      "Apă, șurubelniță mică în cruce, loțiune pentru lubrifiere și o cutie metalică goală, curățată; neincluse.",
    safety:
      "Necesită ajutorul și supravegherea unui adult. Urmează instrucțiunile din kit.",
    activities: [
      "Asamblează mecanismul cu un adult și umple sistemul cu apă, conform instrucțiunilor.",
      "Acționează cele patru manete pentru clește, ridicare și rotirea brațului.",
      "Observă cum apa transmite mișcarea de la o seringă la alta.",
    ],
  },
};

export function getProductBuyingGuide(slug: string): ProductBuyingGuide | null {
  return GUIDES[slug.toLowerCase()] ?? null;
}

export function buyingGuideDescription(guide: ProductBuyingGuide): string {
  return `${guide.summary} În cutie: ${guide.contents} De pregătit: ${guide.preparation} Vârsta recomandată: ${guide.age}. ${guide.safety}`;
}
