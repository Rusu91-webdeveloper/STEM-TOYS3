import { CookiePreferencesButton } from "./CookiePreferencesButton";

const purposes = [
  [
    "Comenzi, plăți, livrare, retururi și garanții",
    "Identitate, contact, adrese, produse comandate și datele tranzacției",
    "Executarea contractului sau demersuri la cererea ta înainte de încheierea lui — art. 6(1)(b) GDPR; obligații legale aplicabile — art. 6(1)(c).",
  ],
  [
    "Cont și autentificare",
    "Datele contului, adrese salvate și identificatori de autentificare",
    "Furnizarea serviciului de cont solicitat — art. 6(1)(b). Contul nu este obligatoriu pentru o comandă ca vizitator.",
  ],
  [
    "Facturare și evidențe contabile",
    "Identitate, adresă de facturare și documente ale tranzacției",
    "Obligații fiscale și contabile — art. 6(1)(c).",
  ],
  [
    "Răspunsuri la mesaje și reclamații",
    "Contact, mesaj și detaliile cazului",
    "Art. 6(1)(b) pentru solicitări legate de contract; art. 6(1)(f) pentru interesul legitim de a răspunde altor întrebări și de a apăra drepturi.",
  ],
  [
    "Funcționare, securitate și prevenirea abuzurilor",
    "Date tehnice, autentificări și informații relevante despre tranzacții",
    "Interesul legitim de a proteja magazinul, conturile și tranzacțiile — art. 6(1)(f).",
  ],
  [
    "Statistici de utilizare și măsurarea reclamelor",
    "Date despre navigare, dispozitiv, identificatori și evenimente",
    "Consimțământ separat pentru analiză și publicitate — art. 6(1)(a).",
  ],
  [
    "Newsletter solicitat",
    "E-mail și preferințe furnizate la abonare",
    "Consimțământ — art. 6(1)(a). Te poți dezabona din mesaj sau ne poți contacta.",
  ],
];

export function PrivacyProcessing() {
  return (
    <>
      <section id="colectare" className="scroll-mt-28">
        <h2>2. Datele și sursele lor</h2>
        <ul>
          <li>
            <strong>De la tine:</strong> nume, e-mail, telefon, adrese de
            livrare și facturare, date de facturare ale firmei dacă le
            furnizezi, comenzi, mesaje, solicitări de retur și informațiile de
            cont.
          </li>
          <li>
            <strong>Plăți:</strong> metoda, suma, starea și identificatorii
            tranzacției. Introduci datele cardului în formularul procesatorului
            de plată. Adăugarea și modificarea cardurilor în cont sunt
            dezactivate. Eventualele înregistrări vechi sunt afișate numai prin
            informații mascate și pot fi eliminate de titular.
          </li>
          <li>
            <strong>De la servicii:</strong> confirmări de plată de la
            procesator, starea expedierii de la curier și, dacă alegi
            autentificarea Google, numele, e-mailul, imaginea de profil și
            identificatorul contului Google.
          </li>
          <li>
            <strong>La accesarea site-ului:</strong> adresa IP, informații
            despre browser și dispozitiv, cereri către server și date de
            sesiune. Cu acordul pentru analiză sau publicitate se pot prelucra
            și paginile vizitate, sursa vizitei, identificatori și evenimente de
            navigare.
          </li>
          <li>
            <strong>Abonare și recenzii:</strong> e-mailul și preferințele
            trimise la newsletter; conținutul recenziilor și numele afișat, dacă
            publici o recenzie.
          </li>
        </ul>
        <p>
          Datele de contact, livrare și plată cerute la comandă sunt necesare
          pentru procesarea ei; fără ele nu o putem finaliza. Abonarea,
          recenziile și acordul pentru urmărire sunt opționale.
        </p>
      </section>
      <section id="utilizare" className="scroll-mt-28">
        <h2>3. Scopuri și temeiuri</h2>
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Scopuri și temeiuri ale prelucrării"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Scop</th>
                <th>Date folosite</th>
                <th>Temei</th>
              </tr>
            </thead>
            <tbody>
              {purposes.map(([purpose, data, basis]) => (
                <tr key={purpose}>
                  <td>{purpose}</td>
                  <td>{data}</td>
                  <td>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Opțiunile de plată ramburs și necesitatea unei garanții pe card sunt
          evaluate automat pe baza valorii comenzii, metodei de livrare și
          istoricului relevant al comenzilor. Ne poți contacta pentru explicații
          sau pentru a contesta rezultatul aplicat comenzii tale.
        </p>
      </section>
      <section id="cookies" className="scroll-mt-28">
        <h2>4. Cookie-uri și opțiuni</h2>
        <p>
          <strong>Necesare:</strong> autentificarea, protecția sesiunii, coșul
          și memorarea opțiunilor tale folosesc cookie-uri sau stocare locală
          pentru funcționarea solicitată a magazinului.
        </p>
        <p>
          <strong>Analiză:</strong> Google Analytics 4, Vercel Analytics și
          măsurările de utilizare ale magazinului pornesc numai după acordul
          pentru analiză.
        </p>
        <p>
          <strong>Publicitate:</strong> Meta Pixel și integrările publicitare
          configurate, precum TikTok când este activat, pornesc numai după
          acordul pentru publicitate. Ele pot transmite pagini/URL-uri, date
          despre dispozitiv, identificatori și evenimente, pentru măsurarea
          reclamelor și audiențe. Meta poate asocia aceste date cu un cont de pe
          platformele sale.
        </p>
        <p>
          Poți accepta, refuza sau alege separat cele două categorii. Refuzul nu
          împiedică o comandă. Preferința este memorată local 180 de zile, după
          care cerem o nouă alegere. Retragerea oprește urmărirea viitoare și
          reîncarcă pagina; nu anulează prelucrarea deja efectuată pe baza
          acordului anterior.
        </p>
        <CookiePreferencesButton />
      </section>
    </>
  );
}
