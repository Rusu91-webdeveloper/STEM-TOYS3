import Link from "next/link";

import { COMPANY_LEGAL } from "@/lib/config/company-legal";

export function PrivacyRetentionRights() {
  return (
    <>
      <section id="transferuri" className="scroll-mt-28">
        <h2>6. Transferuri internaționale</h2>
        <p>
          Serviciile internaționale de găzduire, autentificare, analiză și
          publicitate pot prelucra date în afara Spațiului Economic European,
          inclusiv în SUA. Locația unui server din UE nu exclude accesul ori
          prelucrarea în alte țări.
        </p>
        <p>
          Google descrie utilizarea deciziilor de adecvare, a cadrului UE–SUA
          Data Privacy Framework și a clauzelor contractuale standard în{" "}
          <a href="https://policies.google.com/privacy/frameworks">
            informațiile despre transferuri
          </a>
          . Vercel include clauze contractuale standard în{" "}
          <a href="https://vercel.com/legal/dpa">acordul său de prelucrare</a>.
          Meta descrie utilizarea Data Privacy Framework pentru serviciile
          acoperite de certificare și a clauzelor contractuale standard în
          celelalte situații, în{" "}
          <a href="https://www.facebook.com/privacy/policy/?subpage=9.subpage.3-HowDoWeSafeguard">
            explicațiile despre garanțiile transferurilor
          </a>
          . Pentru ceilalți destinatari, consultă politicile indicate în
          secțiunea 5; ne poți solicita informații sau o copie a garanțiilor
          aplicabile datelor tale.
        </p>
      </section>
      <section id="retentie" className="scroll-mt-28">
        <h2>7. Cât păstrăm datele</h2>
        <p>
          Durata depinde de scop și de obligațiile aplicabile fiecărei
          categorii; în lipsa unui termen fix, criteriile sunt:
        </p>
        <ul>
          <li>
            <strong>Comenzi și relația cu clientul:</strong> pentru executarea
            comenzii, retururi și garanții, apoi pentru obligații legale sau
            apărarea unor drepturi legate de tranzacție. Ștergerea contului nu
            implică automat ștergerea documentelor care trebuie păstrate.
          </li>
          <li>
            <strong>Documente financiar-contabile:</strong> termenul general
            prevăzut de art. 25 din Legea contabilității nr. 82/1991 este de 5
            ani, calculați de la 1 iulie a anului următor exercițiului financiar
            în care au fost întocmite; alte obligații legale pot impune
            păstrarea anumitor documente pentru alt termen.
          </li>
          <li>
            <strong>Cont:</strong> pe durata utilizării lui. Din setările
            contului poți descărca datele și confirma ștergerea. Eliminăm datele
            profilului, cardurile salvate și datele contului care nu sunt
            necesare tranzacțiilor; accesul este închis. Păstrăm numai
            evidențele necesare obligațiilor legale și apărării drepturilor.
            Comenzile sau retururile în curs necesită verificare manuală, fără
            promisiunea unei ștergeri automate după 30 de zile.
          </li>
          <li>
            <strong>Mesaje și reclamații:</strong> pentru soluționarea
            solicitării și, dacă este necesar, pentru obligațiile sau disputele
            asociate ei.
          </li>
          <li>
            <strong>Newsletter:</strong> pentru trimiterea mesajelor până la
            dezabonare; evidența opțiunii poate fi necesară pentru a respecta
            refuzul și a demonstra gestionarea solicitării.
          </li>
          <li>
            <strong>Sesiune și preferințe:</strong> sesiunea de autentificare
            este configurată pentru 30 de zile și poate fi reînnoită prin
            utilizare; alegerea cookie-urilor expiră după 180 de zile. Stocarea
            locală a coșului poate persista până la golire sau ștergerea datelor
            browserului.
          </li>
          <li>
            <strong>Analiză GA4:</strong> setările verificate la 4 octombrie
            2026 păstrează datele de eveniment timp de 2 luni și datele
            utilizatorului timp de 14 luni. Resetarea la o nouă activitate este
            activă pentru datele utilizatorului, astfel încât utilizarea poate
            prelungi această perioadă. Aceste limite nu se aplică rapoartelor
            agregate standard.{" "}
            <a href="https://support.google.com/analytics/answer/7667196?hl=ro">
              Google explică separat retenția datelor GA4 și a rapoartelor
              agregate
            </a>
            .
          </li>
          <li>
            <strong>Meta:</strong> condițiile Business Tools prevăd păstrarea
            datelor de eveniment până la doi ani și a audiențelor create până la
            ștergerea lor în instrumentele contului. Retragerea acordului
            oprește colectarea viitoare; pentru datele deja transmise poți
            solicita ștergerea în condițiile GDPR.
          </li>
        </ul>
      </section>
      <section id="securitate" className="scroll-mt-28">
        <h2>8. Securitate</h2>
        <p>
          Site-ul folosește HTTPS pentru transmiterea datelor și autentificare
          pentru accesul la cont și administrare. Nu trimite parole sau date de
          card prin formularul de contact ori e-mail. Dacă suspectezi un acces
          neautorizat la contul tău, contactează-ne.
        </p>
      </section>
      <section id="copii" className="scroll-mt-28">
        <h2>9. Date despre copii</h2>
        <p>
          Produsele sunt destinate copiilor, iar datele necesare cumpărării sunt
          cele ale cumpărătorului și destinatarului. Nu este necesar să ne
          comunici diagnostice, informații medicale sau alte detalii sensibile
          despre un copil pentru a cumpăra. Dacă consideri că un copil ne-a
          transmis date care trebuie eliminate, contactează-ne.
        </p>
      </section>
      <section id="drepturi" className="scroll-mt-28">
        <h2>10. Drepturile tale</h2>
        <p>
          În condițiile GDPR, poți solicita acces, rectificare, ștergere,
          restricționare și portabilitate, te poți opune prelucrării bazate pe
          interes legitim și poți retrage consimțământul. Ai și drepturi privind
          deciziile exclusiv automate cu efect juridic sau similar semnificativ.
        </p>
        <p>
          Poți folosi <Link href="/account/settings">setările contului</Link>{" "}
          pentru datele contului sau poți trimite o cerere pentru orice alte
          date, inclusiv cele transmise furnizorilor, la{" "}
          <a href={`mailto:${COMPANY_LEGAL.email}`}>{COMPANY_LEGAL.email}</a>.
          Dacă avem îndoieli rezonabile privind identitatea, putem cere
          informații necesare verificării. Răspundem fără întârzieri
          nejustificate, în cel mult o lună; o prelungire de până la două luni,
          justificată de complexitate sau numărul cererilor, îți va fi
          comunicată în prima lună.
        </p>
        <p>
          Ștergerea are excepții, inclusiv obligațiile de păstrare a
          documentelor și apărarea drepturilor. Te poți adresa{" "}
          <a href="https://www.dataprotection.ro/?page=Plangeri_RGPD">
            ANSPDCP — Autoritatea Națională de Supraveghere a Prelucrării
            Datelor cu Caracter Personal
          </a>{" "}
          sau unei alte autorități competente și poți folosi căile de atac
          judiciare.
        </p>
      </section>
      <section id="modificari" className="scroll-mt-28">
        <h2>11. Actualizări</h2>
        <p>
          Publicăm reviziile pe această pagină, cu data lor. O actualizare a
          textului nu reprezintă acordul tău pentru un nou scop de urmărire.
        </p>
        <p>
          <Link href="/contact">Contactează TechTots</Link> pentru întrebări
          despre această politică.
        </p>
      </section>
    </>
  );
}
