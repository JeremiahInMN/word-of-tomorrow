// Facebook Posting Script for Word of Tomorrow
// Generates content for manual posting to Facebook (with image support)

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!FB_PAGE_ID) console.error('  - FB_PAGE_ID');
  if (!FB_PAGE_ACCESS_TOKEN) console.error('  - FB_PAGE_ACCESS_TOKEN');
  if (!SUPABASE_URL) console.error('  - VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.error('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get tomorrow's date in YYYY-MM-DD format
// "Word of Tomorrow" shows the word scheduled for tomorrow's date
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Format the Facebook post message with hashtags disclaimer at bottom
function formatMessage(word) {
  return `📖 Word of Tomorrow

${word.word} (${word.pronunciation}) — ${word.part_of_speech}

Definition:
${word.definition}

Example:
${word.example}

Origin:
${word.origin}

🌐 Learn more at wordoftomorrow.com

#satire #notarealword #entertainment #madeupwords #wordoftheday`;
}

// Download image from URL to buffer
async function downloadImage(url) {
  console.log(`📥 Downloading image from: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.buffer();
  console.log(`✅ Image downloaded (${buffer.length} bytes)`);
  return buffer;
}

// Save image locally for manual upload
function saveImageLocally(imageBuffer, word) {
  const date = getTomorrowDate();
  const dirPath = join(process.cwd(), 'facebook-posts', date);
  
  // Create directory if it doesn't exist
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  
  const filename = `${word.word.toLowerCase()}.jpg`;
  const filepath = join(dirPath, filename);
  writeFileSync(filepath, imageBuffer);
  console.log(`💾 Image saved to: ${filepath}`);
  return filepath;
}

// Save post text to file for easy copying
function saveTextLocally(message, word) {
  const date = getTomorrowDate();
  const dirPath = join(process.cwd(), 'facebook-posts', date);
  
  // Create directory if it doesn't exist
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  
  const filename = `${word.word.toLowerCase()}.txt`;
  const filepath = join(dirPath, filename);
  writeFileSync(filepath, message, 'utf-8');
  console.log(`📄 Text saved to: ${filepath}`);
  return filepath;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Facebook posting script...');
    console.log(`📅 Tomorrow's date: ${getTomorrowDate()}`);
    
    // Fetch tomorrow's word from Supabase (matching website's "Word of Tomorrow" concept)
    console.log('🔍 Fetching tomorrow\'s word from Supabase...');
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .eq('scheduled_date', getTomorrowDate())
      .eq('status', 'published');
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    // Check if word exists
    if (!words || words.length === 0) {
      console.log('ℹ️  No word scheduled for tomorrow. Skipping post.');
      process.exit(0);
    }
    
    const word = words[0];
    console.log(`✅ Found word: "${word.word}"`);
    
    // Format message
    const message = formatMessage(word);
    
    // Check if word has illustration
    let imagePath = null;
    if (word.illustration_url) {
      console.log(`🖼️  Illustration URL: ${word.illustration_url}`);
      
      // Download and save illustration locally
      try {
        const imageBuffer = await downloadImage(word.illustration_url);
        imagePath = saveImageLocally(imageBuffer, word);
      } catch (error) {
        console.warn(`⚠️  Could not download illustration: ${error.message}`);
        console.log('ℹ️  Continuing without image...');
      }
    } else {
      console.log('ℹ️  Word has no illustration.');
    }
    
    // Save text to file for easy copying
    const textPath = saveTextLocally(message, word);
    
    // Output content for manual posting
    console.log('\n' + '='.repeat(80));
    console.log('📋 COPY THIS TEXT TO POST TO FACEBOOK:');
    console.log('='.repeat(80));
    console.log(message);
    console.log('='.repeat(80));
    
    console.log(`\n📄 Text saved to: ${textPath}`);
    if (imagePath) {
      console.log(`📸 Image saved to: ${imagePath}`);
    }
    console.log(`\n🌐 Facebook Page: https://www.facebook.com/${FB_PAGE_ID}`);
    console.log('\n✅ Content ready for manual posting!');
    console.log('   TIP: Open the .txt file and copy the text from there.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
