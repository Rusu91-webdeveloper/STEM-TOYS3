# Update Production Verification Email Template

## Method 1: Via Railway CLI (Easiest)

```bash
# 1. Install Railway CLI if not already installed
npm i -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project
railway link

# 4. Run the update script in production
railway run pnpm tsx scripts/update-verification-template.ts
```

## Method 2: Via Production SSH/Shell

```bash
# 1. SSH into production or open production shell
# (depends on your hosting provider)

# 2. Navigate to project directory
cd /path/to/STEM-TOYS3

# 3. Run the update script
pnpm tsx scripts/update-verification-template.ts
```

## Method 3: Via Database SQL (Direct)

If you have direct database access (e.g., Neon, Supabase):

```sql
-- Update the account-verification template
UPDATE "EmailTemplate"
SET 
  content = '<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifică-ți email-ul</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📧 Verifică-ți email-ul
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{userName}}!
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Pentru a finaliza înregistrarea contului tău, te rugăm să verifici adresa de email 
                făcând clic pe butonul de mai jos.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{verificationLink}}" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    ✅ Verifică email-ul
                </a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Important:</strong> Acest link va expira în {{expiresIn}} din motive de securitate.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>
                <a href="{{verificationLink}}" style="color: #3b82f6; word-break: break-all;">{{verificationLink}}</a>
            </p>
            
            <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Dacă nu ai creat un cont la {{siteUrl}}, te rugăm să ignori acest email.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>',
  variables = ARRAY['userName', 'verificationLink', 'expiresIn', 'siteUrl'],
  subject = 'Verifică-ți adresa de email - TechTots',
  "updatedAt" = NOW()
WHERE slug = 'account-verification';

-- Verify the update
SELECT 
  slug, 
  subject, 
  variables,
  "updatedAt"
FROM "EmailTemplate"
WHERE slug = 'account-verification';
```

## Method 4: Via Prisma Studio (Visual)

```bash
# 1. Connect Prisma Studio to production database
# Set DATABASE_URL to production in .env temporarily

# 2. Open Prisma Studio
pnpm prisma studio

# 3. Navigate to EmailTemplate table

# 4. Find and edit the 'account-verification' template

# 5. Update the content field with new HTML

# 6. Update variables to: ['userName', 'verificationLink', 'expiresIn', 'siteUrl']

# 7. Save changes
```

## Verification After Update

After updating production, verify it worked:

```sql
-- Check the template was updated
SELECT 
  name,
  slug,
  subject,
  variables,
  LENGTH(content) as content_length,
  "updatedAt"
FROM "EmailTemplate"
WHERE slug = 'account-verification';

-- Should show:
-- subject: "Verifică-ți adresa de email - TechTots"
-- variables: {userName,verificationLink,expiresIn,siteUrl}
-- content_length: ~3000+ characters (professional template)
-- updatedAt: recent timestamp
```

## Test in Production

1. Register a new test user in production
2. Check verification email
3. Verify:
   - ✅ Orange gradient header
   - ✅ Clickable "Verifică email-ul" button
   - ✅ Professional styling
   - ✅ All variables replaced correctly

---

**Recommended**: Use Method 1 (Railway CLI) - it's the safest and easiest!
