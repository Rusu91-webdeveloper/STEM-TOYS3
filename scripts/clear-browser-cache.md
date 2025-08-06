# Browser Cache Clearing Guide

## Issue Description

You're experiencing a critical client-side error that only occurs in one Chrome
account (your admin account) but not another. This is likely due to cached
authentication data, session tokens, or browser extensions interfering with the
application.

## Error Details

- **Error**: "Cannot read properties of undefined (reading 'call')"
- **Location**: Webpack bundling system
- **Scope**: Only affects one specific Chrome account
- **Root Cause**: Likely cached session data or browser extensions

## Solution Steps

### 1. Clear Browser Cache and Data

1. Open Chrome with the problematic account
2. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
3. Set time range to "All time"
4. Check the following items:
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - ✅ Site settings
   - ✅ Hosted app data
5. Click "Clear data"

### 2. Clear Application-Specific Data

1. Go to `chrome://settings/content/all`
2. Search for `localhost:3000` or your domain
3. Click the trash icon to remove all data for the site
4. Also clear data for any related domains

### 3. Disable Extensions Temporarily

1. Go to `chrome://extensions/`
2. Disable all extensions temporarily
3. Test the application
4. If it works, re-enable extensions one by one to identify the problematic one

### 4. Clear Local Storage and Session Storage

1. Open Developer Tools (F12)
2. Go to Application tab
3. Under Storage, clear:
   - Local Storage
   - Session Storage
   - IndexedDB
   - Web SQL

### 5. Test in Incognito Mode

1. Open an incognito window
2. Navigate to your application
3. If it works in incognito, the issue is definitely cached data

### 6. Reset Chrome Profile (Last Resort)

If the above steps don't work:

1. Go to `chrome://settings/`
2. Scroll down to "Advanced"
3. Click "Reset settings"
4. Choose "Restore settings to their original defaults"

## Prevention

- Regularly clear browser cache during development
- Use incognito mode for testing
- Consider using different browser profiles for different accounts
- Keep extensions minimal during development

## Technical Details

The error occurs in the webpack bundling system, specifically in the React
Server Components client-side hydration process. This suggests that cached
authentication tokens or session data are interfering with the component
rendering.

## Additional Debugging

If the issue persists, check:

1. Network tab in DevTools for failed requests
2. Console for additional error messages
3. Application tab for stored authentication data
4. Check if the issue occurs in other browsers (Firefox, Safari)
