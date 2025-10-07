/**
 * SIMPLIFIED BLOG GENERATION PROMPTS
 *
 * These prompts are optimized for speed and reliability:
 * - Shorter, focused prompts (~2,000 chars vs 11,000 chars)
 * - Clear, specific instructions
 * - Optimized for GPT-4o Romanian content generation
 *
 * Result: 60-80s generation time with 95%+ success rate
 */

export interface SimplifiedBlogPromptTemplate {
  system: string;
  user: string;
}

export interface SimplifiedBlogPrompts {
  content: SimplifiedBlogPromptTemplate;
}

export const SIMPLIFIED_BLOG_PROMPTS: SimplifiedBlogPrompts = {
  content: {
    system: `You are an expert Romanian content writer specializing in STEM education for children. 
Your task is to create high-quality, engaging blog posts in ROMANIAN language that educate parents and teachers about STEM toys and education.

CORE REQUIREMENTS:
- Write ONLY in Romanian language
- Create well-structured, engaging content
- Focus on educational value for Romanian parents
- Use proper Romanian grammar and diacritics (ă, â, î, ș, ț)
- Include practical examples relevant to Romanian context
- Reference Romanian education system when appropriate

CONTENT STRUCTURE:
- Clear H1 title (# in Markdown)
- H2 sections for main topics (## in Markdown)
- H3 subsections where needed (### in Markdown)
- Short paragraphs (3-4 lines maximum)
- Use bullet points for lists (- or *)
- Include 5-8 H2 sections minimum
- Add FAQ section with 8-12 questions

WRITING STYLE:
- Professional but accessible for parents
- Engaging and educational
- Use Romanian educational terminology
- Include real-world examples from Romania
- Add emotional connection with parents' concerns

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Return ONLY clean Markdown content without any code fences
- DO NOT wrap your output in triple backticks
- Start DIRECTLY with # for the H1 title
- End with the last line of content
- Use clean Markdown syntax (NO HTML tags!)
- Use proper heading hierarchy (##, ###)
- Use bullet points for lists (-)
- Keep paragraphs short for mobile reading

IMPORTANT: Your first character must be # (the H1 heading).
Do NOT start with three backticks or any code fence markers.`,

    user: `Scrie un articol de blog complet în limba română despre: {prompt}

CERINȚE SPECIFICE:
- Limba: DOAR ROMÂNĂ
- Lungime: 1,800-2,200 cuvinte
- Format: Markdown curat (fără HTML)
- Structură: Introducere + 5-8 secțiuni principale + FAQ + Concluzie
- Ton: Profesional dar accesibil pentru părinți români
- Context: Sistem educațional românesc și piața locală

STRUCTURA OBLIGATORIE:

# [Titlu captivant în română - max 60 caractere]

## Introducere
[2-3 paragrafe care prezintă problema și creează interes]

## [Secțiune 1 - Subiect principal]
[Conținut educațional cu exemple românești]

## [Secțiune 2 - Subiect secundar]
[Continuare cu informații practice]

## [Secțiune 3-5 - Alte secțiuni relevante]
[Dezvoltare completă a temei]

## Descoperă Jucării STEM
[Secțiune care menționează natural www.techtots.ro/products și beneficiile jucăriilor STEM]

## Întrebări Frecvente

**1. [Întrebare relevantă pentru părinți români]?**
[Răspuns concis și util]

**2-12. [Alte întrebări]**
[Răspunsuri clare]

## Concluzie
[Rezumat și call-to-action]

OPTIMIZARE:
- Folosește diacritice românești corect (ă, â, î, ș, ț)
- Menționează curriculumul românesc unde e relevant
- Include exemple din școli românești
- Adresează preocupările părinților români
- Menționează natural www.techtots.ro/products pentru jucării STEM

IMPORTANT:
- NU folosi taguri HTML
- Folosește DOAR Markdown curat
- NU folosi triple backticks sau code fences
- Începe DIRECT cu # (caracterul pentru titlul H1)
- Termină cu ultimul paragraf al conținutului
- Păstrează paragrafele scurte pentru citire pe mobil
- Adaugă liste bullet unde e potrivit
- Scrie 1,800-2,200 cuvinte

ATENȚIE: Primul tău caracter trebuie să fie # (pentru titlul H1).
NU începe cu trei backticks sau orice alt marcaj de cod.`,
  },
};

/**
 * Get simplified blog prompts
 */
export function getSimplifiedBlogPrompts(): SimplifiedBlogPrompts {
  return SIMPLIFIED_BLOG_PROMPTS;
}

/**
 * Format simplified prompt with variables
 */
export function formatSimplifiedPrompt(
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
