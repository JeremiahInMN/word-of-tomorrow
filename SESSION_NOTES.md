# Word of Tomorrow - Development Session Notes

**Last Updated:** January 30, 2026

---

## Current Session Summary

### What We Just Completed ✅
1. **Google OAuth Authentication Implementation**
   - Integrated Google OAuth for user sign-in
   - Created protected admin route requiring authentication
   - Built auth context system with React Context API
   - Fixed race conditions and AbortError issues by creating dedicated auth client
   - Cleaned up debug logging
   - **Committed to git:** Auth system committed (commit hash: 1190f67)
   - Added SESSION_NOTES.md for context recovery

2. **Vercel Deployment & Supabase Integration** ✅
   - Deployed to Vercel at: `https://word-of-tomorrow.vercel.app`
   - Added Supabase redirect URLs to authentication settings:
     - `https://word-of-tomorrow.vercel.app/auth/callback`
     - `https://word-of-tomorrow.vercel.app/**`
   - Added environment variables to Vercel:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deployment successful and working

3. **Custom Domain Setup** ✅
   - Connected custom domain: `https://wordoftomorrow.com`
   - Configured DNS records in Namecheap (apex + www subdomain)
   - Updated Supabase redirect URLs for custom domain:
     - `https://wordoftomorrow.com/auth/callback`
     - `https://wordoftomorrow.com/**`
     - `https://www.wordoftomorrow.com/auth/callback`
     - `https://www.wordoftomorrow.com/**`
   - Updated Google OAuth authorized origins
   - Updated Supabase Site URL to custom domain

4. **Social Sharing Feature** ✅
   - Implemented native Web Share API for mobile devices
   - Added fallback dropdown menu for desktop browsers
   - Copy link functionality with visual feedback
   - Added Open Graph and Twitter Card meta tags
   - **Committed to git:** Social sharing feature (commit hash: b6df314)

5. **Automated Facebook Page Posting** ✅
   - Implemented GitHub Actions workflow for daily posting at 8:00 AM UTC
   - Created posting script that fetches word from Supabase and posts to Facebook
   - Posts include: word, pronunciation, definition, example, origin, and illustration image
   - Tested Facebook Graph API connection successfully
   - Configured GitHub Secrets: `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Smart posting logic: skips posting if no word scheduled or no illustration available
   - Manual trigger available for testing via GitHub Actions UI
   - **Target:** Word of Tomorrow Facebook Entertainment Page (ID: 891171130756125)

### Technical Decisions Made

#### Authentication Architecture
- **Why separate `authClient` and `supabase` clients?**
  - Multiple components making simultaneous Supabase requests caused AbortErrors
  - Dedicated `authClient` isolates auth operations from app data fetches
  - Prevents request cancellation conflicts

- **Why HashRouter?**
  - Already in use by the project
  - OAuth callback handling required special `#/#` URL parsing

- **Why manual `setSession()`?**
  - Supabase's automatic OAuth handling wasn't working with HashRouter
  - Manual token extraction and session setting provided reliable flow

#### Database Schema
- **`users` table** (separate from `auth.users`):
  ```sql
  - id (UUID, references auth.users)
  - email (TEXT)
  - is_admin (BOOLEAN, default false)
  - created_at (TIMESTAMP)
  ```
- **Why separate users table?**
  - Store custom fields like `is_admin` flag
  - `auth.users` is managed by Supabase and shouldn't be modified directly

#### Admin Access
- User: `jeremiah.l.peterson@gmail.com`
- Status: `is_admin = true` (set via SQL)
- Access: Can see Admin link in navbar, access /admin route

#### Facebook Posting Architecture
- **Why GitHub Actions for posting?**
  - Scheduled automation runs at 8:00 AM UTC daily
  - No need for separate server infrastructure
  - Uses repository secrets for secure token storage
  - Easy manual triggering for testing

- **Why skip posts without illustrations?**
  - Facebook visual content performs significantly better
  - Maintains consistent brand quality
  - Image is a key part of the Word of Tomorrow experience

- **Posting Flow:**
  1. GitHub Actions triggers at 8:00 AM UTC (or manual trigger)
  2. Script queries Supabase for today's published word
  3. Validates word exists and has illustration
  4. Downloads illustration from Supabase Storage
  5. Posts to Facebook Graph API `/photos` endpoint
  6. Logs success or error (fails gracefully if no content)

---

## Project Structure

### Key Files
- **Authentication:**
  - `contexts/AuthContext.tsx` - Auth state management
  - `services/auth.ts` - Auth helper functions
  - `services/supabase.ts` - Supabase client setup (exports both `supabase` and `authClient`)
  - `components/ProtectedRoute.tsx` - Route guard for admin pages
  - `pages/LoginPage.tsx` - Google sign-in page

- **Pages:**
  - `pages/HomePage.tsx` - Public landing page with featured word
  - `pages/AdminPage.tsx` - Admin panel (protected)
  - `pages/ArchivePage.tsx` - Past words archive
  - `pages/CommunityPage.tsx` - Community submissions (hidden from nav)

- **Configuration:**
  - `.env` - Contains Supabase credentials (gitignored)
  - `supabase-schema.sql` - Database schema (words, submissions tables)
  - `.github/workflows/post-to-facebook.yml` - Daily Facebook posting automation

- **Scripts:**
  - `scripts/generate-word.js` - AI word generation script
  - `scripts/post-to-facebook.js` - Facebook posting automation

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite
- **Routing:** React Router v7 (HashRouter)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** Google Gemini, Anthropic Claude (for word generation)
- **Automation:** GitHub Actions (for scheduled Facebook posting)

---

## Known Issues / Technical Debt

### Uncommitted Changes (From Previous Sessions)
There are uncommitted changes in the working directory that predate this session:
- `components/WordCard.tsx`, `pages/AdminPage.tsx`, `pages/HomePage.tsx`
- `services/gemini.ts`, `services/store.ts`
- `package.json`, `vite.config.ts`
- Untracked files: `SETUP.md`, `CalendarView.tsx`, `UsageStatsCard.tsx`, etc.

**Action:** Review these changes in a future session to determine if they should be committed.

### Resolved ✅
- ~~AbortError during OAuth callback~~ - Fixed with dedicated authClient
- ~~Race condition between init() and SIGNED_IN event~~ - Fixed by returning early from init()
- ~~Double hash in OAuth redirect URL (`/#/#`)~~ - Handled with custom parsing
- ~~Audio playback not working~~ - Fixed by correcting MIME type in upload process (changed .bin to .wav with proper Content-Type)
- ~~Share button non-functional~~ - Implemented native share API + copy link fallback

### Current Issues

#### Facebook Mobile Share Limitation 🔄 (Deferred)
- **Issue:** When sharing to Facebook via mobile native share API, only the URL is shared (not the word text + definition)
- **Root Cause:** Facebook mobile app ignores the `text` field from Web Share API by design (anti-spam measure)
- **Current Behavior:** 
  - Mobile users see native share sheet with full text
  - Facebook app only uses the URL and fetches Open Graph preview
  - Generic site preview shown (not word-specific)
- **Potential Solutions:**
  1. **Create individual word pages** with dynamic Open Graph tags (best long-term solution)
     - Requires: New routes `/word/[id]`, dynamic meta tags, SSR or Edge Functions
     - Effort: Medium-High (3-4 hours)
     - Benefits: Proper social previews, SEO benefits, professional approach
  2. **Improve copy link functionality** to copy text + URL together
     - Users manually paste into Facebook
     - Effort: Low (15 minutes)
  3. **Accept current behavior** as Facebook platform limitation
- **Decision:** Deferred to focus on more important features. Revisit when individual word pages are needed.
- **Workaround:** Users can manually add text when sharing to Facebook

---

## Roadmap / Future Plans

### Next Steps 🎯
- ✅ ~~Custom Domain Setup~~ - COMPLETED (wordoftomorrow.com connected)
- ✅ ~~Social Sharing Feature~~ - COMPLETED (native share API + copy link)

### Authentication & Authorization
- [ ] Add role-based permissions (editor, moderator, admin)
- [ ] User profile page
- [ ] Admin dashboard to manage users

### Content Management
- [ ] Word scheduling interface improvements
- [ ] Bulk word import/export
- [ ] Word preview before publishing
- [ ] Draft/published workflow

### Community Features
- [ ] Enable community submissions page
- [ ] Voting system for community words
- [ ] User-submitted definitions
- [ ] Leaderboard for contributors

### AI Features
- [ ] Improve word generation prompts
- [ ] Add pronunciation audio generation
- [ ] Generate word illustrations with AI
- [ ] Etymology generation

### User Experience
- [ ] Email notifications for new words
- [ ] Word of the day RSS feed
- ✅ ~~Social sharing for words~~ - COMPLETED (native share + copy link)
- [ ] Search/filter in archive
- [ ] Calendar view for scheduled words

### Social Sharing & SEO
- [ ] **Create individual word pages** - `/word/[id]` or `/word/[date]` routes
  - Enables dynamic Open Graph tags per word
  - Improves Facebook/Twitter share previews
  - SEO benefits for individual words
  - Shareable links to specific words
  - **Priority:** Medium (deferred after Facebook share limitation discussion)
- [ ] Enhance copy link to include word text + URL
- [ ] Add share analytics tracking
- [ ] Create custom Open Graph image (logo/banner)

### Technical Improvements
- [ ] Add comprehensive error handling
- [ ] Implement loading states throughout
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Analytics integration

---

## Environment Setup

### Required `.env` Variables
```bash
VITE_SUPABASE_URL=https://zvvzbstfuqdaavswtxlb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-key>

# For local testing of Facebook posting script (optional)
FB_PAGE_ID=891171130756125
FB_PAGE_ACCESS_TOKEN=<your-long-lived-page-token>
```

### Google OAuth Setup
- **OAuth Client ID:** Configured in Google Cloud Console
- **Authorized Origins:** 
  - `http://localhost:3000`
  - `https://zvvzbstfuqdaavswtxlb.supabase.co`
  - `https://wordoftomorrow.com`
  - `https://www.wordoftomorrow.com`
- **Redirect URI:** `https://zvvzbstfuqdaavswtxlb.supabase.co/auth/v1/callback`

### Supabase Configuration
- Google OAuth provider enabled in Supabase Dashboard
- RLS policies enabled on `words` and `submissions` tables
- Admin user manually set via SQL
- **Redirect URLs configured:**
  - `https://word-of-tomorrow.vercel.app/auth/callback`
  - `https://word-of-tomorrow.vercel.app/**`
  - `https://wordoftomorrow.com/auth/callback`
  - `https://wordoftomorrow.com/**`
  - `https://www.wordoftomorrow.com/auth/callback`
  - `https://www.wordoftomorrow.com/**`
- **Site URL:** `https://wordoftomorrow.com`

### Vercel Deployment
- **Live URL:** `https://wordoftomorrow.com` (primary)
- **Vercel URL:** `https://word-of-tomorrow.vercel.app` (fallback)
- **Environment Variables Set:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Custom Domain:** Configured via Namecheap DNS (A record + CNAME for www)

### GitHub Actions / Secrets
- **Repository Secrets Configured:**
  - `FB_PAGE_ID` - Facebook page ID (891171130756125)
  - `FB_PAGE_ACCESS_TOKEN` - Long-lived page access token (~60 day expiry)
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

- **Automated Workflows:**
  - **Post to Facebook** - Runs daily at 8:00 AM UTC
    - Posts Word of the Day to Facebook page
    - Includes formatted text and illustration image
    - Skips gracefully if no word or no image
    - Can be manually triggered via Actions tab for testing

---

## Development Commands
```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Build for production
npm run preview   # Preview production build
npm run generate  # Generate new word with AI

# Facebook posting (requires FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN in .env)
node scripts/post-to-facebook.js  # Test Facebook posting locally
```

---

## Important Notes

### OAuth Callback Flow
1. User clicks "Sign In" → redirected to Google
2. Google redirects back with `#access_token=...&refresh_token=...`
3. AuthContext detects tokens in URL hash
4. Manually calls `authClient.auth.setSession()` with tokens
5. SIGNED_IN event fires → `handleSignIn()` fetches user profile
6. UI updates to show "Sign Out" and "Admin" link

### Retry Logic
- User profile fetching has 3-retry logic with 200ms delays
- Handles transient AbortErrors gracefully
- Only logs errors on final failure

### Session Persistence
- Sessions stored in browser localStorage
- Auto-refresh token enabled
- Shared between `supabase` and `authClient` instances

### Facebook Posting
- **Schedule:** Daily at 8:00 AM UTC via GitHub Actions
- **Post Format:**
  ```
  📖 Word of Tomorrow

  [WORD] ([pronunciation]) — [part of speech]

  Definition:
  [definition]

  Example:
  "[example]"

  Origin:
  [origin]

  🌐 Learn more at wordoftomorrow.com
  ```
  Plus the illustration image attached

- **Post Requirements:**
  - Word must be scheduled for today with `status = 'published'`
  - Word must have an `illustrationUrl` (skips if missing)
  - Illustration must be publicly accessible (Supabase Storage URL)

- **Testing Workflow:**
  1. Go to GitHub repository → Actions tab
  2. Select "Post to Facebook" workflow
  3. Click "Run workflow" → "Run workflow" button
  4. Watch logs to see if posting succeeds
  5. Check Facebook page for the post

- **Troubleshooting:**
  - **No post appears:** Check GitHub Actions logs for errors
  - **"No word scheduled":** Ensure a word is scheduled for today's date
  - **"No illustration":** Word needs an illustrationUrl in Supabase
  - **"Invalid token":** Facebook page access token may have expired (refresh ~every 60 days)
  - **Image download fails:** Check illustration URL is publicly accessible
  - **Facebook API error:** Check token permissions include `pages_manage_posts`

---

## How to Use This File

**If you lose context in OpenCode:**
1. Copy the entire contents of this file
2. Start a new conversation
3. Paste: "Here's where we left off: [paste file contents]"
4. Continue from where you left off!

**Keep this file updated:**
- Add new features as they're completed
- Document important decisions
- Track bugs and their resolutions
- Update roadmap as priorities change

---

## Quick Context Recovery Prompt

If you need to quickly restore context, paste this:

```
I'm working on Word of Tomorrow, a React/TypeScript app with Supabase backend. 
App is deployed at https://wordoftomorrow.com with Google OAuth authentication.
Recent work: Added automated Facebook posting feature that posts Word of the Day at 8am UTC daily.
Facebook page: Word of Tomorrow (ID: 891171130756125)
Known limitation: Facebook mobile share only shows URL (need individual word pages for full text preview).
Current user (jeremiah.l.peterson@gmail.com) is set as admin.
Please read SESSION_NOTES.md for full context.
```
