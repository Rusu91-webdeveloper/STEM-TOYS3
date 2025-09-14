# 🔐 EMAIL AUTHENTICATION SETUP GUIDE

## Overview

This guide helps you set up proper email authentication (SPF, DKIM, DMARC) to
improve email deliverability and prevent emails from going to spam.

## 🎯 Current Status

- **Domain**: techtots.ro
- **Email Provider**: Brevo (primary), Resend (fallback)
- **Current Issues**: No email authentication configured

## 📋 Required DNS Records

### 1. SPF Record (Sender Policy Framework)

**Purpose**: Tells receiving servers which IPs are authorized to send emails for
your domain.

**DNS Record**:

```
Type: TXT
Name: @ (or techtots.ro)
Value: v=spf1 include:_spf.google.com include:spf.brevo.com include:resend.com ~all
TTL: 3600
```

**Explanation**:

- `v=spf1` - SPF version 1
- `include:_spf.google.com` - Allow Gmail/Google services
- `include:spf.brevo.com` - Allow Brevo sending
- `include:resend.com` - Allow Resend sending
- `~all` - Soft fail for other senders (recommended for testing)

### 2. DKIM Record (DomainKeys Identified Mail)

**Purpose**: Cryptographically signs emails to prove they came from your domain.

#### For Brevo:

1. Log into your Brevo account
2. Go to Settings > Senders & IP > Domain authentication
3. Add your domain: `techtots.ro`
4. Brevo will provide a DKIM record like:

```
Type: TXT
Name: mail._domainkey.techtots.ro
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE
TTL: 3600
```

#### For Resend:

1. Log into your Resend account
2. Go to Domains > Add Domain
3. Add `techtots.ro`
4. Resend will provide a DKIM record like:

```
Type: TXT
Name: resend._domainkey.techtots.ro
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE
TTL: 3600
```

### 3. DMARC Record (Domain-based Message Authentication)

**Purpose**: Tells receiving servers what to do with emails that fail SPF or
DKIM.

**DNS Record**:

```
Type: TXT
Name: _dmarc.techtots.ro
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@techtots.ro; ruf=mailto:dmarc@techtots.ro; fo=1; adkim=r; aspf=r;
TTL: 3600
```

**Explanation**:

- `v=DMARC1` - DMARC version 1
- `p=quarantine` - Quarantine emails that fail (start with this)
- `rua=mailto:dmarc@techtots.ro` - Send aggregate reports to this email
- `ruf=mailto:dmarc@techtots.ro` - Send forensic reports to this email
- `fo=1` - Generate reports for all failures
- `adkim=r` - Relaxed DKIM alignment
- `aspf=r` - Relaxed SPF alignment

## 🚀 Implementation Steps

### Step 1: Add SPF Record

1. Log into your domain registrar (where you bought techtots.ro)
2. Go to DNS management
3. Add the SPF record above
4. Wait for propagation (usually 5-60 minutes)

### Step 2: Set up DKIM with Brevo

1. Log into Brevo account
2. Go to Settings > Senders & IP > Domain authentication
3. Add domain: `techtots.ro`
4. Copy the DKIM record provided
5. Add it to your DNS
6. Verify the domain in Brevo

### Step 3: Set up DKIM with Resend

1. Log into Resend account
2. Go to Domains > Add Domain
3. Add `techtots.ro`
4. Copy the DKIM record provided
5. Add it to your DNS
6. Verify the domain in Resend

### Step 4: Add DMARC Record

1. Add the DMARC record to your DNS
2. Set up email monitoring for dmarc@techtots.ro
3. Monitor reports for 1-2 weeks

### Step 5: Test Authentication

Use these tools to verify your setup:

- **SPF Checker**: https://mxtoolbox.com/spf.aspx
- **DKIM Checker**: https://mxtoolbox.com/dkim.aspx
- **DMARC Checker**: https://mxtoolbox.com/dmarc.aspx
- **Email Test**: https://mail-tester.com/

## 📊 Monitoring & Maintenance

### DMARC Reports

- Check dmarc@techtots.ro regularly for reports
- Look for authentication failures
- Adjust policies based on results

### Gradual Policy Enforcement

1. **Week 1-2**: `p=quarantine` (quarantine failed emails)
2. **Week 3-4**: Monitor reports, adjust as needed
3. **Week 5+**: `p=reject` (reject failed emails) - only after confirming
   everything works

### Common Issues & Solutions

#### SPF Too Many DNS Lookups

**Problem**: SPF record exceeds 10 DNS lookup limit **Solution**: Use `include`
instead of `ip4`/`ip6` when possible

#### DKIM Verification Fails

**Problem**: DKIM signature doesn't match **Solution**: Ensure DNS record is
exactly as provided by email service

#### DMARC Policy Too Strict

**Problem**: Legitimate emails being rejected **Solution**: Start with
`p=quarantine`, monitor reports, then move to `p=reject`

## 🔧 Environment Variables

Add these to your `.env.local`:

```bash
# Email Authentication
EMAIL_DOMAIN=techtots.ro
DMARC_EMAIL=dmarc@techtots.ro
EMAIL_AUTH_MONITORING=true
```

## 📈 Expected Results

After proper setup:

- **Deliverability**: 95%+ emails reach inbox
- **Spam Rate**: < 1% emails marked as spam
- **Authentication**: 100% emails pass SPF/DKIM
- **Reputation**: Improved sender reputation

## 🚨 Important Notes

1. **Test First**: Always test with `p=quarantine` before `p=reject`
2. **Monitor Reports**: Check DMARC reports regularly
3. **Backup Plan**: Keep direct sending as fallback
4. **Gradual Rollout**: Don't change everything at once

## 📞 Support

If you need help:

1. Check DNS propagation: https://dnschecker.org/
2. Test email authentication: https://mail-tester.com/
3. Contact your email provider support
4. Review DMARC reports for issues

---

**Next Steps**: After DNS setup, we'll implement email monitoring and analytics
to track authentication success rates.
