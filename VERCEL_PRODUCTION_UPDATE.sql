-- ================================================================
-- UPDATE VERIFICATION EMAIL TEMPLATE FOR PRODUCTION
-- ================================================================
-- Run this SQL in your production database (Neon/Supabase)
-- to update the verification email template with professional design
-- ================================================================

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
  variables = ARRAY['userName', 'verificationLink', 'expiresIn', 'siteUrl']::text[],
  subject = 'Verifică-ți adresa de email - TechTots',
  "updatedAt" = NOW()
WHERE slug = 'account-verification';

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- Run this to verify the update was successful

SELECT 
  slug,
  name,
  subject,
  variables,
  LENGTH(content) as content_length,
  "updatedAt",
  "isActive"
FROM "EmailTemplate"
WHERE slug = 'account-verification';

-- Expected results:
-- slug: account-verification
-- subject: Verifică-ți adresa de email - TechTots
-- variables: {userName,verificationLink,expiresIn,siteUrl}
-- content_length: ~2900 characters (professional template)
-- updatedAt: current timestamp
-- isActive: true

-- ================================================================
-- ROLLBACK (if needed)
-- ================================================================
-- If something goes wrong, you can rollback to the old template
-- Save the output from this query BEFORE running the UPDATE above:

-- SELECT content, variables, subject 
-- FROM "EmailTemplate" 
-- WHERE slug = 'account-verification';

