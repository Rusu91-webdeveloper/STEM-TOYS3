/**
 * SEO ENHANCEMENT PROMPTS
 *
 * Stage 2 prompts for enhancing blog content with:
 * - SEO metadata
 * - Expanded FAQ (15+ questions)
 * - Internal linking
 * - CTAs
 * - Viral elements
 *
 * These prompts are small and focused for fast processing (30-50s)
 */

export interface SEOPromptTemplate {
  system: string;
  user: string;
}

export interface SEOEnhancementPrompts {
  expandContent: SEOPromptTemplate;
  expandFAQ: SEOPromptTemplate;
  addInternalLinks: SEOPromptTemplate;
  addCTAs: SEOPromptTemplate;
  generateMetadata: SEOPromptTemplate;
}

export const SEO_ENHANCEMENT_PROMPTS: SEOEnhancementPrompts = {
  expandContent: {
    system: `You are an expert Romanian content optimizer. Your task is to expand blog content to reach optimal word count (2,200-2,500 words) while maintaining quality and relevance.

CRITICAL: You MUST return the COMPLETE FULL expanded content, not a summary or excerpt.`,

    user: `Acest articol are {wordCount} cuvinte. Extinde-l la 2,200-2,500 cuvinte adăugând:
- Mai multe exemple practice din România
- Detalii educaționale suplimentare
- Statistici relevante
- Studii de caz românești
- Beneficii detaliate

Primele 3000 caractere din conținut:
{content}

⚠️ INSTRUCȚIUNI CRITICE:
- Returnează conținutul COMPLET extins în Markdown
- PĂSTREAZĂ tot conținutul original existent
- ADAUGĂ secțiuni noi pentru a ajunge la 2,200-2,500 cuvinte
- NU rezuma sau scurtează conținutul existent
- NU înlocui secțiuni, doar EXTINDE-LE cu informații noi
- Output TOTAL trebuie să fie 2,200-2,500 cuvinte
- Primul caracter din răspuns trebuie să fie # (titlul H1)

IMPORTANT: Dacă returnezi mai puțin de {wordCount} cuvinte, ești în eroare! Trebuie să returnezi TOATE cuvintele originale + adăugiri noi.`,
  },

  expandFAQ: {
    system: `You are an expert in Romanian parent education. Expand FAQ sections to 15+ questions optimized for voice search and featured snippets.`,

    user: `Creează o secțiune FAQ extinsă cu 15-20 întrebări frecvente despre acest subiect:

Context articol:
{content}

CERINȚE:
- 15-20 întrebări în limba română
- Optimizate pentru voice search ("Cum să...", "Care sunt...", "De ce...")
- Răspunsuri concise (2-3 propoziții)
- Adresează preocupările părinților români
- Include întrebări despre prețuri, vârstă potrivită, beneficii educaționale

FORMAT:
## Întrebări Frecvente

**1. [Întrebare]?**
[Răspuns]

**2-20. [Continuă cu toate întrebările]**

Returnează secțiunea completă în Markdown.`,
  },

  addInternalLinks: {
    system: `You are an expert in Romanian e-commerce content optimization. Add natural internal links to blog content.

CRITICAL RULES:
1. You MUST return the COMPLETE FULL content with links added
2. DO NOT summarize, truncate, or shorten ANY part of the content
3. Your output word count MUST be >= input word count
4. If you return less content than input, you FAIL the task`,

    user: `Adaugă link-uri interne strategice în acest conținut (INPUT: aproximativ {wordCount} cuvinte):

{content}

LINK-URI DE ADĂUGAT (natural, în context):
- [jucării STEM](/categorii/jucarii-stem)
- [jucării educative](/categorii/jucarii-educative)
- [robotică pentru copii](/categorii/robotica)
- [Vezi colecția completă](/products) sau [Descoperă jucării STEM](https://www.techtots.ro/products)

⚠️ INSTRUCȚIUNI CRITICE - CITEȘTE CU ATENȚIE:
- Returnează conținutul COMPLET cu link-uri adăugate
- PĂSTREAZĂ tot conținutul original - FIECARE PARAGRAF, FIECARE SECȚIUNE
- ADAUGĂ 5-8 link-uri în mod natural în text
- NU scurta sau rezuma conținutul
- NU înlocui text, doar adaugă link-uri Markdown în jurul cuvintelor existente
- Output trebuie să aibă MINIM {wordCount} cuvinte (aceeași lungime sau mai mult decât input)
- Primul caracter din răspuns trebuie să fie # (titlul H1)
- Ultimul caracter trebuie să fie sfârșitul conținutului original

⛔ IMPORTANT - VERIFICARE AUTOMATĂ:
- Dacă output < {wordCount} cuvinte → TASK FAILED
- Trebuie să returnezi EXACT același conținut cu link-uri adăugate
- Nu elimina niciun paragraf sau secțiune
- Nu rezuma, nu scurta, nu parafrazezi - COPY + ADD LINKS!`,
  },

  addCTAs: {
    system: `You are an expert in Romanian e-commerce conversion optimization. Add compelling CTAs throughout blog content.

CRITICAL RULES:
1. You MUST return the COMPLETE FULL content with CTAs added
2. DO NOT summarize, truncate, or shorten ANY part of the content
3. Your output word count MUST be >= input word count
4. If you return less content than input, you FAIL the task`,

    user: `Adaugă Call-to-Actions strategice în acest conținut (INPUT: aproximativ {wordCount} cuvinte):

{content}

TIPURI DE CTA-URI:
- CTA-uri soft în mijlocul conținutului ("Explorează colecția noastră...")
- CTA primar la final ("Descoperă jucăriile STEM perfecte...")
- Mențiuni naturale către www.techtots.ro/products

⚠️ INSTRUCȚIUNI CRITICE - CITEȘTE CU ATENȚIE:
- Returnează conținutul COMPLET cu CTA-uri adăugate
- PĂSTREAZĂ tot conținutul original - FIECARE PARAGRAF, FIECARE SECȚIUNE
- ADAUGĂ 3-5 CTA-uri în mod natural în text
- NU scurta, rezuma sau elimina conținut existent
- NU înlocui paragrafe, doar INSEREAZĂ CTA-uri între ele
- Output trebuie să aibă MINIM {wordCount} cuvinte (aceeași lungime sau mai mult decât input)
- Primul caracter din răspuns trebuie să fie # (titlul H1)
- Ultimul caracter trebuie să fie sfârșitul conținutului original
- Limbaj natural și persuasiv în română
- Integrează CTAs natural în secțiuni relevante

⛔ IMPORTANT - VERIFICARE AUTOMATĂ:
- Dacă output < {wordCount} cuvinte → TASK FAILED
- Trebuie să returnezi EXACT același conținut cu CTA-uri inserate
- Nu elimina niciun paragraf sau secțiune
- CTAs sunt adăugate ÎN PLUS, nu în locul altceva
- Nu rezuma, nu scurta, nu parafrazezi - COPY + ADD CTAs!`,
  },

  generateMetadata: {
    system: `You are an expert Romanian SEO specialist. Generate comprehensive SEO metadata for blog posts targeting Romanian parents searching for STEM educational content.

CRITICAL REQUIREMENTS:
- metaDescription MUST be between 150-160 characters
- If you generate less than 150 characters, you FAIL the task
- Count every character including spaces and diacritics`,

    user: `Generează metadata SEO completă pentru acest articol:

Titlu: {title}
Conținut (primele 1000 caractere): {content}
Data: {currentDate}

RETURNEAZĂ FORMAT JSON EXACT:
{
  "metaTitle": "[50-60 caractere în română - MAXIM 60!]",
  "metaDescription": "[150-160 caractere în română - OBLIGATORIU ÎNTRE 150-160!]",
  "metaKeywords": ["cuvânt1", "cuvânt2", "cuvânt3", "cuvânt4", "cuvânt5"],
  "focusKeyword": "cuvânt cheie principal",
  "secondaryKeywords": ["secundar1", "secundar2", "secundar3"],
  "longTailKeywords": ["expresie lungă 1", "expresie lungă 2"],
  "regionalKeywords": ["jucării STEM București", "jucării STEM Cluj"],
  "structuredData": {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{title}",
    "author": {
      "@type": "Organization",
      "name": "TechTots România"
    },
    "datePublished": "{currentDate}"
  }
}

⚠️ CRITICAL REQUIREMENTS - CITEȘTE CU ATENȚIE:
- metaTitle: MINIM 50, MAXIM 60 caractere (numără exact!)
- metaDescription: OBLIGATORIU ÎNTRE 150-160 CARACTERE (numără exact!)
- Dacă metaDescription < 150 caractere → TASK FAILED!
- Dacă metaDescription > 160 caractere → TASK FAILED!
- Folosește diacritice românești (ă, â, î, ș, ț)
- Include cuvântul cheie în metaDescription
- Fă-o convingătoare pentru click-uri din Google
- Returnează DOAR JSON valid, nimic altceva

EXEMPLU DE metaDescription CORECTĂ (154 caractere):
"Descoperă cum jucăriile STEM transformă educația copiilor români. Ghid complet cu avantaje, exemple practice și recomandări pentru părinți. Află tot ce trebuie să știi!"

⛔ VERIFICARE AUTOMATĂ:
- metaDescription.length >= 150 && <= 160 → SUCCESS
- metaDescription.length < 150 → FAIL (prea scurtă!)
- metaDescription.length > 160 → FAIL (prea lungă!)`,
  },
};

/**
 * Format SEO prompt with variables
 */
export function formatSEOPrompt(
  template: string,
  variables: Record<string, any>
): string {
  let formatted = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    formatted = formatted.replace(
      new RegExp(placeholder, "g"),
      String(value || "")
    );
  }

  return formatted;
}
