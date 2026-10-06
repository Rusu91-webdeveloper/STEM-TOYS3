/** Reviewed spelling corrections only: no changes to ages, quantities or claims. */
const SPELLINGS: Record<string, string> = {
  apa: "apă",
  artificiala: "artificială",
  activitati: "activități",
  antigravitationala: "antigravitațională",
  asambleaza: "asamblează",
  brat: "braț",
  celesta: "celestă",
  constelatii: "constelații",
  constructie: "construcție",
  construieste: "construiește",
  creativitatii: "creativității",
  degete: "degete",
  descopera: "descoperă",
  deseneaza: "desenează",
  dimensiuni: "dimensiuni",
  eoliana: "eoliană",
  electrica: "electrică",
  fizica: "fizică",
  fosforescent: "fosforescent",
  geoda: "geodă",
  inteligenta: "inteligență",
  invata: "învață",
  invatare: "învățare",
  inmultirea: "înmulțirea",
  inginerie: "inginerie",
  jucarie: "jucărie",
  jucarii: "jucării",
  logica: "logică",
  levitatie: "levitație",
  lupa: "lupă",
  magneti: "magneți",
  manusa: "mănușă",
  marire: "mărire",
  masinuta: "mașinuță",
  metalica: "metalică",
  palnie: "pâlnie",
  placi: "plăci",
  placute: "plăcuțe",
  robotica: "robotică",
  racheta: "rachetă",
  bila: "bilă",
  roboti: "roboți",
  roti: "roți",
  rosii: "roșii",
  sarpe: "șarpe",
  si: "și",
  solara: "solară",
  spatiu: "spațiu",
  spatiului: "spațiului",
  spatiala: "spațială",
  statie: "stație",
  stiintific: "științific",
  stralucitoare: "strălucitoare",
  umana: "umană",
  viteza: "viteză",
  varsta: "vârstă",
  varstei: "vârstei",
};

export function normalizeStorefrontCopy(value: string): string {
  // Leave HTML attributes, source links and official model codes untouched.
  return value
    .split(/(<[^>]*>)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part
        .replace(/[şţŞŢ]/g, char => ({ ş: "ș", ţ: "ț", Ş: "Ș", Ţ: "Ț" })[char]!)
        .replace(/(?<![\p{L}\p{N}&])[a-zA-Z]+(?![\p{L}\p{N};])/gu, word => {
          // All-uppercase tokens may be technical names, such as SI.
          if (word === word.toUpperCase()) return word;
          const spelling = SPELLINGS[word.toLowerCase()];
          if (!spelling) return word;
          return word[0] === word[0].toUpperCase()
            ? spelling[0].toUpperCase() + spelling.slice(1)
            : spelling;
        })
        .replace(/([a-zăâîșț][.!?])(?=[A-ZĂÂÎȘȚ])/g, "$1 ")
        .replace(/[ \t]{2,}/g, " ");
    })
    .join("")
    .replace(/(<\/(?:p|div|h[1-6]|li|ul|ol)>)(?=[^\s<])/gi, "$1 ");
}
