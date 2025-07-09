# Vercel Environment Variables Setup

## Fix Authentication Issue

Your authentication is redirecting to localhost because the `NEXTAUTH_URL`
environment variable is not set correctly in Vercel.

## Steps to Fix:

### 1. Go to Vercel Dashboard

- Visit: https://vercel.com/dashboard
- Select your project: `stem-toys-3`

### 2. Go to Environment Variables

- Click on your project
- Go to **Settings** tab
- Click **Environment Variables** in the sidebar

### 3. Add/Update These Environment Variables

**REQUIRED - Add this environment variable:**

| Name           | Value                            | Environment |
| -------------- | -------------------------------- | ----------- |
| `NEXTAUTH_URL` | `https://stem-toys-3.vercel.app` | Production  |

**OPTIONAL - Verify these are set:**

| Name                   | Value                         | Environment |
| ---------------------- | ----------------------------- | ----------- |
| `NEXTAUTH_SECRET`      | `[your-secret-key]`           | Production  |
| `GOOGLE_CLIENT_ID`     | `[your-google-client-id]`     | Production  |
| `GOOGLE_CLIENT_SECRET` | `[your-google-client-secret]` | Production  |

### 4. Update Google OAuth Settings

**Important:** You also need to update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In **Authorized redirect URIs**, add:
   ```
   https://stem-toys-3.vercel.app/api/auth/callback/google
   ```
6. Make sure to also keep your localhost URI for development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### 5. Redeploy

After setting the environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Testing

After the deployment completes:

1. Visit: https://stem-toys-3.vercel.app
2. Try to sign in with Google
3. You should no longer be redirected to localhost

## Common Issues

- **Still redirecting to localhost?**
  - Make sure `NEXTAUTH_URL` is set to `https://stem-toys-3.vercel.app` (with
    https://)
  - Redeploy after setting the environment variable

- **Google OAuth error?**
  - Check that the redirect URI in Google Console matches exactly:
    `https://stem-toys-3.vercel.app/api/auth/callback/google`
  - Make sure your Google Client ID and Secret are correctly set in Vercel

- **Configuration error?**
  - Verify `NEXTAUTH_SECRET` is set and is at least 32 characters long
