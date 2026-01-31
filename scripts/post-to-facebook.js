// Facebook Posting Script for Word of Tomorrow
// Posts the Word of the Day to Facebook page with illustration

import fetch from 'node-fetch';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';
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

// Format the Facebook post message
function formatMessage(word) {
  return `📖 Word of Tomorrow

${word.word} (${word.pronunciation}) — ${word.part_of_speech}

Definition:
${word.definition}

Example:
${word.example}

Origin:
${word.origin}

🌐 Learn more at wordoftomorrow.com`;
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

// Post to Facebook with image
async function postToFacebook(message, imageBuffer) {
  console.log('📤 Posting to Facebook...');
  
  const form = new FormData();
  form.append('message', message);
  form.append('source', imageBuffer, {
    filename: 'word-illustration.jpg',
    contentType: 'image/jpeg'
  });
  form.append('access_token', FB_PAGE_ACCESS_TOKEN);
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`,
    {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Facebook API error: ${JSON.stringify(data)}`);
  }
  
  return data;
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
    
    // Check if word has illustration
    if (!word.illustration_url) {
      console.log('ℹ️  Word has no illustration. Skipping post.');
      process.exit(0);
    }
    
    console.log(`🖼️  Illustration URL: ${word.illustration_url}`);
    
    // Download illustration
    const imageBuffer = await downloadImage(word.illustration_url);
    
    // Format message
    const message = formatMessage(word);
    console.log('📝 Post message:');
    console.log('---');
    console.log(message);
    console.log('---');
    
    // Post to Facebook
    const result = await postToFacebook(message, imageBuffer);
    
    console.log('✅ Successfully posted to Facebook!');
    console.log(`📍 Post ID: ${result.id}`);
    console.log(`🔗 Post URL: https://facebook.com/${result.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
