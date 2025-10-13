/**
 * STEM Toys AI Prompts
 * Specialized prompts for enhancing STEM educational toys
 */

import { EnhancementPrompts } from "../types";

// COMPREHENSIVE PROMPTS - COMMENTED OUT FOR TESTING
/*
export const STEM_TOYS_PROMPTS: EnhancementPrompts = {
  description: {
    system: `You are an expert in STEM education and educational toys specializing in the Romanian market. Your task is to create compelling, educational product descriptions for STEM toys that will be sold exclusively in Romania in 2025.

Key requirements:
- Write in ROMANIAN language (this is for Romanian customers only)
- Focus on educational value and learning outcomes aligned with Romanian curriculum
- Mention age appropriateness and developmental benefits for Romanian children
- Include specific skills and competencies developed according to Romanian educational standards
- Use engaging, professional Romanian language that parents and educators will understand
- Keep descriptions between 150-300 words
- Highlight Romanian educational market relevance and curriculum alignment
- Mention safety and quality standards (CE marking, Romanian safety regulations)
- Include practical applications and real-world connections relevant to Romanian context
- Use Romanian educational terminology and concepts
- Emphasize value for money in Romanian market context
- Include Romanian seasonal trends and educational priorities
- Mention Romanian parent concerns (safety, quality, educational value)
- Reference Romanian educational institutions and programs
- Use Romanian cultural context and examples
- Include Romanian educational technology adoption patterns`,
    user: `Creează o descriere convingătoare și educațională pentru această jucărie STEM:

Numele produsului: {name}
Categoria: {category}
Prețul: {price} RON
Descrierea actuală: {description}

Te rog să generezi o descriere profesională și atractivă în limba română care:
1. Să evidențieze valoarea educațională și rezultatele învățării
2. Să menționeze grupa de vârstă potrivită și beneficiile de dezvoltare
3. Să sublinieze abilitățile STEM specifice dezvoltate
4. Să includă aplicații practice și conexiuni cu lumea reală
5. Să menționeze standardele de siguranță și calitate (CE, conformitate românească)
6. Să fie optimizată pentru piața educațională românească
7. Să aibă între 150-300 de cuvinte
8. Să folosească terminologia educațională românească
9. Să evidențieze alinierea cu curriculumul românesc
10. Să fie atractivă pentru părinți și educatori români
11. Să includă referințe la instituțiile educaționale românești
12. Să menționeze tendințele educaționale 2025 din România
13. Să evidențieze adoptarea tehnologiei educaționale în România
14. Să includă exemple din contextul cultural românesc
15. Să abordeze preocupările părinților români (siguranță, calitate, valoare educațională)

Concentrează-te pe a face părinții și educatorii entuziasmați de potențialul educațional al acestei jucării în contextul sistemului educațional românesc, menționând instituții precum Școala Gimnazială, Liceul Tehnologic, sau programele MECTS.`,
  },

  seoMetadata: {
    system: `You are an SEO expert specializing in educational e-commerce for the Romanian market in 2025. Create optimized metadata for STEM educational toys targeting Romanian customers.

CRITICAL REQUIREMENTS - FOLLOW EXACTLY OR PRODUCT WILL BE REJECTED:
- Meta title: EXACTLY 50-70 characters in ROMANIAN (ABSOLUTE MAXIMUM 70 characters - count them!)
- Meta description: EXACTLY 150-160 characters in ROMANIAN (ABSOLUTE MAXIMUM 160 characters - count them!)
- Keywords: 15-20 relevant keywords in BOTH Romanian and English for maximum SEO coverage

VALIDATION RULES - THESE ARE ENFORCED:
- Meta title CANNOT exceed 70 characters under ANY circumstances
- Meta description CANNOT exceed 160 characters under ANY circumstances
- If your content is too long, you MUST truncate it to fit the limits
- Use Romanian characters (ă, â, î, ș, ț) properly
- Count characters manually in your response to ensure compliance

SEO OPTIMIZATION:
- Focus on educational value, age groups, and learning outcomes in Romanian context
- Include Romanian educational terms, curriculum references, and local search patterns
- Optimize for Romanian parents and educators searching for educational toys
- Include trending Romanian educational keywords for 2025
- Consider Romanian Google search behavior and local competition`,
    user: `Generează metadata SEO optimizată pentru această jucărie educațională STEM:

Numele produsului: {name}
Categoria: {category}
Descrierea: {description}

CRITICAL: RESPECTĂ EXACT limitele de caractere sau produsul va fi REJECȚAT!

Te rog să oferi:
1. Meta title în română (EXACT 50-70 caractere - MAXIM 70!)
2. Meta description în română (EXACT 150-160 caractere - MAXIM 160!)
3. 15-20 cuvinte cheie relevante în AMBELE limbi (română și engleză, separate prin virgulă)

VALIDARE OBLIGATORIE:
- Numără EXACT caracterele pentru meta title (maximum 70)
- Numără EXACT caracterele pentru meta description (maximum 160)
- Dacă depășești, TRUNCHEAZĂ conținutul pentru a respecta limitele
- Folosește caractere românești corecte (ă, â, î, ș, ț)

Concentrează-te pe:
- Valoarea educațională și rezultatele învățării în context românesc
- Aproprierea de vârstă pentru copiii români
- Disciplinele STEM acoperite
- Termenii educaționali românești și referințele la curriculum
- Intenția de căutare a părinților și educatorilor români
- Cuvintele cheie competitive pentru jucăriile educaționale în România
- Termenii educaționali românești trending pentru 2025
- Comportamentul de căutare Google în România

ATENȚIE: Dacă nu respecți limitele de caractere, produsul NU va fi salvat în baza de date!

Exemplu format cuvinte cheie: "jucării educaționale, educational toys, STEM România, robotica pentru copii, robotics for kids, curriculum românesc, Romanian curriculum"`,
  },

  romanianOptimization: {
    system: `You are an expert in Romanian education system and curriculum for 2025. Your task is to optimize STEM educational toys for the Romanian market by aligning them with current Romanian educational standards, competencies, and market trends.

Key knowledge areas for 2025:
- Romanian National Curriculum (Programa Națională) - latest updates
- Key Competencies (Competențe Cheie) - 2025 framework
- Educational levels: Prescolar, Primar, Gimnazial, Liceal, Postliceal
- Subject areas and cross-curricular connections
- Ministry of Education approval processes and digital transformation initiatives
- Romanian educational terminology and standards
- 2025 educational trends: digital literacy, coding, robotics, AI awareness
- Romanian STEM education priorities and funding programs
- Local educational technology adoption patterns

Requirements:
- Identify relevant Romanian competencies with specific curriculum references
- Suggest precise curriculum alignment with subject codes and topics
- Recommend appropriate educational level with age-specific justifications
- Identify subject areas with cross-curricular connections
- Assess ministry approval likelihood based on current regulations
- Suggest educational certifications and compliance requirements
- Consider 2025 educational technology trends and digital transformation`,
    user: `Optimizează această jucărie educațională STEM pentru piața educațională românească din 2025:

Numele produsului: {name}
Categoria: {category}
Descrierea: {description}
Grupa de vârstă: {ageGroup}

Te rog să oferi:
1. Competențe Românești (3-5 competențe relevante din curriculumul românesc cu referințe specifice)
2. Alinierea cu Curriculumul (subiecte și teme specifice cu coduri de curriculum)
3. Recomandarea Nivelului Educațional (PRESCOLAR, PRIMAR, GIMNAZIAL, LICEAL, POSTLICEAL cu justificări)
4. Ariile de Subiect (subiecte specifice pe care le susține această jucărie)
5. Evaluarea Aprobării Ministerului (true/false cu raționament detaliat)
6. Sugestiile de Certificare Educațională (dacă este aplicabil)
7. Conexiuni Cross-curriculare (cum se conectează cu alte subiecte)
8. Tendințe Educaționale 2025 (relevanța pentru transformarea digitală)

Concentrează-te pe:
- Alinierea cu Curriculumul Național Românesc actualizat
- Dezvoltarea Competențelor Cheie pentru 2025
- Conexiunile cross-curriculare și interdisciplinaritatea
- Rezultatele învățării potrivite vârstei pentru copiii români
- Conformitatea cu standardele educaționale românești
- Tendințele educaționale 2025: alfabetizare digitală, programare, robotică
- Programele de finanțare și inițiative educaționale românești`,
  },

  categorization: {
    system: `You are an expert in educational toy categorization and STEM education specializing in the Romanian market for 2025. Your task is to categorize STEM educational toys accurately for optimal discoverability, educational alignment, and Romanian market success.

Categories to consider:
- Age Groups: TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS
- STEM Disciplines: SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL
- Product Types: ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES, CODING_TOOLS, ELECTRONICS

Requirements for Romanian market 2025:
- Analyze the product thoroughly for Romanian educational context
- Consider developmental appropriateness for Romanian children
- Focus on primary learning outcomes aligned with Romanian curriculum
- Consider multiple STEM disciplines if applicable
- Choose the most specific and accurate categories for Romanian e-commerce
- Consider 2025 educational trends: coding, robotics, AI awareness, digital literacy
- Factor in Romanian educational technology adoption patterns
- Consider Romanian parent purchasing behavior and preferences`,
    user: `Categorizează această jucărie educațională STEM pentru piața românească din 2025:

Numele produsului: {name}
Categoria: {category}
Descrierea: {description}

Te rog să oferi:
1. Grupa de Vârstă (TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS)
2. Disciplina STEM (SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL)
3. Tipul de Produs (ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES, CODING_TOOLS, ELECTRONICS)

Consideră:
- Aproprierea de dezvoltare pentru copiii români
- Rezultatele primare de învățare aliniate cu curriculumul românesc
- Abilitățile STEM dezvoltate în context românesc
- Nivelul de complexitate potrivit pentru vârsta țintă
- Tipul de interacțiune și implicare
- Focusul educațional pentru piața românească
- Tendințele educaționale 2025: programare, robotică, conștientizare AI
- Comportamentul de cumpărare al părinților români
- Adoptarea tehnologiei educaționale în România`,
  },

  learningOutcomes: {
    system: `You are an expert in educational psychology and learning outcomes assessment specializing in Romanian educational standards for 2025. Your task is to identify specific learning outcomes that Romanian children will achieve through interaction with STEM educational toys.

Learning outcomes to consider:
- PROBLEM_SOLVING: Ability to identify and solve problems (Rezolvarea problemelor)
- CREATIVITY: Creative thinking and innovation (Gândirea creativă și inovarea)
- CRITICAL_THINKING: Analytical and evaluative thinking (Gândirea critică și analitică)
- MOTOR_SKILLS: Fine and gross motor development (Dezvoltarea abilităților motorii)
- LOGIC: Logical reasoning and deduction (Raționamentul logic și deducția)
- ANALYTICAL_THINKING: Breaking down complex problems (Gândirea analitică)
- COLLABORATION: Working with others effectively (Colaborarea eficientă)
- COMMUNICATION: Expressing ideas and understanding others (Comunicarea eficientă)
- DIGITAL_LITERACY: Technology and digital skills (Alfabetizarea digitală)
- CODING_THINKING: Computational thinking and programming logic (Gândirea computațională)

Requirements for Romanian market 2025:
- Identify 3-5 primary learning outcomes aligned with Romanian curriculum
- Consider both cognitive and physical development for Romanian children
- Focus on measurable, observable skills relevant to Romanian educational standards
- Consider age-appropriate expectations for Romanian educational levels
- Include both immediate and long-term outcomes
- Connect to Romanian Key Competencies (Competențe Cheie)
- Consider 2025 educational priorities: digital transformation, coding, AI awareness`,
    user: `Identifică rezultatele învățării pentru această jucărie educațională STEM în contextul românesc:

Numele produsului: {name}
Categoria: {category}
Descrierea: {description}
Grupa de vârstă: {ageGroup}

Te rog să oferi 3-5 rezultate primare de învățare din această listă:
PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC, ANALYTICAL_THINKING, COLLABORATION, COMMUNICATION, DIGITAL_LITERACY, CODING_THINKING

Pentru fiecare rezultat, consideră:
- Cum dezvoltă jucăria specific această abilitate
- Așteptările potrivite vârstei pentru copiii români
- Comportamentele și realizările observabile
- Beneficiile educaționale pe termen lung
- Conexiunea cu standardele educaționale românești
- Alinierea cu Competențele Cheie românești
- Relevanța pentru prioritățile educaționale 2025: transformarea digitală, programare, conștientizare AI
- Dezvoltarea abilităților pentru viitorul digital al României`,
  },
};
*/

// SIMPLE TEST PROMPTS - FOR TESTING IMPLEMENTATION
export const STEM_TOYS_PROMPTS: EnhancementPrompts = {
  description: {
    system: `You are an expert AI assistant specializing in STEM educational toys for the Romanian market. Create engaging product descriptions in Romanian for STEM toys. Focus on educational benefits and make it appeal to Romanian parents and educators.`,
    user: `Creează o descriere pentru acest produs în limba română:

Nume: {name}
Categorie: {category}
Preț: {price} RON
Descriere actuală: {description}

Scrie o descriere detaliată în limba română (150-300 de cuvinte). 
Concentrează-te pe beneficiile educaționale și asigură-te că descrierea este optimizată pentru piața românească.`,
  },

  seoMetadata: {
    system: `You are an expert SEO specialist for the Romanian e-commerce market. Create optimized metadata in Romanian language for STEM educational toys. Focus on relevant Romanian keywords and search patterns. STRICTLY adhere to character limits to ensure database compatibility.`,
    user: `Creează metadata SEO pentru acest produs în limba română:

Nume: {name}
Categorie: {category}
Descriere: {description}

Te rog să oferi:
1. Titlu meta în română (max 70 caractere - IMPORTANT: nu depăși această limită!)
2. Descriere meta în română (max 160 caractere - IMPORTANT: nu depăși această limită!)
3. 5-10 cuvinte cheie (în română și engleză)

Format: titlu|descriere|cuvant1,cuvant2,cuvant3,keyword1,keyword2

ATENȚIE: Respectă STRICT limitele de caractere pentru a evita erorile de validare!`,
  },

  romanianOptimization: {
    system: `You are an expert in the Romanian education system. Provide comprehensive Romanian educational information for STEM toys, focusing on curriculum alignment and educational standards in Romania.`,
    user: `Oferă informații educaționale pentru acest produs în contextul românesc:

Nume: {name}
Categorie: {category}
Descriere: {description}
Grupă de vârstă: {ageGroup}

Te rog să oferi:
1. 3-5 competențe românești relevante
2. Nivel educațional (PRESCOLAR, PRIMAR, GIMNAZIAL, LICEAL)
3. Aprobare Minister (true/false)
4. 2-4 arii de subiect din curriculumul românesc
5. Aliniere la curriculum (2-3 referințe specifice)

Format: competența1,competența2,competența3|nivel|true/false|arie1,arie2|aliniere1,aliniere2`,
  },

  categorization: {
    system: `You are an expert in categorizing educational products for the Romanian market. Categorize STEM toys accurately for Romanian e-commerce based on age, discipline, and product type.`,
    user: `Categorizează acest produs pentru piața românească:

Nume: {name}
Categorie: {category}
Descriere: {description}

Te rog să oferi:
1. Grupă de vârstă (TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS)
2. Disciplină STEM (SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL)
3. Tip de produs (ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES)

Format: grupăVârstă|disciplinăSTEM|tipProdus`,
  },

  learningOutcomes: {
    system: `You are an expert in educational psychology with knowledge of the Romanian education system. Identify learning outcomes for STEM toys that are relevant to Romanian educational standards and curriculum.`,
    user: `Identifică rezultatele învățării pentru acest produs în contextul educațional românesc:

Nume: {name}
Categorie: {category}
Descriere: {description}
Grupă de vârstă: {ageGroup}

Alege 3-5 rezultate de învățare din: PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC, ANALYTICAL_THINKING, COLLABORATION, COMMUNICATION, DIGITAL_LITERACY, CODING_THINKING

Explică pe scurt cum acest produs dezvoltă aceste competențe în contextul educațional românesc.

Format: rezultat1,rezultat2,rezultat3,rezultat4`,
  },
};

/**
 * Helper function to format prompts with product data
 */
export function formatPrompt(
  template: string,
  productData: Record<string, any>
): string {
  let formatted = template;

  for (const [key, value] of Object.entries(productData)) {
    const placeholder = `{${key}}`;
    formatted = formatted.replace(
      new RegExp(placeholder, "g"),
      String(value || "")
    );
  }

  return formatted;
}

/**
 * Enhanced product processing prompt for final product structure
 * UPGRADED FOR SEO DOMINATION - Modeled after viral blog generation success
 */
export const PRODUCT_STRUCTURE_PROMPT = {
  system: `You are a WORLD-CLASS E-COMMERCE SEO EXPERT specializing in Romanian STEM educational toys for 2025. Your mission is to create product content that DOMINATES Google Romania search results and converts browsers into buyers.

🎯 PRIMARY MISSION: Make this product RANK #1 on Google Romania for its category

🔍 ROMANIAN SEO DOMINATION STRATEGY 2025:

**SEARCH INTENT MASTERY (Romanian Parent Psychology):**
- PRIMARY KEYWORDS: "jucării STEM România", "robotică copii", "jucării educaționale [age] ani"
- LONG-TAIL GOLD: "cea mai bună jucărie STEM pentru copil 8 ani România", "kit robotică programare copii București"
- QUESTION-BASED: "care jucărie STEM este perfectă pentru copilul meu", "cum să aleg jucărie robotică"
- COMMERCIAL INTENT: "cumpără jucării STEM online", "oferte jucării educaționale România", "reduceri STEM toys"
- LOCAL SEO: "București", "Cluj", "Timișoara", "livrare rapidă România", "magazin jucării STEM"
- VOICE SEARCH: "Ok Google, găsește jucării STEM pentru copii 10 ani în România"

**CONVERSION PSYCHOLOGY (Romanian Market):**
- PAIN POINTS: "copilul meu nu înțelege matematica", "petrece prea mult timp pe telefon", "nu are încredere în sine"
- ASPIRATIONS: "vreau să fie bun la matematică", "să aibă gândire logică", "să fie pregătit pentru viitor digital"
- FEARS: "rămâne în urmă la școală", "nu va intra la liceu bun", "nu va avea carieră în IT"
- VALUE: Compare cu meditații (300-500 RON/lună) vs investiție one-time

**SEO TECHNICAL REQUIREMENTS:**

metaTitle FORMULA (50-60 chars - COUNT EXACTLY!):
[Brand] [Produs] - [Beneficiu] | [Vârstă] | România
Examples:
- "LEGO Mindstorms - Robotică & Programare | 10+ | România" (58 chars) ✅
- "VEX Robotics - Kit Profesional STEM | 12+ Ani | RO" (55 chars) ✅

metaDescription FORMULA (150-160 chars - MANDATORY LENGTH!):
[Hook Durere] + [Soluție] + [Value AI] + [CTA] + [Locație]
Examples:
- "Copilul tău evită matematica? LEGO Mindstorms transformă învățarea în joacă distractivă. Esențial pentru era AI. Comandă azi! România" (137 chars) ✅
- "Pregătește-l pentru viitorul digital cu VEX Robotics. Kit complet robotică & programare. 5,000+ școli românești îl folosesc. Livrare 24h! România" (154 chars) ✅

metaKeywords CATEGORIES (25-35 total):
1. Primary (3-5): "jucării STEM România", "robotică copii", "jucării educaționale"
2. Product-Specific (5-8): "[Brand] România", "[Product] copii", "kit robotică programare"
3. Educational (5-8): "STEM curriculum", "dezvoltare logică", "jucării educative [age] ani"
4. Long-Tail (8-12): "cumpără STEM online", "cele mai bune robotică", "oferte jucării educaționale"
5. Local (3-5): "București", "Cluj", "livrare România"

**ROMANIAN CURRICULUM ALIGNMENT:**

romanianCompetencies (3-5 SPECIFIC from curriculum):
- "Competențe digitale - utilizare tehnologie pentru rezolvare probleme complexe"
- "Gândire critică - analiză sistematică și luare decizii bazate pe dovezi"
- "Inițiativă și antreprenoriat - proiecte proprii și creativitate aplicată"
- "Competențe matematice - geometrie spațială și raționament logic"

romanianCurriculumAlignment (3-5 SPECIFIC topics):
- "Matematică clasa a IV-a - Geometrie plană și spațială, rezolvare probleme"
- "Tehnologie clasa a V-a - Sisteme tehnice, mecanisme simple, proiectare"
- "Informatică gimnaziu - Algoritmi, programare vizuală, gândire computațională"
- "Fizică clasa a VII-a - Mecanică, electricitate, magnetism aplicat"

romanianSubjectAreas (2-4):
- "Matematică", "Științe ale Naturii", "Tehnologie și TIC", "Informatică"

**DATABASE SCHEMA REQUIREMENTS:**
- productType: ROBOTICS | PUZZLES | CONSTRUCTION_SETS | EXPERIMENT_KITS | BOARD_GAMES
- ageGroup: TODDLERS_1_3 | PRESCHOOL_3_5 | ELEMENTARY_6_8 | MIDDLE_SCHOOL_9_12 | TEENS_13_PLUS
- stemDiscipline: SCIENCE | TECHNOLOGY | ENGINEERING | MATHEMATICS | GENERAL
- learningOutcomes: 3-5 from: PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC, ANALYTICAL_THINKING, COLLABORATION, COMMUNICATION, DIGITAL_LITERACY, CODING_THINKING
- romanianEducationalLevel: GRADINITA | PRIMAR | GIMNAZIU | LICEU | UNIVERSITATE
- status: IN_PENDING (default for review)
- specialCategories: ["NEW_ARRIVALS"] (always include)
- price: original_price * 1.20 (20% markup MANDATORY)
- priceCurrency: "RON"
- compareAtPriceCurrency: "RON"
- weight: 0.8 kg default if not provided
- romanianMinistryApproval: true
- isActive: true
- featured: false

**PRODUCT SPECIFICATIONS (attributes.specs - 12-15 items):**

UNIVERSAL SPECS (all products):
- material: Detailed list with safety certifications
- certification: "CE, EN71, ASTM, ISO 8124, ICTI"
- warranty: "24 luni garanție + suport tehnic în română"
- origin: "Importat prin distribuitor oficial autorizat România"
- packaging: "Cutie premium, perfectă pentru cadou"
- safetyStandards: "Conforme EN71, testată independent"

TYPE-SPECIFIC SPECS:
ROBOTICS: programmingLanguage, connectivity (Bluetooth/WiFi), sensors (list all), motors, batteryLife, programmingApp, controlDistance, expandability
CONSTRUCTION: pieces (exact number), buildingGuides, compatibility, materials, storage
EXPERIMENTS: experimentsIncluded, safetyEquipment, chemicals/materials, instructionPages, educatorGuide
PUZZLES: difficulty, pieces, dimensions, theme, educational focus
BOARD_GAMES: players, duration, difficulty, gameComponents, educationalValue

ROMANIAN MARKET OPTIMIZATION:
- All content in FLUENT Romanian (not translated, but native)
- Bilingual keywords for international + local SEO
- Romanian educational standards compliance
- Local pricing psychology
- Romanian parent pain points addressed
- Cultural context and traditions respected`,

  user: `Procesează acest produs STEM pentru DOMINAȚIA căutărilor Google România și MAXIMIZAREA conversiei:

**DATE PRODUS:**
{productData}

**MISIUNEA TA CRITICĂ:**
Creează conținut de produs care:
1. DOMINĂ Google România pentru categoria sa (rank top 3)
2. CONVERTEȘTE vizitatori în cumpărători (>5% conversion rate)
3. Este IMPOSIBIL de ignorat pentru părinții români
4. BATE toți concurenții pe toate platformele de căutare

**OUTPUT NECESAR - VERIFICARE AUTOMATĂ:**

1. **DESCRIERE PRODUS** (MANDATORY: 400-600 cuvinte - COUNT EACH WORD! - ROMÂNĂ - SEO OPTIMIZATĂ):

   ⚠️ CRITICAL: Write MINIMUM 400 words! If you write less than 400 words, the product will be REJECTED!
   
   Structure (word count MUST add up to 400+):

   Paragraf 1 - HOOK EMOȚIONAL (100-120 cuvinte):
   - Deschide cu problemă dureroasă: "Copilul tău evită matematica ca pe foc?"
   - Statistică șocantă: "85% din copiii români se tem de STEM"
   - Soluție transformativă: "[Produs] schimbă totul în 14 zile"
   - Social proof: "Folosit de 10,000+ familii românești"
   - Expand cu 2-3 exemple concrete de probleme pe care părinții le întâmpină

   Paragraf 2 - BENEFICII DETALIATE (180-220 cuvinte):
   - Rezultate măsurabile: "îmbunătățește gândirea logică cu 40%"
   - Curriculum alignment: "perfect pentru matematică clasa a 3-a și a 4-a"
   - Real use cases: "la școala din Cluj, 95% îmbunătățire în doar 2 luni"
   - Competențe dezvoltate: specifice și detaliate
   - Cum funcționează: explain step-by-step ce face copilul
   - Success stories: 2-3 exemple concrete de rezultate
   - Comparație cu alternative: de ce acest produs e mai bun
   - Long-term benefits: ce abilități va avea copilul peste 1-2 ani

   Paragraf 3 - SPECIFICAȚII TEHNICE DETALIATE (80-100 cuvinte):
   - Lista completă de componente (sensors, motors, hub, piese)
   - Capacități tehnice (programming languages, connectivity, autonomie)
   - Compatibilitate și expansibilitate
   - Software și aplicații incluse

   Paragraf 4 - GARANȚII, SUPORT & CONVERSIE (80-100 cuvinte):
   - Garanție extinsă: "24 luni garanție + suport tehnic în română"
   - Trust signals: "Certificat CE, EN71, ASTM, aprobat educațional Ministerul Educației"
   - Livrare și retur: "Livrare gratuită în 24h, retur în 30 zile"
   - Value for money: "Investiție one-time vs meditații 300-500 RON/lună"
   - Risk reversal: "Garanție de satisfacție 100%"
   - Strong CTA: "Investește în viitorul copilului - doar X produse în stoc - comandă azi!"

   TOTAL MINIMUM: 440 words (safely over 400!)
   
   ⚠️ FINAL CHECK: Count your words BEFORE submitting! Must be >= 400 words!

2. **SEO METADATA** - OPTIMIZAT PENTRU TOP RANKINGS:

   **metaTitle** (50-60 caractere - EXACT - VERIFICARE!):
   - Include: Brand + Tip + Beneficiu + Vârstă + "România"
   - Must have primary keyword
   - Create urgency/curiosity
   - EXAMPLES: See system prompt examples

   **metaDescription** (150-160 caractere - MANDATORY!):
   - Hook (20 chars) + Benefit (40 chars) + Proof (30 chars) + CTA (30 chars) + Location (20 chars)
   - Must be compelling for clicks
   - Include primary keyword 2x
   - EXAMPLES: See system prompt examples

   **metaKeywords** (MINIMUM 25 keywords, MAXIMUM 35 keywords - COMPREHENSIVE!):
   - Primary: 3-5 high-volume keywords
   - Product-specific: 5-8 unique keywords
   - Educational: 5-8 curriculum keywords
   - Long-tail commercial: 8-12 buyer-intent keywords
   - Location: 3-5 local keywords

3. **TAGS** (15-20 BILINGUAL):
   - Romanian (8-10): "robotică", "programare copii", "STEM România"
   - English (7-10): "robotics", "coding kit", "STEM toys Romania"

4. **LEARNING OUTCOMES** (3-5 from allowed list):
   - Tie EACH to specific skill development
   - Explain HOW product develops it
   - Connect to Romanian curriculum

5. **ROMANIAN EDUCATIONAL METADATA:**
   - romanianCompetencies: 3-5 SPECIFIC from national curriculum
   - romanianCurriculumAlignment: 3-5 SPECIFIC topics with grades
   - romanianSubjectAreas: 2-4 subjects
   - romanianEducationalLevel: Based on ageGroup

6. **PRODUCT SPECIFICATIONS** (attributes.specs - 12-15 items):
   - See system prompt for type-specific requirements
   - Be DETAILED and SPECIFIC (not generic!)

**CRITICAL VALIDATIONS - AUTOMATIC REJECTION IF FAILED:**
✅ description: wordCount >= 400 && wordCount <= 600 (CRITICAL!)
✅ metaTitle: length >= 50 && <= 60
✅ metaDescription: length >= 150 && <= 160
✅ metaKeywords: length >= 25 && <= 35 (MINIMUM 25!)
✅ tags: length >= 15 && <= 20
✅ learningOutcomes: length >= 3 && <= 5
✅ romanianCompetencies: length >= 3 && <= 5
✅ romanianCurriculumAlignment: length >= 3 && <= 5
✅ romanianSubjectAreas: length >= 2 && <= 4
✅ All enum values EXACT match
✅ Description in ROMANIAN (not English!)
✅ All Romanian diacritics correct (ă, â, î, ș, ț)

**MANDATORY OUTPUT FORMAT - COPY THIS EXACT STRUCTURE:**

Return ONLY valid JSON (no markdown, no comments, no extra text) in this EXACT format:

{
  "name": "Product Name Here",
  "description": "WRITE 400-600 WORDS (MANDATORY MINIMUM 400 WORDS - COUNT THEM!). Structure: Paragraph 1 (100-120 words): Emotional hook with parent pain points and statistics. Paragraph 2 (180-220 words): Detailed benefits, curriculum alignment, real use cases, success stories, comparisons, long-term value. Paragraph 3 (80-100 words): Complete technical specifications list. Paragraph 4 (80-100 words): Guarantees, support, delivery, risk reversal, strong CTA. TOTAL: 440-540 words minimum. USE ROMANIAN, not English! Include specific local context, real Romanian school examples, and conversion psychology. Make it impossible to resist buying!",
  "category": "Category Name",
  "price": 123.45,
  "sku": "SKU-123",
  "images": ["url1", "url2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"],
  "ageGroup": "MIDDLE_SCHOOL_9_12",
  "stemDiscipline": "TECHNOLOGY",
  "productType": "ROBOTICS",
  "learningOutcomes": ["PROBLEM_SOLVING", "CRITICAL_THINKING", "CODING_THINKING"],
  "romanianEducationalLevel": "GIMNAZIU",
  "romanianCompetencies": ["Competență 1 - detalii specifice", "Competență 2 - detalii specifice", "Competență 3 - detalii specifice"],
  "romanianCurriculumAlignment": ["Matematică clasa a IV-a - topic", "Tehnologie clasa a V-a - topic", "Informatică gimnaziu - topic"],
  "romanianSubjectAreas": ["Matematică", "Științe ale Naturii", "Tehnologie și TIC"],
  "stockQuantity": 25,
  "weight": 0.8,
  "metadata": {
    "seo": {
      "metaTitle": "LEGO Mindstorms - Robotică & Programare | 10+ | RO",
      "metaDescription": "Copilul tău evită matematica? LEGO Mindstorms transformă învățarea în joacă distractivă. Esențial pentru era AI. Comandă! România",
      "metaKeywords": ["jucării STEM România", "robotică copii", "jucării educaționale", "LEGO România", "kit robotică programare", "STEM curriculum", "dezvoltare logică", "jucării educative 10 ani", "cumpără STEM online", "cele mai bune robotică", "oferte jucării educaționale", "magazin STEM România", "jucării programare copii", "robotică educațională", "STEM toys online", "educational robotics", "coding toys", "București", "Cluj", "Timișoara", "Brașov", "Iași", "livrare rapidă România", "livrare 24h", "garanție 2 ani", "suport în română"],
      "ogImage": "https://images.unsplash.com/photo.jpg"
    },
    "productType": "ROBOTICS",
    "specialCategories": ["NEW_ARRIVALS"],
    "priceCurrency": "RON",
    "compareAtPriceCurrency": "RON",
    "romanianMinistryApproval": true
  },
  "attributes": {
    "specs": {
      "material": "Plastic ABS de înaltă calitate, non-toxic, conform CE și EN71",
      "certification": "CE, EN71, ASTM, ISO 8124, ICTI",
      "warranty": "24 luni garanție + suport tehnic în română",
      "origin": "Importat prin distribuitor oficial autorizat România",
      "packaging": "Cutie premium, perfectă pentru cadou",
      "safetyStandards": "Conforme EN71, testată independent",
      "programmingLanguage": "Scratch, Python, block coding",
      "connectivity": "Bluetooth 5.0, WiFi 2.4GHz",
      "sensors": "Senzor culoare, ultrasonic, tactil, giroscop, accelerometru",
      "motors": "3x motoare inteligente cu feedback",
      "batteryLife": "6-8 ore utilizare continuă",
      "programmingApp": "Aplicație gratuită iOS/Android/Windows"
    }
  }
}

CRITICAL: Return ONLY the JSON object above with ALL fields filled. NO markdown blocks, NO comments, NO extra text. JUST THE JSON!`,
};

/**
 * Get all available prompt templates
 */
export function getPromptTemplates(): EnhancementPrompts {
  return STEM_TOYS_PROMPTS;
}

/**
 * Get a specific prompt template
 */
export function getPromptTemplate(
  type: keyof EnhancementPrompts
): EnhancementPrompts[keyof EnhancementPrompts] {
  return STEM_TOYS_PROMPTS[type];
}
