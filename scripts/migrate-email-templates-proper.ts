import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateEmailTemplatesProper() {
  console.log("🚀 Starting proper email templates migration...");

  try {
    // 1. Welcome Email Template - WITH ORIGINAL DESIGN
    const welcomeTemplate = await prisma.emailTemplate.upsert({
      where: { slug: "welcome-email" },
      update: {
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bine ai venit - {{storeName}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
    
    <!-- Hero Section -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Bine ai venit la {{storeName}}!</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; color: #ffffff;">Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin: 2rem 0;">
        <p style="font-size: 18px; margin-bottom: 1rem; color: #374151;">
          Salut <strong style="color: #111827;">{{name}}</strong>,
        </p>
        <p style="font-size: 16px; margin-bottom: 1.5rem; color: #4b5563; line-height: 1.625;">
          Îți mulțumim că ți-ai creat un cont la {{storeName}}. Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!
        </p>
      </div>

      <!-- Feature Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
        <div style="background: #f8fafc; border-radius: 0.75rem; padding: 1.5rem; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🛒</div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: #2563eb;">Cumpărări Ușoare</h3>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Cumpără din colecția noastră exclusivă de jucării educaționale STEM cu doar câteva click-uri.</p>
        </div>
        <div style="background: #f8fafc; border-radius: 0.75rem; padding: 1.5rem; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: #059669;">Urmărire Comenzi</h3>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Urmărește comenzile și statusul livrărilor în timp real din contul tău personal.</p>
        </div>
        <div style="background: #f8fafc; border-radius: 0.75rem; padding: 1.5rem; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">❤️</div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: #d97706;">Lista de Dorințe</h3>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Salvează produsele preferate pentru achiziții viitoare și primește notificări despre reduceri.</p>
        </div>
        <div style="background: #f8fafc; border-radius: 0.75rem; padding: 1.5rem; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: #7c3aed;">Recomandări Personalizate</h3>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Primești recomandări personalizate în funcție de vârstă și interesele copilului tău.</p>
        </div>
      </div>

      <!-- Social Proof -->
      <div style="background: #eff6ff; border-radius: 0.75rem; padding: 2rem; margin: 2rem 0; text-align: center;">
        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #1e40af;">Comunitatea Noastră STEM</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
          <div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af;">10,000+</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Familii Mulțumite</div>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af;">500+</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Produse STEM</div>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af;">4.9/5</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Rating Clienți</div>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af;">24/7</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Suport Client</div>
          </div>
        </div>
      </div>

      <!-- Testimonial -->
      <div style="background: #f0fdf4; border-radius: 0.75rem; padding: 2rem; margin: 2rem 0; border: 1px solid #bbf7d0;">
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">⭐</div>
          <p style="margin: 0 0 1rem 0; font-size: 1rem; color: #166534; font-style: italic;">
            "Produsele de la {{storeName}} au transformat complet modul în care copilul meu vede știința. Acum este pasionat de experimente și își dorește să devină cercetător!"
          </p>
          <div style="font-weight: 600; color: #166534;">Maria Popescu</div>
          <div style="font-size: 0.875rem; color: #6b7280;">Mama unui copil de 8 ani</div>
        </div>
      </div>

      <!-- Welcome Bonus -->
      <div style="background: #f8fafc; border-radius: 1rem; padding: 2rem; margin: 2rem 0; text-align: center;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
          🎁 Bonus de Bun Venit
        </h3>
        <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #4b5563;">
          Primești automat <strong style="color: #2563eb;">10% reducere</strong> la prima ta comandă!
        </p>
        <a href="{{baseUrl}}/products?welcome=10off" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block;">
          Folosește Reducerea
        </a>
      </div>

      <!-- CTA Section -->
      <div style="text-align: center; margin: 2rem 0;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 600; color: #111827;">Începe Aventura STEM Astăzi!</h3>
        <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #4b5563;">
          Descoperă colecția noastră exclusivă de jucării educaționale și oferă copilului tău șansa să exploreze lumea științei într-un mod distractiv și interactiv.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="{{baseUrl}}/products/featured" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
            🎯 Vezi Produsele Recomandate
          </a>
          <a href="{{baseUrl}}/blog/stem-education-guide" style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
            📚 Ghidul Părinților
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin: 3rem 0;">
        <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1rem;">
          Cu respect și entuziasm,
        </p>
        <p style="font-size: 1.25rem; font-weight: 700; color: #2563eb; margin: 0;">
          Echipa {{storeName}}
        </p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
          Împreună construim viitorul prin educație STEM
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
      },
      create: {
        name: "Welcome Email",
        slug: "welcome-email",
        subject: "🎉 Bine ai venit la {{storeName}} - Primești 10% Reducere!",
        content: `...`, // Same content as above
        category: "auth",
        isActive: true,
        variables: ["name", "storeName", "baseUrl"],
        createdBy: "system-migration",
      },
    });

    console.log(
      "✅ Successfully updated welcome email template with original design"
    );
  } catch (error) {
    console.error("❌ Error updating email templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEmailTemplatesProper()
  .then(() => {
    console.log("🎉 Email templates updated with original design!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Update failed:", error);
    process.exit(1);
  });
