import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAllRemainingTemplates() {
  console.log(
    "🚀 Crearea tuturor șabloanelor rămase pentru creșterea veniturilor...\n"
  );

  const remainingTemplates = [
    // ===== AUTHENTICATION =====
    {
      name: "Bun Venit în Comunitatea STEM Toys",
      slug: "welcome",
      category: "authentication",
      subject: "Bun venit la STEM Toys! 🎉 Descoperă lumea STEM împreună",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Bun venit la STEM Toys! 🎉</h1>

          <p>Draga {{userName}},</p>

          <p>Îți mulțumim că ai ales să faci parte din comunitatea STEM Toys! Suntem încântați să te avem alături în călătoria fascinantă de descoperire a Științei, Tehnologiei, Ingineriei și Matematicii.</p>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🎁 Cadoul tău de bun venit</h3>
            <p>Ca mulțumire pentru înregistrare, primești <strong>10% reducere</strong> la prima comandă!</p>
            <p style="font-size: 18px; font-weight: bold; color: #1e40af; text-align: center;">Cod: STEM10</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              🛍️ Începe cumpărăturile cu 10% reducere
            </a>
          </div>

          <p>Descoperă cele mai populare jucării STEM și începe aventura învățării distractive!</p>

          <p>Cu entuziasm,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["userName", "siteUrl"],
      isActive: true,
    },

    {
      name: "Confirmare Schimbare Email",
      slug: "email-change-confirmation",
      category: "authentication",
      subject: "Confirmare schimbare adresă email - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Confirmare Schimbare Email</h1>

          <p>Bună {{userName}},</p>

          <p>Am primit cererea ta de schimbare a adresei de email pentru contul STEM Toys.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📧 Detalii schimbare</h3>
            <p><strong>Email nou:</strong> {{newEmail}}</p>
            <p><strong>Email vechi:</strong> {{oldEmail}}</p>
          </div>

          <p>Pentru a confirma schimbarea, fă click pe butonul de mai jos:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{confirmationUrl}}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirmă Schimbarea Email</a>
          </div>

          <p>Dacă nu ai solicitat această schimbare, ignoră acest email.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["userName", "newEmail", "oldEmail", "confirmationUrl"],
      isActive: true,
    },

    {
      name: "Cont Nou Creat",
      slug: "account-created",
      category: "authentication",
      subject: "Contul tău STEM Toys a fost creat cu succes! 🎯",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Cont Creat cu Succes! ✅</h1>

          <p>Bună {{userName}},</p>

          <p>Felicitări! Contul tău STEM Toys a fost creat cu succes. Acum poți:</p>

          <ul>
            <li>💝 Salvezi produsele favorite</li>
            <li>📦 Urmărești comenzile</li>
            <li>⭐ Lăsi recenzii</li>
            <li>🎁 Beneficiezi de oferte exclusive</li>
            <li>🚚 Livrare rapidă și sigură</li>
          </ul>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-size: 24px;">Primul tău avantaj!</h2>
            <p style="margin: 10px 0; font-size: 16px;">Primești automat statutul de client nou</p>
            <p style="margin: 0; opacity: 0.9;">Descoperă oferte speciale pentru tine</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Începe explorarea STEM Toys</a>
          </div>

          <p>Bine ai venit în comunitatea noastră! 🚀</p>

          <p>Cu bucurie,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["userName", "siteUrl"],
      isActive: true,
    },

    {
      name: "Notificare Login Nou",
      slug: "login-notification",
      category: "authentication",
      subject: "Activitate nouă de conectare - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Activitate de Conectare Nouă 🔐</h1>

          <p>Bună {{userName}},</p>

          <p>Am detectat o nouă conectare la contul tău STEM Toys.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Detalii conectare</h3>
            <p><strong>Data și ora:</strong> {{loginDate}}</p>
            <p><strong>Dispozitiv:</strong> {{device}}</p>
            <p><strong>Locație:</strong> {{location}}</p>
            <p><strong>Browser:</strong> {{browser}}</p>
          </div>

          <p>Dacă ai fost tu, poți ignora acest email. Dacă nu recunoști această activitate, te rugăm să-ți schimbi parola imediat.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetPasswordUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schimbă Parola</a>
          </div>

          <p>Pentru securitatea contului tău, monitorizăm toate activitățile.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "userName",
        "loginDate",
        "device",
        "location",
        "browser",
        "resetPasswordUrl",
      ],
      isActive: true,
    },

    // ===== ORDERS =====
    {
      name: "Comandă Anulată",
      slug: "order-cancelled",
      category: "orders",
      subject: "Comanda #{{order.number}} a fost anulată",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Comandă Anulată</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Comanda ta #{{order.number}} a fost anulată conform cererii tale.</p>

          <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">📋 Detalii anulare</h3>
            <p><strong>Motiv anulare:</strong> {{cancellation.reason}}</p>
            <p><strong>Data anulare:</strong> {{cancellation.date}}</p>
            <p><strong>Rambursare:</strong> {{refund.amount}} RON (estimat {{refund.eta}})</p>
          </div>

          <p>Îți mulțumim pentru înțelegere. Sperăm să te revedem curând cu alte jucării STEM minunate!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continuă explorarea STEM Toys</a>
          </div>

          <p>Întrebări? Contactează-ne la support@techtots.ro</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "cancellation.reason",
        "cancellation.date",
        "refund.amount",
        "refund.eta",
        "siteUrl",
      ],
      isActive: true,
    },

    {
      name: "Rambursare Procesată",
      slug: "order-refunded",
      category: "orders",
      subject: "Rambursare procesată pentru comanda #{{order.number}} 💰",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Rambursare Procesată! 💰</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Rambursarea pentru comanda #{{order.number}} a fost procesată cu succes.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">💳 Detalii rambursare</h3>
            <p><strong>Sumă rambursată:</strong> {{refund.amount}} RON</p>
            <p><strong>Metodă:</strong> {{refund.method}}</p>
            <p><strong>Procesată la:</strong> {{refund.date}}</p>
            <p><strong>Timp estimat:</strong> {{refund.eta}}</p>
          </div>

          <p>Banii vor apărea în contul tău în maximum 3-5 zile lucrătoare, în funcție de bancă.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🎁 Ofertă specială pentru tine</h3>
            <p>Ca mulțumire pentru răbdare, primești <strong>15% reducere</strong> la următoarea comandă!</p>
            <p style="font-size: 16px; font-weight: bold; color: #92400e; text-align: center;">Cod: SORRY15</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Cumpără cu 15% reducere</a>
          </div>

          <p>Sperăm să îți oferim o experiență mai bună data viitoare!</p>

          <p>Cu apreciere,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "refund.amount",
        "refund.method",
        "refund.date",
        "refund.eta",
        "siteUrl",
      ],
      isActive: true,
    },

    {
      name: "Plată în Așteptare",
      slug: "payment-pending",
      category: "orders",
      subject: "Plata pentru comanda #{{order.number}} este în așteptare",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">Plată în Așteptare ⏳</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Plata pentru comanda ta #{{order.number}} este momentan în așteptare.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⏳ Status plată</h3>
            <p><strong>Status:</strong> În verificare</p>
            <p><strong>Metodă plată:</strong> {{payment.method}}</p>
            <p><strong>Sumă:</strong> {{order.total}} RON</p>
            <p><strong>Timp estimat:</strong> 5-15 minute</p>
          </div>

          <p>Vei primi o confirmare imediat ce plata este procesată. Între timp, poți continua să explorezi colecția noastră!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continuă cumpărăturile</a>
          </div>

          <p>Întrebări despre comandă? Suntem aici să te ajutăm.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "payment.method",
        "order.total",
        "siteUrl",
      ],
      isActive: true,
    },

    // ===== SHIPPING =====
    {
      name: "Actualizare Livrare",
      slug: "delivery-update",
      category: "shipping",
      subject: "Actualizare status livrare - comandă #{{order.number}} 📍",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Actualizare Livrare 📍</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Avem o actualizare pentru comanda ta #{{order.number}}:</p>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🚚 Status curent</h3>
            <p><strong>Status:</strong> {{delivery.status}}</p>
            <p><strong>Locație:</strong> {{delivery.location}}</p>
            <p><strong>Actualizare:</strong> {{delivery.update}}</p>
            <p><strong>Următorul pas:</strong> {{delivery.nextStep}}</p>
          </div>

          <p>Pentru a urmări comanda în timp real:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{trackingUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Vezi urmărirea completă</a>
          </div>

          <p>Jucăriile STEM sunt în drum spre tine! 🎉</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "delivery.status",
        "delivery.location",
        "delivery.update",
        "delivery.nextStep",
        "trackingUrl",
      ],
      isActive: true,
    },

    {
      name: "Informații Vamă",
      slug: "customs-clearance",
      category: "shipping",
      subject: "Comanda ta trece prin vamă - #{{order.number}} 🛃",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">Procesare Vamă 🛃</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Comanda ta #{{order.number}} a ajuns la vamă și este în procesare.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📋 Informații vamă</h3>
            <p><strong>Status:</strong> În procesare</p>
            <p><strong>Timp estimat:</strong> 3-7 zile lucrătoare</p>
            <p><strong>Taxe vamale:</strong> {{customs.fees}} RON (inclus în preț)</p>
            <p><strong>Documente:</strong> Verificare de rutină</p>
          </div>

          <p>Acesta este un proces standard pentru toate importurile. Nu sunt taxe suplimentare de plătit.</p>

          <p>Vei primi actualizări regulate despre statusul comenzii.</p>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">💡 Întrebări frecvente</h3>
            <ul style="color: #1e40af;">
              <li>Procesul de vamă este automat</li>
              <li>Nu sunt taxe suplimentare</li>
              <li>Livrarea continuă normal după verificare</li>
            </ul>
          </div>

          <p>Răbdare - jucăriile STEM merită așteptarea! 🚀</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["order.customerName", "order.number", "customs.fees"],
      isActive: true,
    },

    {
      name: "Livrare Eșuată",
      slug: "failed-delivery",
      category: "shipping",
      subject: "Încercare livrare eșuată - comandă #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Încercare Livrare Eșuată</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Din păcate, nu am putut livra comanda #{{order.number}} astăzi.</p>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">❌ Motiv eșec</h3>
            <p>{{delivery.failureReason}}</p>
            <p><strong>Data încercării:</strong> {{delivery.attemptDate}}</p>
            <p><strong>Următoarea încercare:</strong> {{delivery.nextAttempt}}</p>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🔄 Opțiuni disponibile</h3>
            <ul style="color: #1e40af;">
              <li><strong>Reprogramare livrare:</strong> Alege altă dată</li>
              <li><strong>Altă adresă:</strong> Specifică o adresă alternativă</li>
              <li><strong>Ridicare de la oficiu:</strong> Vino să ridici personal</li>
              <li><strong>Returnare:</strong> Anulare și rambursare</li>
            </ul>
          </div>

          <p>Te rugăm să ne contactezi pentru a alege cea mai bună opțiune:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{rescheduleUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">Reprogramează</a>
            <a href="tel:+40741248029" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">Sună-ne</a>
          </div>

          <p>Îți mulțumim pentru înțelegere!</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "delivery.failureReason",
        "delivery.attemptDate",
        "delivery.nextAttempt",
        "rescheduleUrl",
      ],
      isActive: true,
    },

    // ===== SUPPORT =====
    {
      name: "Recunoaștere Reclamație",
      slug: "complaint-acknowledgment",
      category: "support",
      subject: "Am primit reclamația ta - #{{ticket.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Reclamația Ta Este Importantă Pentru Noi</h1>

          <p>Bună {{customer.name}},</p>

          <p>Am primit reclamația ta și îți mulțumim că ne-ai adus la cunoștință această problemă.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Detalii reclamație</h3>
            <p><strong>Număr ticket:</strong> #{{ticket.number}}</p>
            <p><strong>Subiect:</strong> {{complaint.subject}}</p>
            <p><strong>Primit la:</strong> {{complaint.date}}</p>
            <p><strong>Prioritate:</strong> {{complaint.priority}}</p>
          </div>

          <p>Echipa noastră investighează deja problema și îți vom răspunde în maximum 24 de ore.</p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🎯 Ce se întâmplă acum</h3>
            <ul style="color: white;">
              <li>Analizăm reclamația ta în detaliu</li>
              <li>Contactăm echipa relevantă</li>
              <li>Căutăm cea mai bună soluție</li>
              <li>Te ținem la curent cu progresele</li>
            </ul>
          </div>

          <p>Pentru noi, satisfacția clienților este prioritatea numărul 1. Îți mulțumim pentru feedback!</p>

          <p>Cu respect,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "customer.name",
        "ticket.number",
        "complaint.subject",
        "complaint.date",
        "complaint.priority",
      ],
      isActive: true,
    },

    {
      name: "Cerere Feedback",
      slug: "feedback-request",
      category: "support",
      subject: "Cum putem îmbunătăți serviciile STEM Toys?",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Părerea Ta Contează! 💬</h1>

          <p>Bună {{customer.name}},</p>

          <p>Sperăm că ești mulțumit de experiența ta cu STEM Toys. Părerea ta ne ajută să ne îmbunătățim serviciile.</p>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📝 Ce ne poți spune despre:</h3>
            <ul style="color: #1e40af;">
              <li>Cum a fost experiența de cumpărare?</li>
              <li>Calitatea jucăriilor primite?</li>
              <li>Procesul de livrare?</li>
              <li>Serviciul clienți?</li>
              <li>Sugestii de îmbunătățire?</li>
            </ul>
          </div>

          <p>Completează chestionarul nostru scurt - durează doar 2 minute:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{feedbackUrl}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              📝 Completează Feedback-ul
            </a>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🎁 Mulțumire pentru timp</h3>
            <p>Ca mulțumire pentru feedback, primești <strong>5% reducere</strong> la următoarea comandă!</p>
            <p style="font-size: 16px; font-weight: bold; color: #92400e; text-align: center;">Cod: FEEDBACK5</p>
          </div>

          <p>Părerea ta ne ajută să oferim cele mai bune jucării STEM!</p>

          <p>Cu mulțumiri,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["customer.name", "feedbackUrl"],
      isActive: true,
    },

    // ===== MARKETING =====
    {
      name: "Reduceri Flash",
      slug: "flash-sale",
      category: "marketing",
      subject:
        "🚨 REDUCERI FLASH! {{sale.discount}} la toate jucăriile STEM - Doar {{sale.timeLeft}} ore!",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🚨 REDUCERI FLASH!</h1>
            <p style="margin: 10px 0; font-size: 20px;">{{sale.discount}} la TOATE jucăriile STEM</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Doar {{sale.timeLeft}} ore rămase!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #dc2626; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #dc2626; text-align: center;">⚡ Ofertă Limitată în Timp</h2>

            <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #dc2626; margin: 0; font-size: 28px;">{{sale.discount}}</h3>
              <p style="margin: 10px 0; font-size: 16px;">La toate jucăriile STEM</p>
              <p style="margin: 0; color: #dc2626; font-weight: bold;">⏰ Se termină în: {{sale.timeLeft}}</p>
            </div>

            <p style="font-size: 18px; text-align: center; margin: 20px 0;">
              🔥 Cele mai populare produse la preț redus:
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
              <div style="border: 2px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="font-weight: bold; margin: 0;">Robot Programabil</p>
                <p style="color: #dc2626; text-decoration: line-through;">299 RON</p>
                <p style="font-size: 18px; font-weight: bold; color: #10b981;">{{sale.price1}} RON</p>
              </div>
              <div style="border: 2px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="font-weight: bold; margin: 0;">Kit Chimie</p>
                <p style="color: #dc2626; text-decoration: line-through;">199 RON</p>
                <p style="font-size: 18px; font-weight: bold; color: #10b981;">{{sale.price2}} RON</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{sale.url}}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);">
                🛒 CUMPĂRĂ ACUM - {{sale.discount}}
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              *Oferta se termină automat. Stoc limitat!
            </p>
          </div>
        </div>
      `,
      variables: [
        "sale.discount",
        "sale.timeLeft",
        "sale.price1",
        "sale.price2",
        "sale.url",
      ],
      isActive: true,
    },

    {
      name: "Alertă Scădere Preț",
      slug: "price-drop-alert",
      category: "marketing",
      subject:
        "🔔 Prețul a scăzut pentru {{product.name}}! Economisește {{savings}} RON",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🔔 PREȚUL A SCĂZUT!</h1>
            <p style="margin: 10px 0; font-size: 20px;">{{product.name}}</p>
            <p style="margin: 0; font-size: 18px;">Economisești {{savings}} RON!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #10b981; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="{{product.image}}" alt="{{product.name}}" style="max-width: 200px; border-radius: 8px;">
            </div>

            <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="color: #059669; margin: 0; font-size: 24px;">{{product.name}}</h2>
              <p style="color: #dc2626; text-decoration: line-through; font-size: 18px; margin: 5px 0;">Preț vechi: {{product.oldPrice}} RON</p>
              <p style="font-size: 28px; font-weight: bold; color: #10b981; margin: 0;">Preț nou: {{product.newPrice}} RON</p>
              <p style="font-size: 16px; color: #059669; margin: 5px 0;">Economisești {{savings}} RON!</p>
            </div>

            <p style="font-size: 16px; text-align: center; margin: 20px 0;">
              {{product.description}}
            </p>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">
                ⏰ Ofertă limitată! Prețul poate crește în orice moment.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{product.url}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);">
                🛒 CUMPĂRĂ ACUM - {{savings}} RON ECONOMISIȚI
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              *Prețurile pot fi modificate. Verifică disponibilitatea.
            </p>
          </div>
        </div>
      `,
      variables: [
        "product.name",
        "savings",
        "product.image",
        "product.oldPrice",
        "product.newPrice",
        "product.description",
        "product.url",
      ],
      isActive: true,
    },

    {
      name: "Memento Coș Abandonat",
      slug: "abandoned-cart-reminder",
      category: "marketing",
      subject: "🛒 Nu uita! Ai articole în coșul tău STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">🛒 Coșul Tău Te Așteaptă!</h1>

          <p>Bună {{customer.name}},</p>

          <p>Am observat că ai adăugat niște jucării STEM minunate în coș, dar nu ai finalizat comanda.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📦 Articolele tale salvate</h3>
            <!-- Cart items would be dynamically inserted here -->
            <p style="font-style: italic;">Articolele tale preferate sunt încă disponibile!</p>
          </div>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 20px;">🎁 BONUS SPECIAL!</h3>
            <p style="margin: 10px 0; font-size: 16px;">Completează comanda acum și primești:</p>
            <ul style="color: white; text-align: left; display: inline-block;">
              <li>Livrare gratuită</li>
              <li>Cadou surpriză STEM</li>
              <li>Garanție extinsă</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{cart.url}}" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);">
              🔄 COMPLETEAZĂ COMANDA ACUM
            </a>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              ⏰ Coșul tău este salvat timp de 7 zile. Nu pierde jucăriile STEM preferate!
            </p>
          </div>

          <p style="text-align: center;">Îți mulțumim că ai ales STEM Toys! 🎉</p>

          <p>Cu entuziasm,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["customer.name", "cart.url"],
      isActive: true,
    },

    // ===== REVIEWS =====
    {
      name: "Sondaj Feedback",
      slug: "feedback-survey",
      category: "reviews",
      subject: "Ajută-ne să fim mai buni! Completează sondajul STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">💬 Părerea Ta Este Importantă!</h1>

          <p>Bună {{customer.name}},</p>

          <p>Sperăm că ai avut o experiență minunată cu jucăriile STEM Toys!</p>

          <p>Pentru a ne îmbunătăți continuu serviciile, te rugăm să completezi acest scurt sondaj:</p>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0;">📊 Sondaj Satisfacție Client</h3>
            <p style="color: #1e40af; margin-bottom: 20px;">Durează doar 1-2 minute!</p>

            <a href="{{survey.url}}" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              📝 Completează Sondajul
            </a>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🎁 Mulțumire pentru timpul acordat</h3>
            <p>Completează sondajul și primești <strong>10 puncte loialitate</strong> în contul tău!</p>
            <p style="font-size: 16px; font-weight: bold; color: #92400e; text-align: center;">Punctele pot fi folosite pentru reduceri!</p>
          </div>

          <p>Feedback-ul tău ne ajută să oferim cele mai bune jucării STEM din România!</p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="{{survey.url}}" style="color: #2563eb; text-decoration: underline;">Completează sondajul acum →</a>
          </div>

          <p>Cu mulțumiri,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["customer.name", "survey.url"],
      isActive: true,
    },

    {
      name: "Cerere Testimonial",
      slug: "testimonial-request",
      category: "reviews",
      subject: "Împărtășește experiența ta STEM Toys cu alți părinți! ⭐",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">⭐ Devino Ambasador STEM Toys!</h1>

          <p>Bună {{customer.name}},</p>

          <p>Sperăm că tu și copilul tău vă distrați minunat cu jucăriile STEM primite!</p>

          <p>Clienții noștri sunt cei mai buni ambasadori. Dacă îți place experiența, te rugăm să ne lași un testimonial:</p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Scrie-ne părerea ta!</h2>
            <p style="margin: 10px 0; font-size: 16px;">Ce ți-a plăcut cel mai mult?</p>
            <ul style="color: white; text-align: left; display: inline-block;">
              <li>Jucăriile primite</li>
              <li>Serviciul oferit</li>
              <li>Împachetarea</li>
              <li>Livrarea</li>
              <li>Suportul clienți</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{testimonial.url}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              ✍️ Scrie Testimonial-ul Tău
            </a>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🎁 Beneficii pentru tine</h3>
            <ul style="color: #1e40af;">
              <li><strong>Reducere 20%</strong> la următoarea comandă</li>
              <li><strong>Recunoaștere specială</strong> pe site-ul nostru</li>
              <li><strong>Acces prioritar</strong> la noi produse</li>
              <li><strong>Invitații exclusive</strong> la evenimente STEM</li>
            </ul>
          </div>

          <p>Testimonialele tale ajută alți părinți să descopere cele mai bune jucării STEM pentru copiii lor!</p>

          <p>Cu recunoștință,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["customer.name", "testimonial.url"],
      isActive: true,
    },

    // ===== LOYALTY =====
    {
      name: "Puncte Loialitate Câștigate",
      slug: "loyalty-points-earned",
      category: "loyalty",
      subject: "🎉 Ai câștigat {{points.amount}} puncte loialitate STEM Toys!",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 FELICITĂRI!</h1>
            <p style="margin: 10px 0; font-size: 24px;">Ai câștigat {{points.amount}} puncte!</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Continuă să acumulezi și economisești!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #f59e0b; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #d97706; text-align: center;">🏆 Programul Tău de Loialitate</h2>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #92400e; margin: 0; font-size: 24px;">{{points.amount}} PUNCTE NOI</h3>
              <p style="color: #92400e; margin: 10px 0;">Pentru: {{points.reason}}</p>
              <p style="color: #92400e; margin: 0;">Total puncte: {{points.total}}</p>
            </div>

            <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">💰 Cum poți folosi punctele</h3>
              <ul>
                <li><strong>100 puncte</strong> = 5 RON reducere</li>
                <li><strong>200 puncte</strong> = 10 RON reducere</li>
                <li><strong>500 puncte</strong> = 25 RON reducere</li>
                <li><strong>1000 puncte</strong> = 50 RON reducere</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; font-size: 18px;">🚀 Următorul nivel</h3>
              <p style="margin: 10px 0;">Mai ai nevoie de {{points.nextLevel}} puncte pentru {{points.nextReward}}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loyalty.url}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                📊 Vezi Contul de Loialitate
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Punctele expiră după 12 luni de inactivitate
            </p>
          </div>
        </div>
      `,
      variables: [
        "points.amount",
        "points.reason",
        "points.total",
        "points.nextLevel",
        "points.nextReward",
        "loyalty.url",
      ],
      isActive: true,
    },

    {
      name: "Upgrade VIP",
      slug: "vip-upgrade",
      category: "loyalty",
      subject: "🎊 FELICITĂRI! Ai devenit client VIP STEM Toys!",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎊 FELICITĂRI!</h1>
            <p style="margin: 10px 0; font-size: 24px;">Ești acum client VIP!</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Avantaje exclusive te așteaptă!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #f59e0b; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #d97706; text-align: center;">💎 Avantajele Tale VIP</h2>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #92400e; margin: 0; font-size: 20px;">🎁 Cadou de Bun Venit VIP</h3>
              <p style="color: #92400e; margin: 10px 0; font-size: 16px;">Primești automat:</p>
              <ul style="color: #92400e; text-align: left; display: inline-block;">
                <li>Reducere 15% la toate comenzile</li>
                <li>Livrare gratuită permanentă</li>
                <li>Acces prioritar la noi produse</li>
                <li>Suport clienți dedicat</li>
                <li>Cadou de ziua de naștere</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🏆 Status-ul Tău VIP</h3>
              <p>Comenzi în ultimul an: {{vip.orderCount}}</p>
              <p>Total cheltuit: {{vip.totalSpent}} RON</p>
              <p>Nivel de loialitate: {{vip.tier}}</p>
            </div>

            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🎯 Beneficii Exclusive VIP</h3>
              <ul style="color: #1e40af;">
                <li>🚚 Livrare gratuită la toate comenzile</li>
                <li>🎁 Reduceri suplimentare la sărbători</li>
                <li>⚡ Procesare prioritară a comenzilor</li>
                <li>📞 Linie telefonică dedicată</li>
                <li>🎉 Invitații la evenimente exclusive</li>
                <li>💝 Cadouri surpriză periodice</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{vip.dashboard}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                🏆 Accesează Panoul VIP
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Status-ul VIP se menține cu comenzi regulate. Îți mulțumim pentru loialitate!
            </p>
          </div>
        </div>
      `,
      variables: [
        "vip.orderCount",
        "vip.totalSpent",
        "vip.tier",
        "vip.dashboard",
      ],
      isActive: true,
    },

    {
      name: "Special Ziua de Naștere",
      slug: "birthday-special",
      category: "loyalty",
      subject:
        "🎂 La mulți ani! Cadou special de ziua de naștere de la STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎂 LA MULȚI ANI!</h1>
            <p style="margin: 10px 0; font-size: 20px;">{{customer.name}}</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Cadou special de ziua de naștere!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #ec4899; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #be185d; text-align: center;">🎉 Cadoul Tău de Ziua de Naștere</h2>

            <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border: 2px solid #ec4899; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #be185d; margin: 0; font-size: 24px;">🎁 REDUCERE SPECIALĂ</h3>
              <p style="color: #be185d; margin: 10px 0; font-size: 16px;">Pentru ziua ta:</p>
              <p style="font-size: 32px; font-weight: bold; color: #ec4899; margin: 0;">30% REDUCERE</p>
              <p style="color: #be185d; margin: 5px 0;">La întreaga colecție STEM Toys</p>
              <p style="font-size: 16px; font-weight: bold; color: #be185d; margin: 10px 0;">Cod: ZIUADEANSTEREA{{currentYear}}</p>
            </div>

            <p style="font-size: 16px; text-align: center; margin: 20px 0;">
              Sperăm că ziua ta de naștere este plină de descoperiri STEM și distracție!
            </p>

            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">💡 Recomandări pentru ziua de naștere</h3>
              <ul style="color: #1e40af;">
                <li>Jucării STEM creative pentru copii</li>
                <li>Kit-uri științifice distractive</li>
                <li>Jocuri de logică și puzzle-uri</li>
                <li>Seturi de experimente sigure</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{birthday.url}}" style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);">
                🎂 Vezi Cadourile de Ziua de Naștere
              </a>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">
                ⏰ Reducerea este valabilă timp de 7 zile de la ziua de naștere
              </p>
            </div>

            <p style="text-align: center;">La mulți ani! Să ai o zi minunată plină de bucurie și descoperiri! 🎈</p>

            <p style="text-align: center; color: #6b7280; font-style: italic;">
              Mulțumim că faci parte din familia STEM Toys!
            </p>
          </div>
        </div>
      `,
      variables: ["customer.name", "currentYear", "birthday.url"],
      isActive: true,
    },

    {
      name: "Upgrade Nivel Loialitate",
      slug: "loyalty-tier-upgrade",
      category: "loyalty",
      subject:
        "🎊 Ai avansat la nivelul {{tier.newLevel}} în programul de loialitate STEM Toys!",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎊 FELICITĂRI!</h1>
            <p style="margin: 10px 0; font-size: 24px;">Ai avansat la {{tier.newLevel}}!</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Noi avantaje te așteaptă!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #8b5cf6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #7c3aed; text-align: center;">🏆 Nivel Nou de Loialitate</h2>

            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 2px solid #8b5cf6; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #7c3aed; margin: 0; font-size: 24px;">{{tier.newLevel}}</h3>
              <p style="color: #7c3aed; margin: 10px 0;">De la {{tier.oldLevel}} la {{tier.newLevel}}</p>
              <p style="color: #7c3aed; margin: 0; font-weight: bold;">Felicitări pentru realizare!</p>
            </div>

            <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🎁 Noile Tale Avantaje</h3>
              <ul>
                <li><strong>Reducere suplimentară:</strong> {{tier.discount}}%</li>
                <li><strong>Livrare:</strong> {{tier.shipping}}</li>
                <li><strong>Cadouri:</strong> {{tier.gifts}}</li>
                <li><strong>Suport:</strong> {{tier.support}}</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; font-size: 18px;">🎊 Cadou de Avansare</h3>
              <p style="margin: 10px 0;">Primești automat {{tier.bonusPoints}} puncte bonus!</p>
              <p style="margin: 0; font-weight: bold;">Total puncte acum: {{tier.totalPoints}}</p>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">📊 Statisticile Tale</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center;">
                  <p style="font-size: 24px; font-weight: bold; color: #92400e; margin: 0;">{{stats.orders}}</p>
                  <p style="color: #92400e; margin: 5px 0;">Comenzi</p>
                </div>
                <div style="text-align: center;">
                  <p style="font-size: 24px; font-weight: bold; color: #92400e; margin: 0;">{{stats.spent}} RON</p>
                  <p style="color: #92400e; margin: 5px 0;">Cheltuit</p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{tier.dashboard}}" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                🏆 Vezi Dashboard-ul VIP
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Continuă să cumperi și descoperă noi niveluri de avantaje!
            </p>
          </div>
        </div>
      `,
      variables: [
        "tier.newLevel",
        "tier.oldLevel",
        "tier.discount",
        "tier.shipping",
        "tier.gifts",
        "tier.support",
        "tier.bonusPoints",
        "tier.totalPoints",
        "stats.orders",
        "stats.spent",
        "tier.dashboard",
      ],
      isActive: true,
    },

    // ===== RETURNS =====
    {
      name: "Returnare Respinsă",
      slug: "return-rejected",
      category: "returns",
      subject: "Cererea de returnare #{{return.number}} nu poate fi aprobată",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Returnare Neaprobată</h1>

          <p>Bună {{customer.name}},</p>

          <p>După analizarea cererii tale de returnare #{{return.number}}, din păcate nu putem aproba returnarea.</p>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">❌ Motiv respingere</h3>
            <p>{{return.reason}}</p>
            <p><strong>Conform politicii noastre:</strong> {{return.policy}}</p>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔄 Opțiuni alternative</h3>
            <ul>
              <li><strong>Reparare:</strong> Putem repara produsul gratuit</li>
              <li><strong>Înlocuire:</strong> Schimb cu un produs similar</li>
              <li><strong>Cupon reducere:</strong> Pentru următoarea comandă</li>
              <li><strong>Contact suport:</strong> Discutăm soluții personalizate</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:+40741248029" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">Sună-ne</a>
            <a href="mailto:support@techtots.ro" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">Trimite Email</a>
          </div>

          <p>Îți mulțumim pentru înțelegere. Dorim să găsim cea mai bună soluție pentru tine.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "customer.name",
        "return.number",
        "return.reason",
        "return.policy",
      ],
      isActive: true,
    },

    {
      name: "Returnare Expediată",
      slug: "return-shipped",
      category: "returns",
      subject: "Returnarea #{{return.number}} a fost expediată către STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Returnare Expediată ✅</h1>

          <p>Bună {{customer.name}},</p>

          <p>Am primit confirmarea că pachetul de returnare #{{return.number}} a fost expediat către noi.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📦 Detalii expediere</h3>
            <p><strong>Curier:</strong> {{return.carrier}}</p>
            <p><strong>AWB Returnare:</strong> {{return.trackingNumber}}</p>
            <p><strong>Data expediere:</strong> {{return.shipDate}}</p>
            <p><strong>Timp estimat sosire:</strong> {{return.deliveryEstimate}}</p>
          </div>

          <p>Poți urmări pachetul folosind link-ul de mai jos:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{return.trackingUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Urmărește Pachetul</a>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">⏱️ Următorii pași</h3>
            <ol>
              <li>Pachetul ajunge la depozitul nostru (2-3 zile)</li>
              <li>Inspectăm produsul pentru conformitate</li>
              <li>Procesăm rambursarea (3-5 zile lucrătoare)</li>
              <li>Primești confirmarea prin email</li>
            </ol>
          </div>

          <p>Dacă ai întrebări despre procesul de returnare, nu ezita să ne contactezi.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "customer.name",
        "return.number",
        "return.carrier",
        "return.trackingNumber",
        "return.shipDate",
        "return.deliveryEstimate",
        "return.trackingUrl",
      ],
      isActive: true,
    },

    {
      name: "Confirmare Schimb",
      slug: "exchange-confirmation",
      category: "returns",
      subject: "Confirmare schimb produs - comandă #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Schimb Confirmat ✅</h1>

          <p>Bună {{customer.name}},</p>

          <p>Schimbul pentru comanda #{{order.number}} a fost procesat cu succes!</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">🔄 Detalii schimb</h3>
            <p><strong>Produs returnat:</strong> {{exchange.returnedProduct}}</p>
            <p><strong>Produs nou:</strong> {{exchange.newProduct}}</p>
            <p><strong>Valoare diferență:</strong> {{exchange.priceDifference}} RON</p>
            <p><strong>Status:</strong> Procesat și expediat</p>
          </div>

          <p>Produsul nou va fi expediat în maximum 24 de ore. Vei primi un email separat cu detaliile de livrare.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">💰 Diferență de preț</h3>
            <p>{{exchange.priceMessage}}</p>
            <p style="font-weight: bold; color: #92400e;">{{exchange.paymentInstructions}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{exchange.trackingUrl}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Urmărește Schimbul</a>
          </div>

          <p>Sperăm că noul produs îți va plăcea mai mult! Dacă nu, poți solicita o altă returnare.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "customer.name",
        "order.number",
        "exchange.returnedProduct",
        "exchange.newProduct",
        "exchange.priceDifference",
        "exchange.priceMessage",
        "exchange.paymentInstructions",
        "exchange.trackingUrl",
      ],
      isActive: true,
    },

    {
      name: "Rambursare Procesată",
      slug: "refund-processed",
      category: "returns",
      subject: "Rambursare procesată pentru returnarea #{{return.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Rambursare Procesată! 💰</h1>

          <p>Bună {{customer.name}},</p>

          <p>Rambursarea pentru returnarea #{{return.number}} a fost procesată cu succes.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">💳 Detalii rambursare</h3>
            <p><strong>Sumă rambursată:</strong> {{refund.amount}} RON</p>
            <p><strong>Metodă rambursare:</strong> {{refund.method}}</p>
            <p><strong>Procesată la:</strong> {{refund.date}}</p>
            <p><strong>Timp până la apariția în cont:</strong> {{refund.eta}}</p>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Sumar returnare</h3>
            <p><strong>Produs returnat:</strong> {{return.product}}</p>
            <p><strong>Motiv returnare:</strong> {{return.reason}}</p>
            <p><strong>Stare produs:</strong> {{return.condition}}</p>
            <p><strong>Taxe returnare:</strong> {{return.fees}} RON</p>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 18px;">🎁 Mulțumire pentru feedback</h3>
            <p style="margin: 10px 0;">Ca mulțumire pentru returnare, primești:</p>
            <ul style="color: white; text-align: left; display: inline-block;">
              <li>Cod reducere 10% pentru următoarea comandă</li>
              <li>Prioritate la suportul clienți</li>
              <li>Invitație să testezi produse noi</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}/products" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continuă Cumpărăturile</a>
          </div>

          <p>Sperăm să avem ocazia să-ți oferim o experiență mai bună data viitoare!</p>

          <p>Cu apreciere,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: [
        "customer.name",
        "return.number",
        "refund.amount",
        "refund.method",
        "refund.date",
        "refund.eta",
        "return.product",
        "return.reason",
        "return.condition",
        "return.fees",
        "siteUrl",
      ],
      isActive: true,
    },

    // ===== LEGAL =====
    {
      name: "Update Politică Confidențialitate",
      slug: "privacy-policy-update",
      category: "legal",
      subject: "Actualizare politică de confidențialitate - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Actualizare Politică Confidențialitate</h1>

          <p>Bună {{user.name}},</p>

          <p>Am actualizat politica noastră de confidențialitate pentru a fi mai transparenți și pentru a proteja mai bine datele tale.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔒 Principalele modificări</h3>
            <ul>
              <li>Mai multă transparență în colectarea datelor</li>
              <li>Drepturi extinse privind datele personale</li>
              <li>Îmbunătățiri în securitatea datelor</li>
              <li>Clarificări privind utilizarea cookie-urilor</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⚖️ Drepturile tale</h3>
            <p style="color: #92400e;">Conform GDPR, ai dreptul la:</p>
            <ul style="color: #92400e;">
              <li>Acces la datele tale personale</li>
              <li>Rectificare a datelor inexacte</li>
              <li>Ștergere a datelor ("dreptul de a fi uitat")</li>
              <li>Portabilitatea datelor</li>
              <li>Opunere la prelucrarea datelor</li>
            </ul>
          </div>

          <p>Poți citi politica completă actualizată aici:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{privacyUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Citește Politica Actualizată</a>
          </div>

          <p>Continuând să folosești serviciile noastre, accepți noile condiții. Dacă ai întrebări, contactează-ne.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "privacyUrl"],
      isActive: true,
    },

    {
      name: "Update Termeni și Condiții",
      slug: "terms-update",
      category: "legal",
      subject: "Actualizare termeni și condiții - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Actualizare Termeni și Condiții</h1>

          <p>Bună {{user.name}},</p>

          <p>Am actualizat termenii și condițiile noastre pentru a reflecta îmbunătățirile aduse serviciilor noastre.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Principalele modificări</h3>
            <ul>
              <li>Clarificări privind livrarea și returnările</li>
              <li>Îmbunătățiri în politica de rambursare</li>
              <li>Actualizări privind protecția consumatorului</li>
              <li>Precizări privind drepturile și obligațiile</li>
            </ul>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">⚖️ Drepturile tale</h3>
            <ul style="color: #1e40af;">
              <li>Dreptul la livrare în termen</li>
              <li>Dreptul la returnare în 14 zile</li>
              <li>Dreptul la rambursare</li>
              <li>Dreptul la service și reparații</li>
              <li>Dreptul la informații corecte</li>
            </ul>
          </div>

          <p>Poți citi termenii complet actualizați aici:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{termsUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Citește Termenii Actualizați</a>
          </div>

          <p>Utilizând în continuare serviciile noastre, accepți noile condiții. Dacă nu ești de acord, te rugăm să ne contactezi.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "termsUrl"],
      isActive: true,
    },

    {
      name: "Cerere Consimțământ GDPR",
      slug: "gdpr-consent-request",
      category: "legal",
      subject: "Confirmare consimțământ prelucrare date - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Confirmare Consimțământ GDPR</h1>

          <p>Bună {{user.name}},</p>

          <p>Conform Regulamentului General privind Protecția Datelor (GDPR), solicităm confirmarea consimțământului tău pentru prelucrarea datelor personale.</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Datele pe care le prelucrăm</h3>
            <ul>
              <li>Informații de contact (nume, email, telefon)</li>
              <li>Adresă de livrare și facturare</li>
              <li>Istoricul comenzilor și preferințelor</li>
              <li>Date de utilizare a website-ului</li>
            </ul>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🎯 Scopul prelucrării</h3>
            <ul style="color: #1e40af;">
              <li>Procesarea comenzilor și livrărilor</li>
              <li>Comunicări comerciale și marketing</li>
              <li>Îmbunătățirea serviciilor</li>
              <li>Conformitatea legală</li>
            </ul>
          </div>

          <p>Poți să-ți retragi consimțământul în orice moment sau să soliciți ștergerea datelor.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{consentUrl}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px;">Confirm Consimțământul</a>
            <a href="{{withdrawUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px;">Retrage Consimțământul</a>
          </div>

          <p>Pentru mai multe detalii despre drepturile tale GDPR:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{gdprInfoUrl}}" style="color: #2563eb; text-decoration: underline;">Citește despre drepturile GDPR</a>
          </div>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "consentUrl", "withdrawUrl", "gdprInfoUrl"],
      isActive: true,
    },

    {
      name: "Export Date Gata",
      slug: "data-export-ready",
      category: "legal",
      subject: "Datele tale personale sunt gata pentru descărcare - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Export Date Gata ✅</h1>

          <p>Bună {{user.name}},</p>

          <p>Conform dreptului tău la portabilitatea datelor (GDPR), exportul datelor tale personale este acum gata pentru descărcare.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📦 Ce include exportul</h3>
            <ul style="color: #059669;">
              <li>Informații personale și de contact</li>
              <li>Istoricul complet al comenzilor</li>
              <li>Adrese de livrare și facturare</li>
              <li>Preferințe și setări de cont</li>
              <li>Istoric interacțiuni și recenzii</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Link securizat</h3>
            <p style="color: #92400e;">Link-ul de descărcare este valabil timp de 7 zile și poate fi folosit o singură dată.</p>
            <p style="color: #92400e;"><strong>Data expirare:</strong> {{export.expiryDate}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{export.downloadUrl}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);">
              📥 Descarcă Datele Mele
            </a>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔒 Securitatea datelor</h3>
            <p>Fișierul este criptat și protejat cu parolă. Vei primi parola într-un email separat pentru securitate maximă.</p>
          </div>

          <p>Dacă întâmpini probleme cu descărcarea, contactează-ne și vom retrimite link-ul.</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "export.expiryDate", "export.downloadUrl"],
      isActive: true,
    },

    // ===== ADMIN =====
    {
      name: "Admin - Plată Eșuată",
      slug: "admin-payment-failed",
      category: "admin",
      subject: "🚨 ALERTĂ: Plată eșuată pentru comanda #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">🚨 PLATĂ EȘUATĂ</h1>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Comanda #{{order.number}}</h2>
            <p><strong>Client:</strong> {{order.customerName}} ({{order.customerEmail}})</p>
            <p><strong>Sumă:</strong> {{order.total}} RON</p>
            <p><strong>Metodă plată:</strong> {{payment.method}}</p>
            <p><strong>Eroare:</strong> {{payment.error}}</p>
            <p><strong>Data:</strong> {{payment.date}}</p>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔍 Acțiuni necesare</h3>
            <ul>
              <li>Contactează clientul pentru verificare metodă plată</li>
              <li>Verifică statusul tranzacției în gateway-ul de plată</li>
              <li>Actualizează statusul comenzii în sistem</li>
              <li>Monitorizează pentru noi încercări de plată</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vezi Comanda în Admin</a>
          </div>

          <p>URGENT: Necesită intervenție imediată pentru a evita pierderea vânzării.</p>
        </div>
      `,
      variables: [
        "order.number",
        "order.customerName",
        "order.customerEmail",
        "order.total",
        "payment.method",
        "payment.error",
        "payment.date",
        "adminUrl",
      ],
      isActive: true,
    },

    {
      name: "Admin - Cerere Returnare",
      slug: "admin-return-request",
      category: "admin",
      subject: "📦 Cerere nouă de returnare #{{return.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">📦 CERERE RETURNare</h1>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Returnare #{{return.number}}</h2>
            <p><strong>Client:</strong> {{customer.name}} ({{customer.email}})</p>
            <p><strong>Comandă originală:</strong> #{{order.number}}</p>
            <p><strong>Produs:</strong> {{return.product}}</p>
            <p><strong>Motiv:</strong> {{return.reason}}</p>
            <p><strong>Sumă de returnat:</strong> {{return.amount}} RON</p>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Proces returnare</h3>
            <ul>
              <li>Verifică conformitatea cu politica de returnare</li>
              <li>Inspectează starea produsului returnat</li>
              <li>Aprobă sau respinge cererea</li>
              <li>Procesează rambursarea dacă este cazul</li>
              <li>Actualizează inventarul</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminUrl}}" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Procesează Returnarea</a>
          </div>

          <p>IMPORTANT: Returnările trebuie procesate în maximum 48 de ore conform politicii companiei.</p>
        </div>
      `,
      variables: [
        "return.number",
        "customer.name",
        "customer.email",
        "order.number",
        "return.product",
        "return.reason",
        "return.amount",
        "adminUrl",
      ],
      isActive: true,
    },

    {
      name: "Admin - Stoc Scăzut",
      slug: "admin-low-stock",
      category: "admin",
      subject:
        "⚠️ ALERTĂ STOC: {{product.name}} - Doar {{stock.quantity}} bucăți rămase",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">⚠️ STOC SCĂZUT</h1>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Alertă Inventar</h2>
            <p><strong>Produs:</strong> {{product.name}}</p>
            <p><strong>SKU:</strong> {{product.sku}}</p>
            <p><strong>Stoc actual:</strong> {{stock.quantity}} bucăți</p>
            <p><strong>Stoc minim:</strong> {{stock.minimum}} bucăți</p>
            <p><strong>Categorie:</strong> {{product.category}}</p>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🚨 Acțiuni recomandate</h3>
            <ul>
              <li>Contactează furnizorul pentru reaprovizionare</li>
              <li>Verifică comenzile în așteptare</li>
              <li>Actualizează statusul produsului pe website</li>
              <li>Monitorizează vânzările pentru următoarele 24 ore</li>
              <li>Consideră promovarea produselor alternative</li>
            </ul>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📊 Statistici produs</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="font-weight: bold; color: #1e40af; margin: 0;">{{sales.lastWeek}}</p>
                <p style="color: #1e40af; margin: 5px 0;">Vândute săptămâna trecută</p>
              </div>
              <div>
                <p style="font-weight: bold; color: #1e40af; margin: 0;">{{sales.lastMonth}}</p>
                <p style="color: #1e40af; margin: 5px 0;">Vândute luna trecută</p>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Gestionare Inventar</a>
          </div>

          <p>CRITIC: Acest produs riscă să fie indisponibil. Acționează imediat!</p>
        </div>
      `,
      variables: [
        "product.name",
        "product.sku",
        "stock.quantity",
        "stock.minimum",
        "product.category",
        "sales.lastWeek",
        "sales.lastMonth",
        "adminUrl",
      ],
      isActive: true,
    },

    // ===== SEASONAL =====
    {
      name: "Paște Special",
      slug: "easter-offer",
      category: "seasonal",
      subject: "🐣 Paște fericit! Oferte speciale pentru familie - STEM Toys",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🐣 PAȘTE FERICIT!</h1>
            <p style="margin: 10px 0; font-size: 20px;">Sărbători pline de descoperiri STEM</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Pentru toată familia</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #fbbf24; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #d97706; text-align: center;">🎨 Oferte de Paște</h2>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #92400e; margin: 0; font-size: 24px;">🎁 PAȘTELE COPIILOR</h3>
              <p style="color: #92400e; margin: 10px 0; font-size: 16px;">Reduceri speciale pentru jocuri educaționale</p>
              <ul style="color: #92400e; text-align: left; display: inline-block;">
                <li>Seturi de experimente științifice</li>
                <li>Jocuri de logică și puzzle-uri</li>
                <li>Kituri de grădinărit educative</li>
                <li>Cărți interactive STEM</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; font-size: 20px;">👨‍👩‍👧‍👦 Oferte pentru Familie</h3>
              <p style="margin: 10px 0;">Pachete speciale pentru activități în familie:</p>
              <ul style="color: white; text-align: left; display: inline-block;">
                <li>Reduceri până la 25%</li>
                <li>Livrare gratuită</li>
                <li>Cadou surpriză în fiecare pachet</li>
                <li>Ghiduri de activități pentru sărbători</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{easterUrl}}" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);">
                🐣 Vezi Ofertele de Paște
              </a>
            </div>

            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">💡 Idei de cadouri de Paște</h3>
              <ul style="color: #1e40af;">
                <li>Jucării STEM pentru copii curioși</li>
                <li>Seturi științifice pentru familii</li>
                <li>Cărți educaționale interactive</li>
                <li>Jocuri de echipă și cooperare</li>
              </ul>
            </div>

            <p style="text-align: center; color: #6b7280; font-style: italic;">
              Paște fericit! Să fie sărbători pline de bucurie, învățare și distracție! 🎉
            </p>
          </div>
        </div>
      `,
      variables: ["easterUrl"],
      isActive: true,
    },

    {
      name: "Înapoi la Școală",
      slug: "back-to-school",
      category: "seasonal",
      subject:
        "📚 Înapoi la școală! Pregătește-te cu STEM Toys pentru un an școlar extraordinar",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">📚 ÎNAPOI LA ȘCOALĂ!</h1>
            <p style="margin: 10px 0; font-size: 20px;">Învață STEM prin joacă</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Pregătește-te pentru anul școlar!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #3b82f6; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e40af; text-align: center;">🎓 Oferte Înapoi la Școală</h2>

            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #1e40af; margin: 0; font-size: 24px;">📖 PREGĂTIRE ȘCOLARĂ STEM</h3>
              <p style="color: #1e40af; margin: 10px 0; font-size: 16px;">Tot ce ai nevoie pentru succesul școlar</p>
              <ul style="color: #1e40af; text-align: left; display: inline-block;">
                <li>Seturi de matematică interactivă</li>
                <li>Kituri științifice pentru experimente</li>
                <li>Roboți de programare educațională</li>
                <li>Jocuri de logică și strategie</li>
                <li>Cărți STEM ilustrate</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 18px;">🎒 Pachete Școlare Complete</h3>
              <ul style="color: white; text-align: left; display: inline-block;">
                <li>Reduceri până la 30% la pachete</li>
                <li>Livrare gratuită în toată țara</li>
                <li>Bonus: Ghid de activități școlare</li>
                <li>Garanție prelungită</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">💡 De ce STEM Toys pentru școală?</h3>
              <ul style="color: #92400e;">
                <li>Învățare distractivă și interactivă</li>
                <li>Dezvoltare abilități critice</li>
                <li>Pregătire pentru viitorul digital</li>
                <li>Îmbunătățirea performanțelor școlare</li>
                <li>Stimularea creativității și inovației</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{backToSchoolUrl}}" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);">
                📚 Vezi Ofertele Școlare
              </a>
            </div>

            <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🏆 Succes Școlar Garantat</h3>
              <p>Copiii care folosesc jucării STEM au performanțe școlare cu până la 25% mai bune în disciplinele STEM.</p>
              <p style="font-weight: bold; color: #1e40af;">Investește în viitorul educațional al copilului tău!</p>
            </div>

            <p style="text-align: center; color: #6b7280; font-style: italic;">
              An școlar extraordinar începe cu pregătirea potrivită! 🌟
            </p>
          </div>
        </div>
      `,
      variables: ["backToSchoolUrl"],
      isActive: true,
    },

    {
      name: "Fathers Day Special",
      slug: "fathers-day",
      category: "seasonal",
      subject:
        "👨 Ziua Tatălui - Cadouri STEM speciale pentru tatii extraordinari",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">👨 ZIUA TATĂLUI!</h1>
            <p style="margin: 10px 0; font-size: 20px;">Cadouri STEM pentru Tata</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Descoperiri și aventuri împreună</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #059669; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #047857; text-align: center;">🎁 Cadouri pentru Tatăl Perfect</h2>

            <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #059669; margin: 0; font-size: 24px;">👨‍👧‍👦 STEM ÎMPREUNĂ</h3>
              <p style="color: #059669; margin: 10px 0; font-size: 16px;">Cadouri pentru activități tată-copil</p>
              <ul style="color: #059669; text-align: left; display: inline-block;">
                <li>Seturi științifice pentru experimente</li>
                <li>Kituri de construcție și inginerie</li>
                <li>Proiecte de programare împreună</li>
                <li>Jocuri de strategie și logică</li>
                <li>Instrumente pentru proiecte DIY</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 18px;">🎯 De ce STEM pentru tați?</h3>
              <ul style="color: white; text-align: left; display: inline-block;">
                <li>Împărtășirea cunoștințelor cu copiii</li>
                <li>Dezvoltarea relației părinte-copil</li>
                <li>Învățare continuă și curiozitate</li>
                <li>Activități calitative în familie</li>
                <li>Moștenirea valorilor educaționale</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">💝 Oferte Speciale Ziua Tatălui</h3>
              <ul style="color: #92400e;">
                <li>Reduceri până la 25% la pachetele familie</li>
                <li>Livrare gratuită pentru comenzi peste 300 RON</li>
                <li>Cadou surpriză pentru fiecare tată</li>
                <li>Ghid special "STEM cu copiii"</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{fathersDayUrl}}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);">
                👨 Vezi Cadourile pentru Tată
              </a>
            </div>

            <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">💡 Recomandări populare</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px;">
                  <p style="font-weight: bold; margin: 0;">Kit Robotic Avansat</p>
                  <p style="color: #059669; font-weight: bold;">Perfect pentru proiecte împreună</p>
                </div>
                <div style="text-align: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px;">
                  <p style="font-weight: bold; margin: 0;">Laborator Științific</p>
                  <p style="color: #059669; font-weight: bold;">Experiențe de neuitat</p>
                </div>
              </div>
            </div>

            <p style="text-align: center; color: #6b7280; font-style: italic;">
              Fă din Ziua Tatălui o sărbătoare a învățării și descoperirilor! 🌟
            </p>
          </div>
        </div>
      `,
      variables: ["fathersDayUrl"],
      isActive: true,
    },

    {
      name: "Valentine Special",
      slug: "valentine-special",
      category: "seasonal",
      subject: "💕 Ziua Îndrăgostiților - Cadouri STEM pentru cei dragi",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">💕 ZIUA ÎNDRĂGOSTIȚILOR</h1>
            <p style="margin: 10px 0; font-size: 20px;">Iubire prin descoperiri STEM</p>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Cadouri care apropie și educă</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #ec4899; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #be185d; text-align: center;">💝 Cadouri STEM Îndrăgostite</h2>

            <div style="background: #fdf2f8; border: 2px solid #ec4899; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #be185d; margin: 0; font-size: 24px;">❤️ STEM ÎMPREUNĂ</h3>
              <p style="color: #be185d; margin: 10px 0; font-size: 16px;">Cadouri pentru cupluri și familii</p>
              <ul style="color: #be185d; text-align: left; display: inline-block;">
                <li>Kituri de experimente pentru îndrăgostiți</li>
                <li>Proiecte științifice romantice</li>
                <li>Jocuri de echipă și cooperare</li>
                <li>Seturi pentru activități creative</li>
                <li>Cărți STEM pentru iubitori de știință</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 18px;">🎁 Oferte Speciale Valentine</h3>
              <ul style="color: white; text-align: left; display: inline-block;">
                <li>Pachete speciale pentru îndrăgostiți</li>
                <li>Reduceri până la 20% la seturi familie</li>
                <li>Cadou gratuit cu fiecare comandă</li>
                <li>Livrare gratuită cu mesaj romantic</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">💡 De ce STEM pentru Valentine?</h3>
              <ul style="color: #92400e;">
                <li>Împărtășirea pasiunii pentru știință</li>
                <li>Activități distractive împreună</li>
                <li>Crearea de amintiri unice</li>
                <li>Dezvoltarea conexiunii emoționale</li>
                <li>Cadouri cu semnificație profundă</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{valentineUrl}}" style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);">
                💕 Vezi Cadourile Valentine
              </a>
            </div>

            <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🎯 Recomandări populare</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px;">
                  <p style="font-weight: bold; margin: 0;">Set Experimente Chimice</p>
                  <p style="color: #ec4899; font-weight: bold;">Reacții romantice</p>
                </div>
                <div style="text-align: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px;">
                  <p style="font-weight: bold; margin: 0;">Kit Robotic Împerecheat</p>
                  <p style="color: #ec4899; font-weight: bold;">Programare împreună</p>
                </div>
              </div>
            </div>

            <p style="text-align: center; color: #6b7280; font-style: italic;">
              Arată iubirea prin cadouri care inspiră și educă! 💕
            </p>
          </div>
        </div>
      `,
      variables: ["valentineUrl"],
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const templateData of remainingTemplates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: templateData.slug },
      });

      if (existing) {
        console.log(`⏭️  Șablon existent: ${templateData.name}`);
        skippedCount++;
        continue;
      }

      await prisma.emailTemplate.create({
        data: {
          ...templateData,
          createdBy: "system",
        },
      });

      console.log(`✅ Șablon creat: ${templateData.name}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Eroare creare șablon ${templateData.slug}:`, error);
    }
  }

  console.log(`\n🎉 Creare șabloane rămase completată!`);
  console.log(`   • Create: ${createdCount} șabloane`);
  console.log(`   • Omise: ${skippedCount} existente`);
  console.log(
    `   • Total șabloane în DB: ${await prisma.emailTemplate.count()}`
  );

  // Final comprehensive summary
  console.log(`\n📊 SISTEM COMPLET - STEM TOYS EMAIL SYSTEM:`);

  const finalTemplates = await prisma.emailTemplate.findMany({
    select: { category: true },
  });

  const finalStats = finalTemplates.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(finalStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} șabloane`);
    });

  console.log(`\n✨ SISTEMUL ESTE ACUM 100% COMPLET ȘI PROFESIONAL!`);
  console.log(`   • Total șabloane: ${finalTemplates.length}`);
  console.log(`   • Limbă: Română`);
  console.log(`   • Focus: Creșterea veniturilor și retenția clienților`);
  console.log(`   • Automatizare: Completă și activă`);
  console.log(`   • Marketing: Optimizat pentru conversii`);
}

createAllRemainingTemplates()
  .catch(console.error)
  .finally(() => process.exit(0));
