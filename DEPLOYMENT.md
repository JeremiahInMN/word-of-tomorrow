# Deploying Word of Tomorrow to Vercel

## Prerequisites
- GitHub repository (✅ already set up)
- Vercel account (sign up at vercel.com with your GitHub account)
- Supabase project (✅ already configured)
- Google OAuth credentials (✅ already configured)

## Deployment Steps

### 1. Initial Vercel Setup
1. Go to https://vercel.com
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub repositories

### 2. Import Your Project
1. From Vercel Dashboard, click "Add New..." → "Project"
2. Find `JeremiahInMN/word-of-tomorrow` in the list
3. Click "Import"

### 3. Configure Build Settings
Vercel should auto-detect Vite settings, but verify:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Add Environment Variables
Click "Environment Variables" and add:

```
VITE_SUPABASE_URL=https://zvvzbstfuqdaavswtxlb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-.env>
```

**Important:** Copy these values from your local `.env` file!

### 5. Deploy
1. Click "Deploy"
2. Wait for build to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://word-of-tomorrow.vercel.app`

### 6. Update Google OAuth Settings
After deployment, you need to add your Vercel URL to Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: "Word of Tomorrow"
3. Click Edit
4. Under "Authorized JavaScript origins", add:
   ```
   https://your-vercel-url.vercel.app
   ```
5. Under "Authorized redirect URIs", the Supabase redirect should already work:
   ```
   https://zvvzbstfuqdaavswtxlb.supabase.co/auth/v1/callback
   ```
6. Click "Save"

### 7. Update Supabase Site URL (Optional but Recommended)
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL": `https://your-vercel-url.vercel.app`
3. Add to "Redirect URLs": `https://your-vercel-url.vercel.app/#/`

### 8. Test Your Deployment
1. Visit your Vercel URL
2. Click "Sign In" and test Google OAuth
3. Verify admin functionality works
4. Check that words load correctly

## Custom Domain (Optional)
If you want to use a custom domain like `wordoftomorrow.com`:

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update your domain's DNS settings (Vercel will provide instructions)
4. Update Google OAuth and Supabase with the custom domain

## Automatic Deployments
Every time you push to the `main` branch on GitHub:
- Vercel will automatically build and deploy
- You'll get a preview URL for each deployment
- Production URL will update once build succeeds

## Environment-Specific Builds
Vercel supports environment variables for different environments:
- **Production**: Main branch deployments
- **Preview**: Pull request deployments
- **Development**: Local development

You can set different variables for each in Vercel Dashboard.

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors locally: `npm run build`

### OAuth Not Working
- Verify Vercel URL is added to Google OAuth authorized origins
- Check environment variables are set correctly in Vercel
- Ensure Supabase redirect URL is configured

### Blank Page on Load
- Check browser console for errors
- Verify environment variables are set
- Check HashRouter is working (URL should have `/#/`)

### Admin Access Not Working
- Verify your user is set as admin in Supabase `users` table
- Check you're logged in with correct Google account

## Monitoring
- View deployment logs in Vercel Dashboard
- Set up error tracking with Sentry or similar (future enhancement)
- Monitor Supabase dashboard for auth/database issues

## Cost
- **Vercel:** Free tier includes:
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Automatic SSL
  - Custom domains
  
- **Supabase:** Free tier includes:
  - 500 MB database
  - 1 GB file storage
  - 2 GB bandwidth
  - 50,000 monthly active users

Both should be more than sufficient for an MVP!
