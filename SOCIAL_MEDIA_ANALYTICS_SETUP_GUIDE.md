# Complete Social Media Analytics Setup Guide

## 🎯 Overview

This guide will walk you through setting up Facebook, Instagram, and TikTok
pixel tracking for your Romanian STEM toys website. You'll learn how to create
accounts, get pixel IDs, configure environment variables, and connect everything
to your analytics dashboard.

---

## 📋 Prerequisites

- Your website running on `http://localhost:3001`
- Admin access to your website
- Email addresses for creating social media business accounts
- Basic understanding of social media platforms

---

## 🔧 Part 1: Facebook Pixel Setup

### Step 1.1: Create Facebook Business Account

1. **Go to**: [business.facebook.com](https://business.facebook.com)
2. **Click**: "Create Account"
3. **Fill out**:
   - Business name: "TechTots Romania" (or your business name)
   - Your name and email
   - Business type: "E-commerce"
   - Country: "Romania"
4. **Verify your email** when prompted

### Step 1.2: Create Facebook App

1. **Go to**: [developers.facebook.com](https://developers.facebook.com)
2. **Click**: "My Apps" → "Create App"
3. **Select**: "Business" as app type
4. **Fill out**:
   - App name: "TechTots Analytics"
   - App contact email: your email
   - Business account: Select the one you created
5. **Click**: "Create App"

### Step 1.3: Get Facebook Pixel ID

1. **In your Facebook App dashboard**:
   - Go to "Events Manager" in the left sidebar
   - Click "Connect Data Sources" → "Web"
   - Choose "Facebook Pixel"
2. **Enter your website details**:
   - Website URL: `https://techtots.ro` (or your domain)
   - Pixel name: "TechTots Main Pixel"
3. **Copy the Pixel ID** (looks like: `123456789012345`)
4. **Save this ID** - you'll need it later

### Step 1.4: Get Facebook Access Token (Optional)

1. **In your Facebook App**:
   - Go to "Tools" → "Graph API Explorer"
   - Select your app from dropdown
   - Click "Generate Access Token"
   - Select permissions: `ads_management`, `business_management`
2. **Copy the access token** (long string starting with letters/numbers)
3. **Save this token** - you'll need it later

---

## 📸 Part 2: Instagram Pixel Setup

### Step 2.1: Connect Instagram to Facebook Business

1. **Go to**: [business.facebook.com](https://business.facebook.com)
2. **Navigate to**: "Business Settings"
3. **Click**: "Instagram Accounts" → "Add"
4. **Connect your Instagram business account**:
   - If you don't have one, convert your personal Instagram to business
   - Go to Instagram app → Settings → Account → Switch to Professional Account
   - Choose "Business" and connect to your Facebook page

### Step 2.2: Get Instagram Pixel ID

1. **Instagram uses Facebook Pixel** for tracking
2. **Use the same Facebook Pixel ID** from Step 1.3
3. **No separate Instagram Pixel ID needed** - it's integrated with Facebook

### Step 2.3: Get Instagram Access Token

1. **Use the same Facebook Access Token** from Step 1.4
2. **Instagram tracking works through Facebook's system**

---

## 🎵 Part 3: TikTok Pixel Setup

### Step 3.1: Create TikTok Business Account

1. **Go to**: [business.tiktok.com](https://business.tiktok.com)
2. **Click**: "Sign Up" or "Get Started"
3. **Fill out**:
   - Email address
   - Password
   - Business name: "TechTots Romania"
   - Country: "Romania"
4. **Verify your email**

### Step 3.2: Create TikTok Ad Account

1. **In TikTok Business Center**:
   - Click "Assets" → "Ad Accounts"
   - Click "Create" → "Ad Account"
2. **Fill out**:
   - Ad account name: "TechTots Ads"
   - Currency: "RON" (Romanian Leu)
   - Time zone: "Europe/Bucharest"
3. **Complete setup** and get approved

### Step 3.3: Create TikTok Pixel

1. **In your TikTok Ads Manager**:
   - Go to "Assets" → "Events" → "Web Events"
   - Click "Manage" → "Create Pixel"
2. **Enter details**:
   - Pixel name: "TechTots Pixel"
   - Website URL: `https://techtots.ro`
3. **Copy the Pixel ID** (looks like: `C1234567890ABCDEF`)
4. **Save this ID** - you'll need it later

### Step 3.4: Get TikTok Access Token (Optional)

1. **Go to**:
   [ads.tiktok.com/marketing_api](https://ads.tiktok.com/marketing_api)
2. **Create an app**:
   - App name: "TechTots Analytics"
   - App category: "E-commerce"
3. **Get access token**:
   - Go to "Tools" → "API"
   - Generate access token with permissions: `ads_read`, `ads_write`
4. **Copy the access token** (long string)
5. **Save this token** - you'll need it later

---

## ⚙️ Part 4: Environment Variables Setup

### Step 4.1: Locate Your Environment File

1. **Open your project** in your code editor
2. **Navigate to**: `/Users/emanuelrusu/Desktop/STEM-TOYS3/.env.local`
3. **Open the file** (this is where all your environment variables are stored)

### Step 4.2: Add Facebook Pixel Variables

Add these lines to your `.env.local` file:

```bash
# Facebook Pixel Configuration
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

**Replace the values**:

- `123456789012345` → Your actual Facebook Pixel ID from Step 1.3
- `your_facebook_access_token_here` → Your Facebook Access Token from Step 1.4
- `your_facebook_app_id_here` → Your Facebook App ID (found in App Settings)
- `your_facebook_app_secret_here` → Your Facebook App Secret (found in App
  Settings → Basic)

### Step 4.3: Add Instagram Pixel Variables

Add these lines to your `.env.local` file:

```bash
# Instagram Pixel Configuration (uses Facebook Pixel)
INSTAGRAM_PIXEL_ID=123456789012345
INSTAGRAM_ACCESS_TOKEN=your_facebook_access_token_here
```

**Replace the values**:

- `123456789012345` → Same as your Facebook Pixel ID (Instagram uses Facebook
  Pixel)
- `your_facebook_access_token_here` → Same as your Facebook Access Token

### Step 4.4: Add TikTok Pixel Variables

Add these lines to your `.env.local` file:

```bash
# TikTok Pixel Configuration
TIKTOK_PIXEL_ID=C1234567890ABCDEF
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here
```

**Replace the values**:

- `C1234567890ABCDEF` → Your actual TikTok Pixel ID from Step 3.3
- `your_tiktok_access_token_here` → Your TikTok Access Token from Step 3.4

### Step 4.5: Complete Environment File Example

Your `.env.local` file should look like this:

```bash
# Database Configuration (already configured)
DATABASE_URL=postgres://neondb_owner:npg_kfr3JCK0uTqg@ep-small-union-a2e4pe5c-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Facebook Pixel Configuration
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAABwzLixnjYBO1234567890abcdefghijklmnopqrstuvwxyz
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890

# Instagram Pixel Configuration (uses Facebook Pixel)
INSTAGRAM_PIXEL_ID=123456789012345
INSTAGRAM_ACCESS_TOKEN=EAABwzLixnjYBO1234567890abcdefghijklmnopqrstuvwxyz

# TikTok Pixel Configuration
TIKTOK_PIXEL_ID=C1234567890ABCDEF
TIKTOK_ACCESS_TOKEN=1234567890abcdefghijklmnopqrstuvwxyz

# Other existing variables...
```

---

## 🔗 Part 5: Connect Pixels to Your Website

### Step 5.1: Update Database Schema

1. **Open terminal** in your project directory
2. **Run**: `npx prisma db push`
3. **Wait for completion** - this updates your database with new tables

### Step 5.2: Initialize Pixel Configurations

1. **Run the setup script**:
   ```bash
   node scripts/setup-facebook-pixel-analytics.js
   ```
2. **This creates**:
   - Facebook Pixel configuration in database
   - Instagram Pixel configuration in database
   - TikTok Pixel configuration in database
   - Sample tracking data

### Step 5.3: Restart Your Development Server

1. **Stop your current server** (Ctrl+C in terminal)
2. **Restart it**:
   ```bash
   npm run dev
   ```
3. **Wait for server to start** (usually takes 10-15 seconds)

---

## 📊 Part 6: Test Your Analytics Dashboard

### Step 6.1: Access the Analytics Page

1. **Open browser** and go to:
   `http://localhost:3001/admin/analytics/facebook-pixel`
2. **You should see**:
   - Page title: "Social Media Analytics"
   - Overview metrics with real data
   - Platform-specific tabs
   - Recent events feed

### Step 6.2: Test Facebook Tracking

1. **Go to any blog post** on your site
2. **Click the share button**
3. **Select "Facebook"**
4. **Complete the share** (or just close the popup)
5. **Go back to analytics page** and refresh
6. **You should see** a new event in "Recent Events"

### Step 6.3: Test Instagram Tracking

1. **Go to any blog post** on your site
2. **Click the share button**
3. **Select "Instagram"**
4. **Copy the link** when prompted
5. **Go back to analytics page** and refresh
6. **You should see** an Instagram share event

### Step 6.4: Test TikTok Tracking

1. **Go to any blog post** on your site
2. **Click the share button**
3. **Select "TikTok"**
4. **Copy the link** when prompted
5. **Go back to analytics page** and refresh
6. **You should see** a TikTok share event

---

## 🎯 Part 7: Understanding Your Analytics Dashboard

### Step 7.1: Overview Tab

**What you'll see**:

- **Total Events**: All tracking events across platforms
- **Viral Shares**: Social media shares from your blog posts
- **Blog Engagements**: Reading time and interactions
- **Purchases from Social**: Revenue from social media traffic
- **Total Revenue**: Money made in Romanian Lei

### Step 7.2: Viral Content Tab

**What you'll see**:

- **Blog Performance**: Which posts are going viral
- **Platform Breakdown**: Facebook vs Instagram vs TikTok shares
- **Viral Coefficient**: How many people each reader shares with
- **Romanian Engagement**: Romanian audience specific metrics

### Step 7.3: Recent Events Tab

**What you'll see**:

- **Live Activity Feed**: Real-time events as they happen
- **Platform Identification**: Which platform each event came from
- **Event Types**: ViralShare, BlogEngagement, Purchase, etc.
- **Timestamps**: When each event occurred

### Step 7.4: Platform Metrics

**What you'll see**:

- **Facebook Metrics**: Events, shares, revenue from Facebook
- **Instagram Metrics**: Events, shares, revenue from Instagram
- **TikTok Metrics**: Events, shares, revenue from TikTok
- **Cross-Platform Comparison**: Which platform performs best

---

## 🚨 Troubleshooting Common Issues

### Issue 1: "Pixel ID not found" Error

**Solution**:

1. Check your `.env.local` file has the correct pixel IDs
2. Restart your development server
3. Verify the pixel IDs in your social media accounts

### Issue 2: No Events Showing in Dashboard

**Solution**:

1. Make sure you've run the database setup script
2. Test sharing a blog post
3. Refresh the analytics page
4. Check browser console for any JavaScript errors

### Issue 3: Database Connection Error

**Solution**:

1. Verify your `DATABASE_URL` in `.env.local`
2. Run `npx prisma db push` to update schema
3. Restart your development server

### Issue 4: Share Buttons Not Working

**Solution**:

1. Check that you're on a blog post page
2. Make sure the Share component is properly imported
3. Check browser console for JavaScript errors

---

## 📈 Part 8: Going Live (Production Setup)

### Step 8.1: Update Production Environment Variables

1. **In your hosting platform** (Vercel, Netlify, etc.)
2. **Add all environment variables** from your `.env.local` file
3. **Use your real pixel IDs** (not the sample ones)
4. **Use your real access tokens**

### Step 8.2: Update Pixel IDs for Production

1. **In Facebook Pixel**:
   - Add your production domain to the pixel
   - Verify domain ownership
2. **In TikTok Pixel**:
   - Add your production domain
   - Verify domain ownership

### Step 8.3: Test Production Tracking

1. **Deploy your website**
2. **Visit your live blog posts**
3. **Test sharing functionality**
4. **Check analytics dashboard** for real events

---

## 🎉 Success Checklist

✅ **Facebook Business Account Created** ✅ **Facebook Pixel ID Obtained** ✅
**Instagram Account Connected to Facebook** ✅ **TikTok Business Account
Created** ✅ **TikTok Pixel ID Obtained** ✅ **Environment Variables
Configured** ✅ **Database Schema Updated** ✅ **Analytics Dashboard
Accessible** ✅ **Share Buttons Working** ✅ **Events Tracking in Dashboard** ✅
**Multi-Platform Analytics Working**

---

## 📞 Need Help?

### Common Resources:

- **Facebook Business Help**:
  [business.facebook.com/help](https://business.facebook.com/help)
- **TikTok Business Help**:
  [business.tiktok.com/help](https://business.tiktok.com/help)
- **Instagram Business Help**:
  [business.instagram.com/help](https://business.instagram.com/help)

### Technical Issues:

- Check your browser's developer console for errors
- Verify all environment variables are correctly set
- Ensure your database is accessible
- Make sure your development server is running

---

## 🎯 Next Steps

Once everything is working:

1. **Monitor your analytics** daily to see which content goes viral
2. **Optimize your blog posts** based on platform performance
3. **Create platform-specific content** for Facebook, Instagram, and TikTok
4. **Track ROI** from social media traffic to purchases
5. **Scale successful content** across all platforms

---

**Congratulations!** 🎉 You now have a complete multi-platform social media
analytics system tracking Facebook, Instagram, and TikTok performance for your
Romanian STEM toys business!
