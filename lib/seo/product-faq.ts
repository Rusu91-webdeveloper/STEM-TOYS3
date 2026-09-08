import { HOVER_RACER_SLUG } from "@/lib/products/catalog-content-overrides";
import type { Product } from "@/types/product";

type ProductFaqItem = {
  question: string;
  answer: string;
};

function getAgeLabel(ageGroup?: string) {
  const labels = {
    TODDLERS_1_3: "1-3 ani",
    PRESCHOOL_3_5: "3-5 ani",
    ELEMENTARY_6_8: "6-8 ani",
    MIDDLE_SCHOOL_9_12: "9-12 ani",
    TEENS_13_PLUS: "13+ ani",
  };

  return labels[ageGroup as keyof typeof labels] || "mai multe varste";
}

function getDisciplineLabel(discipline?: string) {
  const labels = {
    SCIENCE: "stiinta si experimente",
    TECHNOLOGY: "robotica si tehnologie",
    ENGINEERING: "constructii si inginerie",
    MATHEMATICS: "logica si matematica",
    GENERAL: "activitati STEM",
  };

  return labels[discipline as keyof typeof labels] || "activitati STEM";
}

function getOutcomeLabel(outcome?: string) {
  const labels = {
    PROBLEM_SOLVING: "rezolvarea de probleme",
    CREATIVITY: "creativitatea",
    CRITICAL_THINKING: "gandirea critica",
    MOTOR_SKILLS: "abilitatile motorii fine",
    LOGIC: "gandirea logica",
  };

  return labels[outcome as keyof typeof labels] || "invatarea practica";
}

export function buildDefaultProductFaq(product: Product): ProductFaqItem[] {
  if (product.slug === HOVER_RACER_SLUG)
    return [
      {
        question: "Pentru ce vârstă este Hover Racer?",
        answer:
          "Vârsta recomandată de producător este 8+. Respectă recomandarea de pe cutie și instrucțiunile de siguranță.",
      },
      {
        question: "Ce construiește copilul?",
        answer:
          "Un model de aeroglisor susținut de o pernă de aer. Kitul include componentele, accesoriile și instrucțiunile. Necesită 2 baterii AAA, neincluse. Activitatea nu necesită ecran.",
      },
      {
        question: "Cum plătesc și când ajunge?",
        answer:
          "Plată ramburs (COD) sau cu cardul prin Stripe / Netopia. Livrare 1–4 zile lucrătoare cu FanCourier, după confirmarea stocului.",
      },
    ];
  const ageLabel = getAgeLabel(product.ageGroup);
  const manufacturerAge = [
    product.ageRange,
    product.attributes?.manufacturerRecommendedAge,
    product.attributes?.originalAgeText,
  ].find(value => typeof value === "string" && value.trim());
  const disciplineLabel = getDisciplineLabel(product.stemDiscipline);
  const primaryOutcome = Array.isArray(product.learningOutcomes)
    ? product.learningOutcomes[0]
    : undefined;
  const outcomeLabel = getOutcomeLabel(primaryOutcome);
  const categoryName = product.category?.name || "categoria STEM";

  return [
    {
      question: `Pentru ce varsta este potrivit ${product.name}?`,
      answer: manufacturerAge
        ? `Vârsta recomandată de producător pentru ${product.name} este ${manufacturerAge}. Respectă recomandarea de pe ambalaj și instrucțiunile incluse.`
        : `${product.name} este listat în ghidul TechTots pentru segmentul ${ageLabel}. Verifică întotdeauna recomandarea de vârstă de pe ambalaj înainte de utilizare.`,
    },
    {
      question: `Ce tip de abilitati poate sustine ${product.name}?`,
      answer: `Produsul este relevant pentru ${disciplineLabel} si poate sustine ${outcomeLabel}. Este o alegere mai buna atunci cand copilul invata prin joaca practica, constructie sau observatie.`,
    },
    {
      question: `Cand are sens sa aleg ${product.name} fata de alte produse din ${categoryName}?`,
      answer: `Merita sa alegi ${product.name} atunci cand cauti un produs din ${categoryName.toLowerCase()} care sa raspunda clar unei nevoi legate de varsta, logica, experiment sau tehnologie. Daca vrei comparatie mai larga, foloseste si pagina categoriei sau hubul STEM principal.`,
    },
  ];
}
