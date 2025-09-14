# Email Auto-Migration Report

## Summary
- Total files scanned: 888
- Files migrated: 34
- Errors: 0

## Migration Rules Applied

1. **emailTemplates.returnNotification** → **sendReturnNotificationEmail**
   - Import: `import("@/lib/nodemailer")` → `import("@/lib/email/migration-helper")`

2. **sendMail** → **sendEmailViaUnifiedSystem**
   - Import: `import("@/lib/nodemailer")` → `import("@/lib/email/migration-helper")`

3. **emailTemplates.bulkReturnAdminNotification** → **sendBulkReturnNotificationEmail**
   - Import: `import("@/lib/brevoTemplates")` → `import("@/lib/email/migration-helper")`

4. **emailTemplates.bulkReturnConfirmation** → **sendBulkReturnConfirmationEmail**
   - Import: `import("@/lib/brevoTemplates")` → `import("@/lib/email/migration-helper")`

5. **emailTemplates** → **sendEmailViaUnifiedSystem**
   - Import: `from "@/lib/nodemailer"` → `from "@/lib/email/migration-helper"`

6. **sendEmailWithBrevoApi** → **sendEmailViaUnifiedSystem**
   - Import: `from "@/lib/brevo"` → `from "@/lib/email/migration-helper"`

7. **sendEmailWithResend** → **sendEmailViaUnifiedSystem**
   - Import: `from "@/lib/resend"` → `from "@/lib/email/migration-helper"`

