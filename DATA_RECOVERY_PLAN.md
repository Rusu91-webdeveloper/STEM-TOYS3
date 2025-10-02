# 🚨 DATA RECOVERY & BACKUP PLAN

## **Critical: Prevent Future Data Loss**

This plan ensures you can **always recover** your STEM Toys store data, even if
everything gets deleted.

---

## 📋 **Quick Recovery Commands**

### **Create Backup (Run Daily):**

```bash
npm run backup
# or
npx tsx scripts/backup-database.ts
```

### **Restore from Backup:**

```bash
npm run restore
# or
npx tsx scripts/restore-database.ts
```

### **Fresh Restore (Clear existing data first):**

```bash
npm run restore:fresh
# or
npx tsx scripts/restore-database.ts --clear
```

---

## 🔄 **Automated Backup System**

### **Setup Daily Backups:**

1. **Create Cron Job** (macOS/Linux):

   ```bash
   crontab -e
   ```

2. **Add this line** (backup every day at 2 AM):

   ```
   0 2 * * * cd /Users/emanuelrusu/Desktop/STEM-TOYS3 && npm run backup:auto
   ```

3. **Or use launchd** (macOS) - create
   `~/Library/LaunchAgents/com.stemtoys.backup.plist`:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.stemtoys.backup</string>
       <key>ProgramArguments</key>
       <array>
           <string>/bin/bash</string>
           <string>-c</string>
           <string>cd /Users/emanuelrusu/Desktop/STEM-TOYS3 && npm run backup:auto</string>
       </array>
       <key>StartCalendarInterval</key>
       <dict>
           <key>Hour</key>
           <integer>2</integer>
           <key>Minute</key>
           <integer>0</integer>
       </dict>
       <key>StandardOutPath</key>
       <string>/Users/emanuelrusu/Desktop/STEM-TOYS3/backups/backup.log</string>
       <key>StandardErrorPath</key>
       <string>/Users/emanuelrusu/Desktop/STEM-TOYS3/backups/backup-error.log</string>
   </dict>
   </plist>
   ```

4. **Load the job:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.stemtoys.backup.plist
   ```

---

## 📁 **Backup Storage**

### **Backup Location:**

```
STEM-TOYS3/
├── backups/
│   ├── database-backup-2024-01-15T02-00-00-000Z.json
│   ├── database-backup-2024-01-14T02-00-00-000Z.json
│   ├── backup-log.txt
│   └── backup-error.log
```

### **Backup Contents:**

- ✅ All database tables and data
- ✅ Email templates (22 Romanian STEM templates)
- ✅ Categories, languages, settings
- ✅ Ready to restore instantly

---

## 🚨 **Emergency Recovery Procedure**

### **If Data is Lost Again:**

1. **Stay Calm** - Your backup system works! 🎯

2. **Check Available Backups:**

   ```bash
   ls -la backups/
   ```

3. **Restore Latest Backup:**

   ```bash
   npm run restore
   ```

4. **Verify Restoration:**
   ```bash
   node -e "
   require('dotenv').config({ path: '.env.local' });
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   (async () => {
     console.log('Users:', await prisma.user.count());
     console.log('Email Templates:', await prisma.emailTemplate.count());
     console.log('Categories:', await prisma.category.count());
     await prisma.\$disconnect();
   })();
   "
   ```

---

## 🛡️ **Prevention Measures**

### **NEVER Use These Commands:**

```bash
# ❌ DANGEROUS - Causes data loss
prisma db push --accept-data-loss
prisma migrate reset --force

# ✅ SAFE alternatives
npm run backup  # Before any schema changes
npm run restore # If something goes wrong
```

### **Safe Database Operations:**

1. **Before Schema Changes:**

   ```bash
   npm run backup
   ```

2. **For Development:**

   ```bash
   npx prisma migrate dev  # Safe migrations
   ```

3. **For Production:**
   ```bash
   npx prisma migrate deploy  # Safe deployments
   ```

---

## 📊 **What Gets Backed Up**

### **Critical Data:**

- ✅ **Email Templates** (22 Romanian STEM templates)
- ✅ **Admin User** (your login credentials)
- ✅ **Categories** (Science, Technology, Engineering, Mathematics)
- ✅ **Languages** (English, Romanian)
- ✅ **Products** (your STEM toys inventory)
- ✅ **Blogs** (educational content)
- ✅ **Orders** (customer purchase history)
- ✅ **Settings** (store configuration)

### **Advanced Features:**

- ✅ **Image Metadata** (photo management system)
- ✅ **Supplier Data** (vendor information)
- ✅ **Marketing Campaigns** (email automation)
- ✅ **Analytics** (performance metrics)

---

## 🔧 **Recovery Testing**

### **Test Your Backup System:**

1. **Create Test Backup:**

   ```bash
   npm run backup
   ```

2. **Verify Backup Exists:**

   ```bash
   ls -la backups/database-backup-*.json | tail -1
   ```

3. **Test Restore (in development):**
   ```bash
   # Create a test database or use a separate environment
   npm run restore:fresh
   ```

---

## 🚀 **Business Continuity Plan**

### **Downtime Prevention:**

1. **Always backup before deployments**
2. **Test in staging environment first**
3. **Have backup server ready**
4. **Monitor database health**

### **Recovery Time Objectives:**

- **RTO (Recovery Time Objective):** 5 minutes
- **RPO (Recovery Point Objective):** 24 hours (daily backups)

---

## 📞 **Emergency Contacts**

### **If Something Goes Wrong:**

1. **Run:** `npm run restore`
2. **Check:** Your backup files in `backups/` folder
3. **Verify:** Email templates and categories are restored

### **Support:**

- **Backup Status:** Check `backups/backup-log.txt`
- **Errors:** Check `backups/backup-error.log`

---

## 🎯 **Summary**

**You now have bulletproof data protection!** 🛡️

- **Daily automated backups** ✅
- **One-command restoration** ✅
- **Complete data recovery** ✅
- **Prevention measures** ✅

**Your STEM Toys store data is now SAFELY BACKED UP and recoverable!** 🚀

**Never lose data again!** 🎉
