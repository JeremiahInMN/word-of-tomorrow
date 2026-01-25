# Word of Tomorrow - Setup Instructions

## Issues Fixed

### 1. **Database Setup** 
The app needs Supabase database tables. Follow these steps:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-schema.sql` into the editor
5. Click "Run" to create the tables

If you don't want to use Supabase yet, the app will automatically fall back to using browser localStorage for storing words.

### 2. **Image Generation**
- Updated the model from `gemini-2.5-flash-image` to `imagen-3.0-generate-001`
- Added fallback placeholder image if generation fails
- The image will now show a placeholder with the word name if the API doesn't support image generation

### 3. **Text Generation Model**
- Updated from `gemini-3-flash-preview` to `gemini-2.0-flash-exp` (more stable)

## Testing the App

1. **Restart your dev server** (if it's still running, stop it with Ctrl+C and restart):
   ```bash
   npm run dev
   ```

2. **Go to the Admin page**: http://localhost:3000/#/admin

3. **Generate a word**:
   - Enter a topic (e.g., "space travel", "kitchen accidents")
   - Click "Generate Word"
   - Wait for the word to be generated
   - Click "Add to Queue" to save it

4. **View the word**: Go back to the home page and you should see your generated word!

## Storage Options

The app automatically detects which storage to use:

- **Supabase**: If you've set up the tables and have valid credentials in `.env`
- **Browser localStorage**: If Supabase is not configured (automatic fallback)

You can see which storage is being used in the Admin page under the "System" section.

## Troubleshooting

### Image generation still not working?
The Gemini API may not support image generation with your API key tier. The app will now work anyway with placeholder images. If you want real images, you might need:
- A different API key tier
- Or use a separate image generation service (like DALL-E, Stable Diffusion, etc.)

### Words not saving?
1. Check browser console for errors (F12 > Console tab)
2. If using Supabase, verify:
   - Tables are created (run `supabase-schema.sql`)
   - Your `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. If using localStorage, check that your browser allows it (not in private/incognito mode)

## Next Steps

Once everything is working, you can:
- Generate multiple words and build up your dictionary
- Customize the styling and theme
- Add more features to the Community page
- Deploy to Vercel (the app is already configured for it!)
