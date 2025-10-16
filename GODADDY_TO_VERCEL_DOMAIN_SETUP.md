# 🌐 Connect GoDaddy Domain to Vercel - Complete Guide

> **Note**: This guide is for connecting a GoDaddy domain to ANY Vercel project.
> Follow these steps carefully.

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ An active Vercel account with a deployed project
- ✅ A domain purchased from GoDaddy
- ✅ Access to your GoDaddy account
- ✅ Access to your Vercel project settings

---

## 🚀 Step-by-Step Setup Process

### **Phase 1: Configure Domain in Vercel**

#### Step 1: Access Your Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Log in to your account
3. Navigate to the specific project you want to connect the domain to
4. Click on **"Settings"** in the top navigation bar

#### Step 2: Add Your Domain in Vercel

1. In the Settings page, click on **"Domains"** in the left sidebar
2. You'll see an input field that says "Enter domain..."
3. Type your domain name (example: `yourdomain.com`)
4. Click **"Add"**

#### Step 3: Configure Domain Type

After adding the domain, Vercel will show you configuration options:

**Option A: Add both `yourdomain.com` AND `www.yourdomain.com`**

- Add `yourdomain.com` first
- Then add `www.yourdomain.com` separately
- Recommended: Set one as primary (usually the non-www version)

**Option B: Add only one version**

- You can add just `yourdomain.com` or just `www.yourdomain.com`
- Vercel will redirect the other automatically if configured properly

#### Step 4: Get DNS Records from Vercel

After adding the domain, Vercel will display the DNS records you need to add.
You'll see one of these configurations:

**Configuration Type A (Recommended):**

```
Type: A
Name: @
Value: 76.76.21.21
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Configuration Type B (Alternative):**

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

> **Important**: Take note of these exact values. You'll need them for GoDaddy
> configuration.

---

### **Phase 2: Configure DNS in GoDaddy**

#### Step 5: Access GoDaddy DNS Management

1. Go to [godaddy.com](https://www.godaddy.com)
2. Log in to your account
3. Click on your profile icon (top right)
4. Select **"My Products"**
5. Find your domain in the list
6. Click on **"DNS"** or **"Manage DNS"** next to your domain

#### Step 6: Clear Existing Conflicting Records (If Necessary)

Before adding new records, check for conflicts:

1. Look for existing **A records** with Name `@`
2. Look for existing **CNAME records** with Name `www`
3. If you find any that point to other services (like GoDaddy parking page):
   - Click the **pencil icon** (Edit) or **trash icon** (Delete)
   - Remove or modify them

> ⚠️ **Warning**: Do NOT delete MX records (email) or TXT records (verification)
> unless you're sure they're not needed.

#### Step 7: Add Vercel DNS Records in GoDaddy

**For the Root Domain (@):**

1. Click **"Add"** button in the DNS Records section
2. Select **Type**: `A`
3. Enter **Name**: `@` (this represents your root domain)
4. Enter **Value**: `76.76.21.21` (Vercel's IP address)
5. Set **TTL**: `600` (or leave as default)
6. Click **"Save"**

**For the WWW Subdomain:**

1. Click **"Add"** button again
2. Select **Type**: `CNAME`
3. Enter **Name**: `www`
4. Enter **Value**: `cname.vercel-dns.com` (or the value Vercel provided)
5. Set **TTL**: `600` (or leave as default)
6. Click **"Save"**

#### Step 8: Verify Your Changes

After adding both records, your DNS records should look like this in GoDaddy:

| Type  | Name | Value                | TTL |
| ----- | ---- | -------------------- | --- |
| A     | @    | 76.76.21.21          | 600 |
| CNAME | www  | cname.vercel-dns.com | 600 |

---

### **Phase 3: Verification & Testing**

#### Step 9: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate globally
- Typically, changes are visible within **10-30 minutes**
- Be patient during this period

#### Step 10: Check Vercel Status

1. Go back to your Vercel project
2. Navigate to **Settings** > **Domains**
3. Look at your domain status:
   - ⏳ **Pending**: DNS not yet propagated
   - ✅ **Valid**: Domain successfully connected!
   - ❌ **Invalid Configuration**: Check your DNS settings

#### Step 11: Test Your Domain

Once Vercel shows "Valid", test your domain:

1. Open a new browser tab (incognito/private mode recommended)
2. Visit `http://yourdomain.com`
3. Visit `https://yourdomain.com` (SSL should work automatically)
4. Visit `http://www.yourdomain.com`
5. Visit `https://www.yourdomain.com`

**All versions should work and redirect to your Vercel deployment.**

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Domain is not configured correctly"

**Solution:**

- Double-check the DNS records in GoDaddy match exactly what Vercel provided
- Make sure there are no typos in the CNAME or A record values
- Wait at least 30 minutes for DNS propagation
- Try clearing your browser cache or use incognito mode

### Issue 2: "DNS records point to a different IP"

**Solution:**

- Remove any conflicting A records in GoDaddy
- Ensure the A record points to `76.76.21.21` (Vercel's IP)
- Check that no ALIAS or other records conflict

### Issue 3: "www subdomain not working"

**Solution:**

- Make sure the CNAME record for `www` is set to `cname.vercel-dns.com`
- Verify you added both `yourdomain.com` and `www.yourdomain.com` in Vercel
- Check GoDaddy doesn't have domain forwarding enabled for www

### Issue 4: "SSL Certificate Error"

**Solution:**

- Vercel automatically provisions SSL certificates (this can take a few minutes)
- Wait 5-10 minutes after DNS verification
- If it persists after 1 hour, try removing and re-adding the domain in Vercel

### Issue 5: "Domain already in use on Vercel"

**Solution:**

- Check if the domain is connected to another Vercel project
- Remove it from the old project first
- Or contact Vercel support if it's claimed by another account

---

## ✅ Verification Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Domain added in Vercel project settings
- [ ] DNS records obtained from Vercel
- [ ] GoDaddy DNS management accessed
- [ ] A record added: `@ → 76.76.21.21`
- [ ] CNAME record added: `www → cname.vercel-dns.com`
- [ ] No conflicting DNS records in GoDaddy
- [ ] Waited at least 15-30 minutes for propagation
- [ ] Vercel shows domain as "Valid"
- [ ] `yourdomain.com` loads correctly
- [ ] `www.yourdomain.com` loads correctly
- [ ] HTTPS works on both versions
- [ ] SSL certificate is valid (no browser warnings)

---

## 🎯 Advanced Configuration (Optional)

### Redirect www to non-www (or vice versa)

Vercel handles this automatically. To configure:

1. Go to **Settings** > **Domains** in Vercel
2. Find your domains in the list
3. Click the **three dots** (•••) next to one domain
4. Select **"Redirect to..."**
5. Choose which version should be primary

### Add Subdomains

To add subdomains (e.g., `blog.yourdomain.com`):

1. In Vercel: Add the subdomain in **Settings** > **Domains**
2. In GoDaddy: Add a CNAME record with the subdomain name pointing to
   `cname.vercel-dns.com`

Example:

```
Type: CNAME
Name: blog
Value: cname.vercel-dns.com
```

### Custom Nameservers (Advanced)

For more control, you can use Vercel's nameservers:

1. In Vercel, go to **Settings** > **Domains**
2. Enable "Use Vercel Nameservers" option
3. Copy the nameserver addresses Vercel provides
4. In GoDaddy, go to domain settings
5. Change nameservers to Vercel's nameservers
6. Note: This gives Vercel full DNS control

---

## 📱 Useful Tools for Testing

### Check DNS Propagation

- [whatsmydns.net](https://www.whatsmydns.net) - Check DNS propagation globally
- [dnschecker.org](https://dnschecker.org) - Alternative DNS checker

### Check SSL Certificate

- [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/) - Comprehensive SSL
  test

### Browser Testing

- Test in multiple browsers (Chrome, Firefox, Safari)
- Test in incognito/private mode to avoid cache issues
- Test on mobile devices

---

## 📞 Need Help?

### Vercel Support

- Documentation:
  [vercel.com/docs/custom-domains](https://vercel.com/docs/custom-domains)
- Support: Available in your Vercel dashboard
- Community:
  [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

### GoDaddy Support

- Help Center: [godaddy.com/help](https://www.godaddy.com/help)
- Live Chat: Available 24/7 in your GoDaddy account
- Phone: Check GoDaddy website for regional numbers

---

## 🎉 Success!

Once your domain shows as "Valid" in Vercel and loads correctly in your browser,
you're all set! Your GoDaddy domain is now successfully connected to your Vercel
project.

**Typical Timeline:**

- DNS configuration: 5-10 minutes
- DNS propagation: 10-30 minutes
- SSL certificate: 5-10 minutes after DNS validation
- **Total time**: Usually 20-50 minutes

---

## 📝 Notes

- **DNS changes are not instant** - Be patient and allow time for propagation
- **Always use HTTPS** - Vercel provides free SSL certificates automatically
- **Keep your GoDaddy account secure** - Use two-factor authentication
- **Document your changes** - Keep a record of what DNS records you added
- **Test thoroughly** - Check all variations of your domain before announcing

---

**Last Updated**: October 15, 2025

**Version**: 1.0

**Author**: STEM-TOYS3 Development Team
