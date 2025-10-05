import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createEmailTemplates() {
  console.log(
    "📧 Crearea șabloanelor de email pentru declanșatoare automate...\n"
  );

  const templates = [
    // ===== ȘABLOANE BUN VENIT & ÎNREGISTRARE =====
    {
      name: "Bun Venit Utilizator Nou",
      slug: "welcome-new-user",
      category: "Welcome",
      subject: "Bun venit la STEM Toys! 🚀 Aventura ta de învățare începe",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Bun venit la STEM Toys! 🎉</h1>

          <p>Dragă {{user.name}},</p>

          <p>Îți mulțumim că te-ai alăturat familiei STEM Toys! Suntem încântați să te ajutăm să descoperi lumea fascinantă a Științei, Tehnologiei, Ingineriei și Matematicii prin joacă.</p>

          <p>Iată ce poți aștepta:</p>
          <ul>
            <li>✨ Jucării educaționale care fac învățarea distractivă</li>
            <li>🎯 Activități STEM pentru toate vârstele</li>
            <li>🚀 Oferte exclusive și acces anticipat</li>
            <li>💡 Sfaturi de la experți și resurse de învățare</li>
          </ul>

          <p>Gata să începi călătoria STEM? <a href="{{storeUrl}}/products" style="color: #2563eb; font-weight: bold;">Explorează produsele noastre noi</a></p>

          <p>Bine ai venit la bord!<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Seria Bun Venit - Ziua 3",
      slug: "welcome-series-day3",
      category: "Welcome",
      subject: "Primele tale idei de activități STEM ✨",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Ziua 3: Călătoria ta de învățare STEM</h2>

          <p>Salut {{user.name}},</p>

          <p>Sperăm că îți place să explorezi STEM Toys! Iată câteva idei distractive de activități pe care să le încerci cu familia ta:</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🔬 Experiențe științifice simple</h3>
            <ul>
              <li>Crează o lampă de lavă acasă</li>
              <li>Construiește un vulcan cu bicarbonat și oțet</li>
              <li>Explorează magneții și proprietățile lor</li>
            </ul>
          </div>

          <p>Ai nevoie de materiale? <a href="{{storeUrl}}/categories/science" style="color: #2563eb;">Vezi kiturile noastre științifice</a></p>

          <p>Care este activitatea STEM favorită a familiei tale?<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Seria Bun Venit - Ziua 7",
      slug: "welcome-series-day7",
      category: "Welcome",
      subject: "Jucăriile STEM populare care vor încânta copiii tăi 🎓",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Jucării STEM populare pentru minți curioase</h2>

          <p>Bună {{user.name}},</p>

          <p>Bazat pe ceea ce le place altor familii, iată câteva dintre jucăriile noastre STEM cele mai populare:</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🌟 Favoritele clienților</h3>
            <ul>
              <li><strong>Kit Robot de Programare</strong> - Învață programarea prin joacă</li>
              <li><strong>Set Construcție Poduri</strong> - Inginerie și fizică</li>
              <li><strong>Laborator Chimie</strong> - Experiențe științifice sigure</li>
            </ul>
          </div>

          <p><a href="{{storeUrl}}/products" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Cumpără cele mai populare</a></p>

          <p>Îți mulțumim pentru încredere!<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    // ===== ȘABLOANE CLIENT VIP =====
    {
      name: "Avantajele Lunare VIP",
      slug: "vip-monthly-perks",
      category: "VIP",
      subject: "Avantajele tale VIP exclusive: Oferte doar pentru tine 💎",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px;">
          <h1 style="text-align: center; margin-bottom: 30px;">🎉 Avantajele tale VIP din luna aceasta!</h1>

          <div style="background: white; color: #333; padding: 30px; border-radius: 12px; margin: 20px 0;">
            <h2 style="color: #2563eb;">{{user.name}}, ești special pentru noi!</h2>

            <p>Ca unul dintre clienții noștri valoroși VIP, ai acces la:</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>💝 Ofertele VIP din luna aceasta</h3>
              <ul>
                <li>25% reducere la toate kiturile STEM noi</li>
                <li>Livrare gratuită pentru comenzi peste 200 RON</li>
                <li>Acces anticipat la lansările de produse noi</li>
                <li>Webinarii și tutoriale VIP exclusive</li>
              </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="{{storeUrl}}/vip-offers" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Revendică avantajele tale VIP</a>
            </p>
          </div>

          <p style="text-align: center; color: white;">Îți mulțumim că ești un client minunat! 💙</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Special Ziua de Naștere VIP",
      slug: "vip-birthday",
      category: "VIP",
      subject: "La mulți ani! Un cadou special de la STEM Toys 🎂",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 40px 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; text-align: center; font-size: 28px;">🎂 La mulți ani, {{user.name}}!</h1>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #ff9a9e; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #e91e63;">Cadoul tău special de ziua de naștere 🎁</h2>

            <p>Deoarece însemni atât de mult pentru noi, iată un mic cadou pentru a-ți sărbători ziua specială:</p>

            <div style="background: #fff5f5; border: 2px solid #ff9a9e; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #e91e63; margin: 0;">🎉 30% REDUCERE LA TOT!</h3>
              <p style="margin: 10px 0; font-size: 18px;">Folosește codul: <strong>ZIUANASTERII2025</strong></p>
              <p style="margin: 0; color: #666;">Valabil pentru următoarele 7 zile</p>
            </div>

            <p style="text-align: center;">
              <a href="{{storeUrl}}/products" style="background: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Cumpără cu reducerea de ziua ta</a>
            </p>

            <p>Sperăm că ziua ta de naștere este plină de minuni, descoperiri și multă distracție STEM! 🎈</p>

            <p>Cu drag,<br>Familia STEM Toys 💕</p>
          </div>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    // ===== ȘABLOANE REÎNREGISTRARE =====
    {
      name: "Re-înregistrare - 30 Zile",
      slug: "reengagement-30days",
      category: "Re-engagement",
      subject: "Ne este dor de tine! Ofertă specială de 15% reducere 💝",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Ne este dor de tine! 🌟</h1>

          <p>Bună {{user.name}},</p>

          <p>Se pare că nu te-am mai văzut de ceva vreme. Sperăm că totul este bine!</p>

          <p>Am observat că nu ai mai vizitat STEM Toys recent, așa că am vrut să trecem pe la tine. Ca mulțumire pentru că faci parte din comunitatea noastră, iată:</p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-size: 24px;">🎁 15% REDUCERE LA TOT!</h2>
            <p style="margin: 10px 0; font-size: 16px;">Folosește codul: <strong>WELCOME_BACK</strong></p>
            <p style="margin: 0; opacity: 0.9;">Valabil 7 zile</p>
          </div>

          <p>Gata să continui călătoria de învățare STEM? <a href="{{storeUrl}}/products" style="color: #2563eb; font-weight: bold;">Vezi produsele noastre noi</a></p>

          <p>Ne-ar plăcea să te revedem curând! 🚀</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Re-înregistrare - 60 Zile",
      slug: "reengagement-60days",
      category: "Re-engagement",
      subject: "Lista ta de favorite STEM te așteaptă! 20% reducere 🎁",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">💝 Lista ta de favorite te așteaptă!</h1>

          <p>Bună {{user.name}},</p>

          <p>Am observat că ai salvat niște jucării STEM minunate în lista de favorite. Aceste favorite educaționale sunt încă disponibile și perfecte pentru învățare prin joacă!</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🎁 Oferta specială pentru lista de favorite</h3>
            <ul style="color: #92400e;">
              <li>10% reducere la articolele din lista de favorite</li>
              <li>Livrare gratuită pentru comenzile din lista de favorite</li>
              <li>Livrare prioritară disponibilă</li>
            </ul>
            <p style="color: #92400e; margin-bottom: 0;"><strong>Folosește codul: FAVORITE10</strong></p>
          </div>

          <p><a href="{{storeUrl}}/wishlist" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Vezi lista ta de favorite</a></p>

          <p>Gata să aduci magie STEM acasă? Lista ta de favorite te așteaptă! 🎓</p>

          <p>Pe curând,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Campanie de Recâștigare - 90 Zile",
      slug: "winback-campaign",
      category: "Re-engagement",
      subject: "Ultima șansă: 25% reducere + livrare gratuită! ⏰",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⏰ ULTIMA ȘANSĂ!</h1>
            <p style="margin: 10px 0; font-size: 18px;">Nu vrem să te pierdem!</p>
          </div>

          <div style="background: white; padding: 30px; border: 3px solid #ef4444; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #dc2626;">{{user.name}}, vino înapoi la STEM Toys!</h2>

            <p>Se pare că nu te-am mai văzut de ceva vreme, și ne este dor de clientul nostru favorit. Ca o ultimă mulțumire pentru că faci parte din comunitatea noastră de învățare STEM:</p>

            <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #dc2626; margin: 0; font-size: 24px;">🎁 OFERTA FINALĂ</h3>
              <ul style="color: #dc2626; text-align: left; display: inline-block; margin: 15px 0;">
                <li>25% reducere la întreaga comandă</li>
                <li>Livrare gratuită (fără sumă minimă)</li>
                <li>Cadou gratuit: Ghid de activități STEM</li>
                <li>Politică de returnare extinsă cu 14 zile</li>
              </ul>
              <p style="color: #dc2626; font-size: 16px; margin: 10px 0;"><strong>Folosește codul: FINAL_CHANCE</strong></p>
            </div>

            <p style="text-align: center; font-size: 18px; font-weight: bold; color: #dc2626;">
              Această ofertă expiră în 48 de ore!
            </p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="{{storeUrl}}/products" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Cumpără acum - Ultima șansă!</a>
            </p>

            <p>Dacă nu este momentul potrivit, poți reveni oricând. Vom fi aici cu mai multe jucării STEM minunate și aventuri de învățare! 🚀</p>

            <p>Sperând să te revedem curând,<br>Echipa STEM Toys 💙</p>
          </div>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    // ===== ȘABLOANE COMPORTAMENTALE =====
    {
      name: "Abandon Coș",
      slug: "cart-abandonment",
      category: "Behavioral",
      subject: "Jucăriile tale STEM te așteaptă! Completează comanda 🛒",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">🛒 Coșul tău te așteaptă!</h1>

          <p>Bună {{user.name}},</p>

          <p>Am observat că ai fost interesat de niște jucării STEM minunate, dar nu ai completat achiziția. Nu-i nimic - articolele tale sunt salvate în siguranță în coș!</p>

          <div style="background: #f8fafc; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Articolele tale salvate:</h3>
            <!-- Articolele din coș vor fi inserate dinamic aici -->
            <p><em>Completează comanda pentru a vedea articolele salvate</em></p>
          </div>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0;">⏰ Ofertă limitată: Livrare gratuită!</h3>
            <p style="margin: 5px 0;">Completează comanda în următoarele 24 de ore</p>
          </div>

          <p style="text-align: center;">
            <a href="{{storeUrl}}/cart" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Completează comanda</a>
          </p>

            <p>Întrebări? Suntem aici să te ajutăm! Răspunde la acest email sau contactează echipa noastră de suport.</p>

          <p>Cumpărături plăcute! 🎁<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Recomandări Produse",
      slug: "product-recommendation",
      category: "Behavioral",
      subject: "Bazat pe interesul tău: Recomandări STEM personalizate 🎯",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">🎯 Doar pentru tine!</h1>

          <p>Bună {{user.name}},</p>

          <p>Bazat pe produsele STEM pe care le-ai vizitat, am crezut că ți-ar plăcea aceste recomandări:</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">✨ Recomandările tale personalizate</h3>
            <p>Aceste produse completează ceea ce ai arătat că te interesează:</p>
            <!-- Recomandările vor fi inserate dinamic aici -->
            <p><em>Vezi recomandările tale personalizate</em></p>
          </div>

          <p><a href="{{storeUrl}}/recommendations" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Vezi toate recomandările</a></p>

          <p>Suntem pasionați să ajutăm copiii să descopere bucuria învățării STEM. Ce subiecte te interesează cel mai mult?</p>

          <p>Cu stimă,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    {
      name: "Memento Listă Favorite",
      slug: "wishlist-reminder",
      category: "Behavioral",
      subject: "Articolele tale salvate din STEM devin populare! 📈",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">💝 Lista ta de favorite te așteaptă!</h1>

          <p>Bună {{user.name}},</p>

          <p>Am observat că ai niște jucării STEM minunate în lista de favorite care devin din ce în ce mai populare. Aceste favorite educaționale s-ar putea să nu fie disponibile pentru totdeauna!</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🎁 Oferta specială pentru lista de favorite</h3>
            <ul style="color: #92400e;">
              <li>10% reducere la articolele din lista de favorite</li>
              <li>Livrare gratuită pentru comenzile din lista de favorite</li>
              <li>Livrare prioritară disponibilă</li>
            </ul>
            <p style="color: #92400e; margin-bottom: 0;"><strong>Folosește codul: FAVORITE10</strong></p>
          </div>

          <p><a href="{{storeUrl}}/wishlist" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Vezi lista ta de favorite</a></p>

          <p>Gata să aduci magie STEM acasă? Lista ta de favorite te așteaptă! 🎓</p>

          <p>Pe curând,<br>Echipa STEM Toys</p>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    // ===== ȘABLOANE CICLU DE VIAȚĂ =====
    {
      name: "Mulțumiri Prima Achiziție",
      slug: "first-purchase-thanks",
      category: "Lifecycle",
      subject: "Îți mulțumim pentru prima achiziție STEM Toys! 🎉",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Bun venit în familie!</h1>
            <p style="margin: 10px 0; font-size: 18px;">Îți mulțumim pentru prima achiziție!</p>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #10b981; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #059669;">{{user.name}}, acum faci parte din STEM Toys!</h2>

            <p>Îți mulțumim că ai ales STEM Toys pentru călătoria ta de învățare! Suntem încântați să te avem ca parte a comunității noastre de minți curioase.</p>

            <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin-top: 0;">🎁 Cadoul tău de bun venit</h3>
              <p>Ca mulțumire, iată un cod special pentru următoarea achiziție:</p>
              <p style="font-size: 18px; font-weight: bold; color: #059669; text-align: center;">FIRST_TIME_BUYER</p>
              <p style="margin-bottom: 0; color: #059669;">Primești 15% reducere la următoarea comandă!</p>
            </div>

            <p>Cum a fost experiența ta de cumpărare? Ne-ar plăcea să auzim de la tine!</p>

            <p>Gata pentru mai multe aventuri STEM? <a href="{{storeUrl}}/products" style="color: #059669; font-weight: bold;">Explorează colecția noastră completă</a></p>

            <p>Bun venit la bord! 🚀<br>Echipa STEM Toys</p>
          </div>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },

    // ===== PREVENIRE ABANDON =====
    {
      name: "Prevenire Abandon",
      slug: "churn-prevention",
      category: "Churn",
      subject: "Ne pare rău să te vedem plecând... O ultimă ofertă specială 💔",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0;">💔 Ne pare rău să te vedem plecând</h1>
            <p style="margin: 10px 0;">Dar înțelegem că viața e agitată!</p>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #6366f1; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #4f46e5;">{{user.name}}, vino înapoi oricând!</h2>

            <p>Am observat că nu ai mai fost pe la noi recent, și am vrut să-ți spunem mulțumesc că faci parte din comunitatea noastră de învățare STEM. Chiar dacă iei o pauză, ne-ar plăcea să te primim înapoi.</p>

            <div style="background: #eef2ff; border: 2px solid #c7d2fe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #4f46e5; margin: 0;">🎁 Ofertă specială de bun venit</h3>
              <p style="margin: 10px 0; font-size: 16px;">Folosește codul: <strong>WELCOME_BACK</strong></p>
              <p style="margin: 0; color: #6b7280;">20% reducere la următoarea comandă</p>
            </div>

            <p>Învățarea STEM este o călătorie, nu o destinație. Oricând ești pregătit să continui explorarea, descoperirea și învățarea prin joacă - vom fi aici! 🚀</p>

            <p>La revedere,<br>Echipa STEM Toys 💙</p>

            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              Nu te mai interesează? Te poți <a href="{{unsubscribeUrl}}" style="color: #6b7280;">dezabona</a> oricând.
            </p>
          </div>
        </div>
      `,
      variables: ["user.name", "storeUrl", "unsubscribeUrl"],
      isActive: true,
    },

    // ===== PIAȚA ROMÂNEASCĂ =====
    {
      name: "Sărbători Românești Special",
      slug: "romanian-holiday",
      category: "Romanian",
      subject: "Sărbători Fericite! Oferte Speciale pentru Familie 🎄",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎄 Sărbători Fericite!</h1>
            <p style="margin: 10px 0;">Crăciun Fericit și Un An Nou Plin de Descoperiri!</p>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #b91c1c;">Dragă {{user.name}},</h2>

            <p>Sărbători fericite! În această perioadă specială, ne-am gândit să vă oferim câteva cadouri speciale pentru a face sărbătorile și mai magice:</p>

            <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #b91c1c; margin-top: 0;">🎁 Oferta Specială de Sărbători</h3>
              <ul style="color: #b91c1c;">
                <li>Reducere 25% la toate jucăriile STEM</li>
                <li>Livrare gratuită pentru comenzi peste 200 RON</li>
                <li>Cadou gratuit: Ghid de activități STEM de sărbători</li>
                <li>Oferte speciale pentru familii</li>
              </ul>
              <p style="color: #b91c1c; margin-bottom: 0;"><strong>Cod: SARBATORI2025</strong></p>
            </div>

            <p style="text-align: center;">
              <a href="{{storeUrl}}/sarbatori" style="background: #b91c1c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Descoperă Ofertele de Sărbători</a>
            </p>

            <p>Săptămâna aceasta este perfectă pentru a aduce bucurie și învățare în casa voastră! 🎅</p>

            <p>Cu drag,<br>Echipa STEM Toys România 🇷🇴</p>
          </div>
        </div>
      `,
      variables: ["user.name", "storeUrl"],
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const templateData of templates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: templateData.slug },
      });

      if (existing) {
        console.log(`⏭️  Se omite șablonul existent: ${templateData.name}`);
        skippedCount++;
        continue;
      }

      await prisma.emailTemplate.create({
        data: templateData,
      });

      console.log(`✅ Creat șablon: ${templateData.name}`);
      createdCount++;
    } catch (error) {
      console.error(
        `❌ Eroare la crearea șablonului ${templateData.name}:`,
        error
      );
    }
  }

  console.log(`\n📧 Creare șabloane completată!`);
  console.log(`   • Create: ${createdCount} șabloane`);
  console.log(`   • Omise: ${skippedCount} existente`);

  // Create email sequences
  console.log("\n📧 Se creează secvențe email...");

  const sequences = [
    {
      name: "Îregistrare VIP",
      description: "Secvență de bun venit pentru clienții VIP noi",
      trigger: "segment_enter",
      isActive: true,
      maxEmails: 5,
      cooldownHours: 24,
      steps: [
        {
          order: 1,
          delayHours: 0,
          templateId: "vip-monthly-perks",
          subject: "Bun venit la VIP! Beneficiile tale exclusive",
        },
        {
          order: 2,
          delayHours: 72,
          templateId: "welcome-series-day3",
          subject: "VIP Exclusive: Resurse STEM Premium",
        },
      ],
    },

    {
      name: "Retenție Client",
      description: "Program de retenție continuă pentru clienții activi",
      trigger: "lifecycle_change",
      isActive: true,
      maxEmails: 10,
      cooldownHours: 168, // 1 week
      steps: [
        {
          order: 1,
          delayHours: 0,
          templateId: "first-purchase-thanks",
          subject: "Îți mulțumim că faci parte din STEM Toys",
        },
      ],
    },

    {
      name: "Recuperare La Risc",
      description: "Secvență de recuperare pentru clienții la risc",
      trigger: "segment_enter",
      isActive: true,
      maxEmails: 3,
      cooldownHours: 72,
      steps: [
        {
          order: 1,
          delayHours: 0,
          templateId: "reengagement-30days",
          subject: "Ne este dor de tine! Ofertă specială în interior",
        },
        {
          order: 2,
          delayHours: 168,
          templateId: "reengagement-60days",
          subject: "Lista ta de favorite te așteaptă + reduceri suplimentare",
        },
      ],
    },
  ];

  let seqCreatedCount = 0;
  let seqSkippedCount = 0;

  for (const sequenceData of sequences) {
    try {
      const existing = await prisma.emailSequence.findFirst({
        where: { name: sequenceData.name },
      });

      if (existing) {
        console.log(`⏭️  Se omite secvența existentă: ${sequenceData.name}`);
        seqSkippedCount++;
        continue;
      }

      const { steps, ...seqData } = sequenceData;
      const sequence = await prisma.emailSequence.create({
        data: {
          ...seqData,
          createdBy: "system",
        },
      });

      // Create sequence steps
      for (const step of steps) {
        const template = await prisma.emailTemplate.findUnique({
          where: { slug: step.templateId },
        });

        if (template) {
          await prisma.emailSequenceStep.create({
            data: {
              sequenceId: sequence.id,
              order: step.order,
              delayHours: step.delayHours,
              templateId: template.id,
              subject: step.subject,
              content: template.content,
            },
          });
        }
      }

      console.log(`✅ Creată secvența: ${sequenceData.name}`);
      seqCreatedCount++;
    } catch (error) {
      console.error(
        `❌ Eroare la crearea secvenței ${sequenceData.name}:`,
        error
      );
    }
  }

  console.log(`\n📧 Creare secvențe completată!`);
  console.log(`   • Create: ${seqCreatedCount} secvențe`);
  console.log(`   • Omise: ${seqSkippedCount} existente`);

  console.log("\n🎉 Sistemul de email este acum complet gata!");
  console.log("   • Toate șabloanele create");
  console.log("   • Toate secvențele configurate");
  console.log("   • Declanșatoarele sunt active și gata să trimită emailuri");
}

createEmailTemplates()
  .catch(console.error)
  .finally(() => process.exit(0));
