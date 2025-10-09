# Testing Guide - VISITOR and SUPPLIER Roles

## ✅ Issue Fixed

The "Access Denied" error has been fixed by adding VISITOR support to the `/api/supplier/auth/me` endpoint.

## 🚀 How to Test

### 1. Start Your Development Server

```bash
pnpm run dev
```

Visit: `http://localhost:3000`

---

## 🎭 Test Accounts

### VISITOR Account (Demo Mode)
- **Email**: `visitor@demo.com`
- **Password**: `Visitor123!`
- **Purpose**: Read-only access to showcase features

### SUPPLIER Account  
- **Email**: `supplier@demo.com`
- **Password**: `Supplier123!`
- **Purpose**: Full supplier dashboard access

---

## 📋 Testing Checklist

### Test 1: VISITOR - Admin Dashboard Access

1. **Logout** if you're currently logged in
2. Go to: `http://localhost:3000/auth/login`
3. Login with `visitor@demo.com` / `Visitor123!`
4. Navigate to: `http://localhost:3000/admin`

**Expected Results:**
- ✅ Should see admin dashboard
- ✅ Blue demo mode banner at top saying "Demo Mode - Read Only Access"
- ✅ Can view all pages and data
- ✅ Stats and charts visible

5. Try to create a product:
   - Go to `/admin/products`
   - Try to add/edit/delete a product

**Expected Results:**
- ✅ Should see friendly error: "Demo Mode - Read Only Access"
- ✅ No data is modified

---

### Test 2: VISITOR - Supplier Dashboard Access

1. While still logged in as VISITOR
2. Navigate to: `http://localhost:3000/supplier/dashboard`

**Expected Results:**
- ✅ Should see supplier dashboard
- ✅ Blue demo mode banner visible
- ✅ Shows "Demo Supplier (Visitor Mode)" in company name
- ✅ Can view all supplier pages
- ✅ Sample data is displayed

3. Try to create a product as supplier:
   - Go to `/supplier/products`
   - Try to add/edit a product

**Expected Results:**
- ✅ Should see friendly error: "Demo Mode - Read Only Access"
- ✅ No data is modified

---

### Test 3: SUPPLIER - Full Access

1. **Logout** completely
2. Go to: `http://localhost:3000/auth/login`
3. Login with `supplier@demo.com` / `Supplier123!`
4. Navigate to: `http://localhost:3000/supplier/dashboard`

**Expected Results:**
- ✅ Should see supplier dashboard
- ✅ NO demo mode banner (you're a real supplier)
- ✅ Shows "Demo Supplier" company name
- ✅ Full access to all features
- ✅ Can create/edit/delete products

5. Test creating a product:
   - Go to `/supplier/products`
   - Click "Add Product"
   - Fill in product details
   - Submit

**Expected Results:**
- ✅ Product creation should work
- ✅ No "demo mode" errors
- ✅ Full CRUD operations available

6. Try accessing admin dashboard:
   - Go to `http://localhost:3000/admin`

**Expected Results:**
- ✅ Should be redirected (suppliers can't access admin)

---

### Test 4: Existing Roles Still Work

#### Test ADMIN Role:
1. Logout
2. Login with your admin account
3. Access `/admin`

**Expected Results:**
- ✅ Full admin access
- ✅ No demo banner
- ✅ Can create/edit/delete everything
- ✅ No restrictions

#### Test CUSTOMER Role:
1. Logout
2. Login with a customer account
3. Try to access `/admin` or `/supplier/dashboard`

**Expected Results:**
- ✅ Redirected to home page
- ✅ Normal shopping/customer features work
- ✅ Cannot access admin or supplier areas

---

## 🔍 Troubleshooting

### Issue: "Access Denied" for SUPPLIER account

**Solution:**
1. Make sure you're logging in through the regular login page (`/auth/login`)
2. NOT through the admin login page (`/admin/login`)
3. Clear your cookies and try again
4. Check browser console for errors

### Issue: VISITOR can't access supplier dashboard

**Solution:**
1. Make sure the dev server is restarted: `pnpm run dev`
2. Clear browser cache and cookies
3. Login again as VISITOR
4. Check that the fix was pushed to your codebase

### Issue: No demo banner showing

**Solution:**
1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for JavaScript errors
3. Verify you're logged in as VISITOR role

### Issue: SUPPLIER can create products but shouldn't

**Solution:**
- This is correct! SUPPLIER role SHOULD be able to create products
- Only VISITOR role should be blocked from write operations

---

## 🎯 What Each Role Can Do

| Action | CUSTOMER | ADMIN | SUPPLIER | VISITOR |
|--------|----------|-------|----------|---------|
| View Products | ✅ | ✅ | ✅ | ✅ |
| Buy Products | ✅ | ✅ | ❌ | ❌ |
| Admin Dashboard | ❌ | ✅ | ❌ | ✅ (Read) |
| Supplier Dashboard | ❌ | ✅ | ✅ | ✅ (Read) |
| Create Products (Admin) | ❌ | ✅ | ❌ | ❌ |
| Create Products (Supplier) | ❌ | ❌ | ✅ | ❌ |
| Edit/Delete Data | ❌ | ✅ | ✅ (Own) | ❌ |

---

## 📝 Quick Test Commands

### Check Account Status:
```bash
npx tsx prisma/check-supplier-account.ts
```

### View in Prisma Studio:
```bash
npx prisma studio
```

Then navigate to the User table to verify roles.

---

## ✅ Success Criteria

You should see:
1. ✅ VISITOR can login and view both dashboards
2. ✅ VISITOR sees demo banners everywhere
3. ✅ VISITOR gets friendly errors when trying to write
4. ✅ SUPPLIER can login and access supplier dashboard
5. ✅ SUPPLIER has full access to supplier features
6. ✅ SUPPLIER cannot access admin dashboard
7. ✅ No console errors during testing
8. ✅ All navigation works smoothly

---

## 🆘 Still Having Issues?

If you're still seeing "Access Denied":

1. **Clear ALL browser data:**
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Clear site data"
   - Restart browser

2. **Verify database:**
   ```bash
   npx tsx prisma/check-supplier-account.ts
   ```
   Should show:
   - VISITOR role: VISITOR ✅
   - SUPPLIER role: SUPPLIER ✅
   - SUPPLIER status: APPROVED ✅

3. **Check server logs:**
   - Look for authentication errors
   - Check middleware logs
   - Verify session is being created

4. **Test with Incognito/Private mode:**
   - Opens a clean session
   - No cached data interfering

---

## 🎉 You're All Set!

Both roles are now working correctly:
- **VISITOR**: Perfect for demos and showcasing
- **SUPPLIER**: Ready for third-party sellers

Happy testing! 🚀

