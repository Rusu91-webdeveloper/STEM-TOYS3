# Google OAuth ClientFetchError Fix

## Issue Summary
The `ClientFetchError` was occurring when users attempted to sign in with Google OAuth. This error typically indicates that the client-side Auth.js code cannot properly communicate with the authentication API endpoint.

## Root Causes Identified

1. **Incorrect Callback URL Configuration**: The GoogleSignInButton was using a custom callback URL format that didn't properly integrate with NextAuth's OAuth flow.

2. **Missing OAuth Authorization Parameters**: The Google OAuth provider was missing important authorization parameters (`prompt: "consent"`, `access_type: "offline"`) that ensure reliable token handling.

3. **Insufficient Error Handling**: The OAuth callback flow lacked proper error detection and handling for OAuth-specific errors.

4. **SessionProvider Configuration**: Missing error handling callback in the SessionProvider component.

## Fixes Applied

### 1. Updated GoogleSignInButton (`components/auth/GoogleSignInButton.tsx`)
- Fixed the callback URL construction to properly use NextAuth's standard callback format
- Improved error handling to properly catch and report OAuth errors
- Added proper cleanup of localStorage flags on error

### 2. Enhanced Google OAuth Provider Configuration (`lib/server/auth.ts`)
- Added `authorization` parameters to GoogleProvider:
  - `prompt: "consent"` - Ensures Google prompts for consent
  - `access_type: "offline"` - Enables refresh token support
  - `response_type: "code"` - Uses authorization code flow

### 3. Improved Auth Callback Page (`app/auth/callback/page.tsx`)
- Added detection for OAuth errors in URL parameters
- Enhanced session polling with better error handling
- Added proper cleanup of OAuth in-progress flags
- Improved timeout and retry logic

### 4. Enhanced Auth Route Handler (`app/api/auth/[...nextauth]/route.ts`)
- Added logging for OAuth callback requests
- Improved error handling for OAuth callbacks with proper redirects to error page
- Better error messages for debugging

### 5. Updated SessionProvider (`components/auth/SafeSessionProvider.tsx`)
- Added `onError` callback to handle session errors gracefully
- Improved error filtering to prevent noise from ClientFetchError

### 6. Enhanced Error Page (`app/auth/error/page.tsx`)
- Added specific error handling for `ClientFetchError`
- Added helpful troubleshooting steps for users

## Required Configuration Checks

### Environment Variables
Ensure these are set correctly:

```bash
# Required for NextAuth
NEXTAUTH_URL=http://localhost:3000  # Development
# or
NEXTAUTH_URL=https://yourdomain.com  # Production

NEXTAUTH_SECRET=your-secret-minimum-32-characters

# Required for Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Alternative (NextAuth v5 standard)
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### Google Cloud Console Configuration

1. **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

2. **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

⚠️ **IMPORTANT**: The redirect URI must match exactly, including:
- Protocol (http/https)
- Domain
- Path: `/api/auth/callback/google`

## Testing the Fix

1. **Clear browser cache and cookies** for your domain
2. **Verify environment variables** are set correctly
3. **Check Google Cloud Console** redirect URI matches your domain
4. **Test the sign-in flow**:
   - Click "Sign in with Google"
   - Complete Google OAuth consent
   - Should redirect to `/auth/callback` then to `/account`

## Common Issues and Solutions

### Issue: Still seeing ClientFetchError
**Solution**: 
- Verify `NEXTAUTH_URL` matches your actual domain
- Check browser console for specific error messages
- Verify Google OAuth redirect URI in Google Cloud Console matches exactly

### Issue: Redirects to error page after Google consent
**Solution**:
- Check server logs for specific error messages
- Verify database connection is working
- Ensure user creation/update logic in `signIn` callback is working

### Issue: Session not persisting after sign-in
**Solution**:
- Check that cookies are being set (browser DevTools > Application > Cookies)
- Verify `NEXTAUTH_SECRET` is set and is at least 32 characters
- Check that `trustHost: true` is set in auth config (already done)

## Next Steps

1. **Test in development** with `NEXTAUTH_URL=http://localhost:3000`
2. **Deploy to production** and update:
   - `NEXTAUTH_URL` to production domain
   - Google Cloud Console redirect URI to production domain
3. **Monitor logs** for any remaining issues
4. **Test with multiple browsers** to ensure compatibility

## Additional Notes

- The fix maintains backward compatibility with existing authentication flows
- All changes follow NextAuth.js v5 best practices
- Error handling is now more robust and user-friendly
- The OAuth flow now properly handles edge cases and errors
