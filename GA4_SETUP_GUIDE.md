# 📊 Google Analytics 4 Setup Guide for TechTots

## 🎯 **Step 1: Create GA4 Property**

1. **Go to Google Analytics**: https://analytics.google.com/
2. **Click "Start measuring"**
3. **Account name**: "TechTots Romania"
4. **Property name**: "TechTots Website"
5. **Reporting time zone**: "Bucharest (GMT+2)"
6. **Currency**: "Romanian Leu (RON)"

## 🎯 **Step 2: Configure Data Stream**

1. **Platform**: Web
2. **Website URL**: `https://www.techtots.ro`
3. **Stream name**: "TechTots Main Website"
4. **Copy your Measurement ID** (G-XXXXXXXXXX)

## 🎯 **Step 3: Add to Your Site**

### **Option A: Environment Variable (Recommended)**
Add to your `.env` file:
```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Option B: Direct Integration**
The GA4 component is already set up in your site! Just update the measurement ID.

## 🎯 **Step 4: Configure Enhanced E-commerce**

### **E-commerce Settings**
- **Currency**: RON
- **Country**: Romania
- **Language**: Romanian (ro)

### **Custom Dimensions**
- **User Type**: customer, supplier, admin
- **Product Category**: science, technology, engineering, mathematics
- **Language**: ro, en
- **Age Group**: 3-5, 6-8, 9-12, 13+
- **STEM Focus**: science, technology, engineering, mathematics

## 🎯 **Step 5: Set Up Goals**

### **Primary Goals**
1. **Purchase** - Track completed orders
2. **Add to Cart** - Track cart additions
3. **Product View** - Track product page views
4. **Newsletter Signup** - Track email subscriptions

### **Secondary Goals**
1. **Blog Engagement** - Track blog post reads
2. **Contact Form** - Track contact form submissions
3. **Supplier Registration** - Track supplier signups

## 🎯 **Step 6: Configure Audiences**

### **Customer Segments**
- **High-Value Customers** - Orders > 500 RON
- **Frequent Buyers** - 3+ orders
- **STEM Enthusiasts** - Multiple STEM category purchases
- **New Customers** - First-time buyers
- **Cart Abandoners** - Added to cart but didn't purchase

### **Behavioral Segments**
- **Mobile Users** - Mobile device users
- **Desktop Users** - Desktop device users
- **Returning Visitors** - 2+ sessions
- **Blog Readers** - Visited blog pages

## 🎯 **Step 7: Set Up Reports**

### **Custom Reports**
1. **STEM Product Performance**
   - Product category breakdown
   - Age group preferences
   - Seasonal trends

2. **Customer Journey**
   - Acquisition → Engagement → Conversion
   - Touchpoint analysis
   - Path to purchase

3. **Content Performance**
   - Blog post engagement
   - Product page performance
   - Search query analysis

## 🎯 **Step 8: Configure Alerts**

### **Performance Alerts**
- **Traffic drops** > 20%
- **Conversion rate drops** > 15%
- **High bounce rate** > 70%
- **Slow page load** > 3 seconds

### **Business Alerts**
- **Low stock** products
- **Cart abandonment** > 60%
- **New customer acquisition** < 10 per day

## 🎯 **Step 9: Link with Google Search Console**

1. **In GA4**: Admin → Product Links → Search Console
2. **Link your GSC property**: www.techtots.ro
3. **Enable data sharing** between platforms

## 🎯 **Step 10: Test Everything**

### **Test Events**
1. **Visit your site** - Check real-time reports
2. **Add product to cart** - Verify e-commerce tracking
3. **Complete purchase** - Test conversion tracking
4. **View blog post** - Test content tracking

### **Verification Checklist**
- ✅ Real-time data showing
- ✅ E-commerce events firing
- ✅ Custom dimensions populated
- ✅ Goals tracking correctly
- ✅ GSC data linked

## 📊 **Key Metrics to Monitor**

### **Traffic Metrics**
- **Sessions**: Total visits
- **Users**: Unique visitors
- **Page views**: Total page views
- **Bounce rate**: Single-page sessions
- **Session duration**: Time on site

### **E-commerce Metrics**
- **Revenue**: Total sales
- **Transactions**: Number of orders
- **Average order value**: Revenue/transactions
- **Conversion rate**: Purchases/sessions
- **Cart abandonment rate**: Abandoned carts/total carts

### **Content Metrics**
- **Top pages**: Most viewed content
- **Blog engagement**: Time on blog posts
- **Product views**: Most viewed products
- **Search queries**: What people search for

## 🚀 **Next Steps**

1. **Set up GA4 property** (15 minutes)
2. **Add measurement ID** to your site (5 minutes)
3. **Test tracking** (10 minutes)
4. **Configure goals and audiences** (30 minutes)
5. **Set up custom reports** (20 minutes)
6. **Link with GSC** (5 minutes)

**Total time**: ~1.5 hours for complete setup

---

**Pro Tip**: Set up GA4 now while waiting for GSC to process your sitemaps. This way you'll have complete analytics ready when your SEO traffic starts coming in! 🎯
