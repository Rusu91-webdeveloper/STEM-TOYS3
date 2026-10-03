const providers = [
  {
    name: "Stripe",
    purpose:
      "Plăți cu cardul și autorizări/garanții pe card, când această metodă este utilizată; date de plată, tranzacție și contact necesare operațiunii.",
    href: "https://stripe.com/privacy",
  },
  {
    name: "NETOPIA Payments",
    purpose:
      "Procesarea plăților prin NETOPIA, când această opțiune este utilizată; date ale plătitorului și tranzacției.",
    href: "https://netopia-payments.com/politica-de-confidentialitate/",
  },
  {
    name: "FAN Courier",
    purpose:
      "Livrare la adresă sau FANbox; nume, adresă ori locker, telefon, date ale expedierii și suma ramburs, dacă este cazul.",
    href: "https://www.fancourier.ro/politica-de-prelucrare-a-datelor-cu-caracter-personal/",
  },
  {
    name: "Google",
    purpose:
      "Autentificare, dacă alegi contul Google; Google Analytics 4, numai cu acord pentru analiză, pentru statistici de navigare și evenimente.",
    href: "https://policies.google.com/privacy?hl=ro",
  },
  {
    name: "Meta (Facebook/Instagram)",
    purpose:
      "Meta Pixel, numai când este configurat și ai acordat consimțământ pentru publicitate; date de navigare, identificatori și evenimente pentru măsurare și audiențe.",
    href: "https://www.facebook.com/privacy/policy/",
  },
  {
    name: "Vercel",
    purpose:
      "Găzduirea și livrarea site-ului, date tehnice ale cererilor; Vercel Analytics numai cu acord pentru analiză.",
    href: "https://vercel.com/legal/privacy-notice",
  },
  {
    name: "TikTok, dacă integrarea este activată",
    purpose:
      "Măsurarea publicității prin integrarea configurată, numai cu acord pentru publicitate; date de navigare și evenimente.",
    href: "https://www.tiktok.com/legal/page/eea/privacy-policy/ro",
  },
];

export function PrivacyProviders() {
  return (
    <section id="partajare" className="scroll-mt-28">
      <h2>5. Destinatarii datelor</h2>
      <p>
        În funcție de serviciul folosit și de opțiunile tale, datele relevante
        sunt transmise către:
      </p>
      <ul>
        {providers.map(provider => (
          <li key={provider.name}>
            <strong>{provider.name}:</strong> {provider.purpose}{" "}
            <a href={provider.href}>Informații despre prelucrarea datelor.</a>
          </li>
        ))}
        <li>
          Furnizorii de baze de date și servicii e-mail utilizați pentru
          stocarea informațiilor magazinului și trimiterea mesajelor de comandă,
          suport ori newsletter.
        </li>
        <li>
          Furnizorii implicați în pregătirea și expedierea produselor, în măsura
          necesară executării comenzii.
        </li>
        <li>
          Persoanele autorizate să administreze magazinul, prestatorii contabili
          și juridici pentru activitatea lor, precum și autoritățile când
          comunicarea datelor este cerută de lege.
        </li>
      </ul>
      <p>
        Furnizorii pot avea rol de persoană împuternicită sau operator pentru
        propriile scopuri, în funcție de serviciu și condițiile lui; de exemplu,
        procesatorii de plată au și obligații proprii privind securitatea și
        evidențele tranzacțiilor. Politicile lor explică aceste prelucrări.
        Refuzul urmăririi opționale nu oprește transmiterea necesară unei plăți
        sau livrări solicitate de tine.
      </p>
      <p>
        Pentru colectarea și transmiterea evenimentelor prin Meta Pixel în
        scopurile de publicitate descrise aici, WEBIRA REM S.R.L. și Meta
        Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irlanda,
        sunt operatori asociați în sensul art. 26 GDPR, conform{" "}
        <a href="https://www.facebook.com/legal/controller_addendum">
          acordului privind operatorii
        </a>{" "}
        și{" "}
        <a href="https://www.facebook.com/legal/terms/businesstools">
          condițiilor Meta Business Tools
        </a>
        . Noi furnizăm această informare și gestionăm alegerea din banner; Meta
        răspunde pentru exercitarea drepturilor privind datele stocate de Meta
        după transmitere. Ne poți adresa o cerere sau poți folosi mecanismele
        din politica Meta. Prelucrările ulterioare ale Meta pentru propriile
        scopuri nu intră în această operare asociată.
      </p>
    </section>
  );
}
