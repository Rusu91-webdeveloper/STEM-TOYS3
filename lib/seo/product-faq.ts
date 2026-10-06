import { disciplineBadgeLabel } from "@/lib/products/romanian-catalog";
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

  return labels[ageGroup as keyof typeof labels] || "mai multe vârste";
}

function getDisciplineLabel(discipline?: string) {
  const labels = {
    SCIENCE: "știință și experimente",
    TECHNOLOGY: "robotică și tehnologie",
    ENGINEERING: "construcții și inginerie",
    MATHEMATICS: "logică și matematică",
    GENERAL: "activități STEM",
  };

  return labels[discipline as keyof typeof labels] || "activități STEM";
}

function getOutcomeLabel(outcome?: string) {
  const labels = {
    PROBLEM_SOLVING: "rezolvarea de probleme",
    CREATIVITY: "creativitatea",
    CRITICAL_THINKING: "gândirea critică",
    MOTOR_SKILLS: "abilitățile motorii fine",
    LOGIC: "gândirea logică",
  };

  return labels[outcome as keyof typeof labels] || "învățarea practică";
}

export function buildDefaultProductFaq(product: Product): ProductFaqItem[] {
  const ageLabel = getAgeLabel(product.ageGroup);
  const manufacturerAge = [
    product.ageRange,
    product.attributes?.manufacturerRecommendedAge,
    product.attributes?.originalAgeText,
  ].find(value => typeof value === "string" && value.trim());
  const ageAttribution = product.attributes?.manufacturerRecommendedAge
    ? "Vârsta recomandată de producător"
    : "Vârsta recomandată în descriere";
  const disciplineLabel = getDisciplineLabel(product.stemDiscipline);
  const primaryOutcome = Array.isArray(product.learningOutcomes)
    ? product.learningOutcomes[0]
    : undefined;
  const outcomeLabel = getOutcomeLabel(primaryOutcome);
  const categoryName =
    disciplineBadgeLabel(
      product.stemDiscipline,
      product.category?.name,
      product.category?.slug
    ) || "STEM";

  return [
    {
      question: `Pentru ce vârstă este potrivit ${product.name}?`,
      answer: manufacturerAge
        ? `${ageAttribution} pentru ${product.name} este ${manufacturerAge}. Încadrarea TechTots în ghidul de cadouri pentru ${ageLabel} este orientativă și nu înlocuiește recomandarea de pe ambalaj.`
        : `${product.name} este listat în ghidul TechTots pentru segmentul ${ageLabel}. Verifică întotdeauna recomandarea de vârstă de pe ambalaj înainte de utilizare.`,
    },
    {
      question: `Ce tip de abilități poate susține ${product.name}?`,
      answer: `Activitățile din zona de ${disciplineLabel} pot pune în practică ${outcomeLabel}. Consultă secțiunea „Ce exersează copilul” pentru activitățile concrete ale acestui produs.`,
    },
    {
      question: `Cum aleg ${product.name} dintre produsele din ${categoryName}?`,
      answer: `Compară activitățile cu interesele copilului și verifică vârsta recomandată, conținutul și materialele necesare din descriere. Alege un nivel de dificultate potrivit și ia în calcul ajutorul unui adult atunci când acesta este indicat.`,
    },
  ];
}
