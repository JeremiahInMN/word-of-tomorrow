# Local Word Generation

Generate words locally using your GitHub Copilot/OpenCode subscription - **completely free!**

## Why Use This?

Instead of paying for Google Gemini API:
- ✅ **Free** - Uses your existing Copilot/OpenCode subscription
- ✅ **No surprises** - Zero API costs
- ✅ **Full control** - Review and approve every word before it goes live
- ✅ **Direct to database** - Words go straight to Supabase

**What you give up:**
- ❌ No AI-generated images (uses nice placeholder SVGs instead)
- ❌ No audio pronunciation (text pronunciation guide is still there)

## Setup

1. **Get an Anthropic API key** (optional - OpenCode can provide this)
   - If you don't have one, leave `ANTHROPIC_API_KEY` blank in `.env`
   - The script will use OpenCode's connection automatically

2. **Make sure your Supabase database is set up**
   - Run the SQL from `supabase-schema.sql` in your Supabase SQL editor if you haven't already

## Usage

### Quick Start

```bash
npm run generate
```

Then follow the prompts!

### With a topic

```bash
node scripts/generate-word.js "space travel"
node scripts/generate-word.js "kitchen accidents"
node scripts/generate-word.js "awkward social situations"
```

## How It Works

1. **Script asks for a topic** (or you provide one as an argument)
2. **AI generates a word** with definition, pronunciation, example, origin
3. **You review the word** - it shows you everything
4. **You approve or reject** - type `y` to save, `n` to discard
5. **If approved, it saves to Supabase** automatically with the next available date
6. **Word appears in your app** immediately!

## Example Output

```
🎭 Word of Tomorrow - Local Word Generator
==========================================

🎨 Generating word...

============================================================
📖 Flumbergast
============================================================
🔊 Pronunciation: FLUM-ber-gast
📝 Part of Speech: verb

💡 Definition:
   To become so confused by simple instructions that you 
   accidentally do the exact opposite of what was intended.

💬 Example:
   "I tried to follow the recipe, but I flumbergasted it 
   and ended up with dessert pizza instead of dinner."

🌍 Origin:
   From Old English "flumber" (to fumble) combined with 
   "aghast" (horrified by one's own mistakes).
============================================================

Do you want to save this word? (y/n):
```

## Tips

- **Generate multiple words** - Run the script as many times as you want
- **Be creative with topics** - The more specific, the funnier the results
- **Review carefully** - Make sure it matches your brand/style
- **Schedule fills automatically** - Words are scheduled for the next available day

## Troubleshooting

**"Anthropic API key not found"**
- Add `ANTHROPIC_API_KEY` to your `.env` file
- Or ask OpenCode to help you get one

**"Supabase credentials not found"**
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in your `.env` file

**"Error saving word"**
- Make sure you've run the SQL from `supabase-schema.sql` to create the tables

## Cost Comparison

**Using this script:**
- Cost per word: **$0.00** (uses your Copilot subscription)
- Monthly limit: Copilot's generous rate limits

**Using Gemini API:**
- Cost per word: **$0.04 - $0.10** (with image/audio)
- Need to set up billing, monitor usage, etc.

## Next Steps

Once you have a few words:
1. Check your app at http://localhost:3000
2. Generate more words whenever you want
3. No billing, no worries!

Enjoy! 🎉
