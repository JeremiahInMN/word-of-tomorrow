# Word of Tomorrow - Development Session Notes

**Last Updated:** January 25, 2026

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

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite
- **Routing:** React Router v7 (HashRouter)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** Google Gemini, Anthropic Claude (for word generation)

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

### Current Issues
- None currently blocking

---

## Roadmap / Future Plans

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
- [ ] Social sharing for words
- [ ] Search/filter in archive
- [ ] Calendar view for scheduled words

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
```

### Google OAuth Setup
- **OAuth Client ID:** Configured in Google Cloud Console
- **Authorized Origins:** `http://localhost:3000`, `https://zvvzbstfuqdaavswtxlb.supabase.co`
- **Redirect URI:** `https://zvvzbstfuqdaavswtxlb.supabase.co/auth/v1/callback`

### Supabase Configuration
- Google OAuth provider enabled in Supabase Dashboard
- RLS policies enabled on `words` and `submissions` tables
- Admin user manually set via SQL

---

## Development Commands
```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Build for production
npm run preview   # Preview production build
npm run generate  # Generate new word with AI
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
We just finished implementing Google OAuth authentication with protected admin routes.
The auth system uses a dedicated authClient to avoid request conflicts.
Current user (jeremiah.l.peterson@gmail.com) is set as admin.
Everything is working. Please read SESSION_NOTES.md for full context.
What should we work on next?
```
