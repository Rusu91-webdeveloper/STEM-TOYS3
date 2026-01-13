# Customer Support Macros (Templates)

## Overview
Pre-defined email templates for common customer support scenarios. Use these macros to ensure consistent, professional communication.

---

## 1. Order Received / Confirmation

**Subject:** Comanda ta #ORDER_NUMBER a fost primită

**Body:**
```
Bună [Nume Client],

Mulțumim pentru comanda ta! Am primit comanda #ORDER_NUMBER și o procesăm acum.

📦 Detalii comandă:
- Număr comandă: #ORDER_NUMBER
- Data: [DATA_COMANDA]
- Total: [TOTAL] lei
- Metodă de plată: [METODA_PLATA]

🔄 Următorii pași:
1. Procesăm comanda ta (1-2 zile lucrătoare)
2. Furnizorul nostru o pregătește pentru expediere
3. Primești email cu numărul de urmărire
4. Livrare în 5-10 zile lucrătoare

Vei primi actualizări la fiecare etapă. Poți urmări statusul comenzii în contul tău:
[LINK_COMENZI]

Dacă ai întrebări, suntem aici să te ajutăm!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 2. Order Shipped / Tracking

**Subject:** Comanda ta #ORDER_NUMBER a fost expediată

**Body:**
```
Bună [Nume Client],

Excelente vești! Comanda ta #ORDER_NUMBER a fost expediată.

📦 Detalii expediere:
- Număr AWB: [AWB_NUMBER]
- Curier: [CURIER_NAME]
- Data expediere: [DATA_EXPEDIERE]

🔗 Urmărește coletul:
[LINK_TRACKING]

Timp estimat de livrare: [ZILE] zile lucrătoare

💡 Sfat: Poți reprograma livrarea sau schimba adresa direct din link-ul de urmărire.

Dacă ai întrebări despre livrare, suntem aici!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 3. Delivery Delay

**Subject:** Actualizare despre comanda ta #ORDER_NUMBER

**Body:**
```
Bună [Nume Client],

Îți scriem pentru a te informa că există o întârziere în procesarea comenzii tale #ORDER_NUMBER.

🔍 Situația actuală:
- Status: [STATUS] (ex: "În procesare la furnizor")
- Motiv întârziere: [MOTIV] (ex: "Stoc temporar epuizat", "Procesare furnizor")
- Estimare actualizată: [DATA_ESTIMATA]

🔄 Ce facem:
- Monitorizăm zilnic statusul cu furnizorul
- Te vom ține la curent cu orice actualizare
- Vom accelera procesarea când este posibil

💡 Opțiuni:
- Poți aștepta actualizarea estimată
- Poți anula comanda și primi rambursare completă
- Poți schimba produsul cu altul disponibil

Ne pare rău pentru inconveniență. Te vom ține la curent!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 4. Return Request - Standard

**Subject:** Cererea ta de returnare #RETURN_ID a fost primită

**Body:**
```
Bună [Nume Client],

Am primit cererea ta de returnare pentru comanda #ORDER_NUMBER.

📋 Detalii returnare:
- Produs: [NUME_PRODUS]
- Motiv: [MOTIV_RETURNARE]
- Status: În procesare

📦 Următorii pași:
1. Vei primi email cu eticheta de returnare în [TERMEN] ore
2. Printează eticheta și atașează-o pe pachet
3. Împachetează produsul în ambalajul original (dacă este posibil)
4. Predă pachetul la [PUNCT_COLECTARE]

💰 Rambursare:
- Suma: [SUMA] lei
- Metodă: [METODA_RAMBURSARE]
- Termen: 14 zile de la primirea produsului returnat

[NOTA_SUPPLIER_AUTH] - Pentru anumiți furnizori, returnările pot necesita autorizare (ARP/RMA). În acest caz, vei primi un număr de autorizare separat.

Dacă ai întrebări, suntem aici!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 5. Missing Parts / Defect Claim

**Subject:** Cererea ta pentru produs defect #CLAIM_ID

**Body:**
```
Bună [Nume Client],

Am primit cererea ta pentru produsul defect din comanda #ORDER_NUMBER.

🔍 Am analizat:
- Produs: [NUME_PRODUS]
- Problemă: [DESCRIERE_PROBLEMA]
- Fotografii: ✅ Primite

📋 Următorii pași:
1. Procesăm cererea cu furnizorul (1-2 zile lucrătoare)
2. [DACĂ_SUPPLIER_AUTH] Solicităm autorizare ARP/RMA de la furnizor
3. Vei primi email cu:
   - Eticheta de returnare (dacă este necesar)
   - Instrucțiuni pentru returnare
   - [DACĂ_SUPPLIER_AUTH] Număr de autorizare ARP/RMA

🔄 Opțiuni de rezolvare:
- Înlocuire produs (dacă este disponibil)
- Returnare și rambursare completă
- Credit pentru următoarea comandă

💰 Costuri:
- Returnarea este gratuită pentru produse defecte
- Suportăm toate costurile de transport

Te vom ține la curent cu statusul cererii tale.

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 6. Transit Damage Claim

**Subject:** Cererea ta pentru daune în tranzit #CLAIM_ID

**Body:**
```
Bună [Nume Client],

Am primit cererea ta pentru daune în tranzit la comanda #ORDER_NUMBER.

🔍 Am analizat:
- Produs: [NUME_PRODUS]
- Daune: [DESCRIERE_DAUNE]
- Fotografii: ✅ Primite

📋 Următorii pași:
1. Procesăm cererea cu curierul și furnizorul
2. Evaluăm daunele și determinăm rezolvarea
3. Vei primi email cu:
   - Eticheta de returnare (dacă este necesar)
   - Instrucțiuni pentru returnare
   - Confirmarea rezolvării

🔄 Opțiuni de rezolvare:
- Înlocuire produs (prioritar)
- Returnare și rambursare completă
- Credit pentru următoarea comandă

💰 Costuri:
- Returnarea este gratuită pentru daune în tranzit
- Suportăm toate costurile de transport
- Rambursare completă sau înlocuire garantată

Ne pare rău pentru inconveniență. Rezolvăm rapid!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 7. Return Approved / Refund Processing

**Subject:** Returnarea ta #RETURN_ID a fost aprobată

**Body:**
```
Bună [Nume Client],

Returnarea ta #RETURN_ID pentru comanda #ORDER_NUMBER a fost aprobată.

✅ Status: Aprobată
📦 Produs primit: [DATA_PRIMIRE]
💰 Rambursare: [SUMA] lei

🔄 Procesare rambursare:
- Metodă: [METODA_RAMBURSARE]
- Termen: 14 zile de la primirea produsului
- Status actual: În procesare

Vei primi confirmare când rambursarea este finalizată.

Mulțumim pentru încrederea acordată!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## 8. Return Rejected (with explanation)

**Subject:** Actualizare despre returnarea ta #RETURN_ID

**Body:**
```
Bună [Nume Client],

Am analizat cererea ta de returnare #RETURN_ID pentru comanda #ORDER_NUMBER.

❌ Status: Returnare respinsă

🔍 Motiv:
[MOTIV_RESPINGERE]
Exemple:
- Produsul nu este în stare originală (uzură excesivă)
- Produsul nu este complet (piese lipsă)
- Produsul nu este returnabil (conform politicii)

💡 Opțiuni:
- Poți contesta decizia (trimite fotografii suplimentare)
- Poți solicita evaluare de către manager
- Poți contacta suportul telefonic pentru discuție

Dacă ai întrebări sau dorești să contestezi, suntem aici!

Cu respect,
Echipa TechTots
Email: [CONTACT_EMAIL]
Telefon: [CONTACT_PHONE]
```

---

## Variables to Replace

- `[Nume Client]` - Customer name
- `#ORDER_NUMBER` - Order number
- `#RETURN_ID` - Return ID
- `#CLAIM_ID` - Claim ID
- `[DATA_COMANDA]` - Order date
- `[TOTAL]` - Order total
- `[METODA_PLATA]` - Payment method
- `[LINK_COMENZI]` - Link to orders page
- `[CONTACT_EMAIL]` - Support email
- `[CONTACT_PHONE]` - Support phone
- `[AWB_NUMBER]` - Tracking number
- `[CURIER_NAME]` - Courier name
- `[DATA_EXPEDIERE]` - Shipping date
- `[LINK_TRACKING]` - Tracking link
- `[ZILE]` - Estimated days
- `[STATUS]` - Current status
- `[MOTIV]` - Delay reason
- `[DATA_ESTIMATA]` - Estimated date
- `[NUME_PRODUS]` - Product name
- `[MOTIV_RETURNARE]` - Return reason
- `[TERMEN]` - Timeframe
- `[PUNCT_COLECTARE]` - Collection point
- `[SUMA]` - Refund amount
- `[METODA_RAMBURSARE]` - Refund method
- `[DESCRIERE_PROBLEMA]` - Problem description
- `[DESCRIERE_DAUNE]` - Damage description
- `[DATA_PRIMIRE]` - Received date
- `[MOTIV_RESPINGERE]` - Rejection reason

---

**Status:** ✅ Macros ready for use in customer support system.
