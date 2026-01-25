#!/usr/bin/env node

/**
 * Word Generator Script
 * 
 * This script generates made-up words using AI and allows you to review
 * and approve them before pushing to your Supabase database.
 * 
 * Usage:
 *   node scripts/generate-word.js "space travel"
 *   node scripts/generate-word.js --interactive
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize clients
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env file');
  console.error('   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
  process.exit(1);
}

if (!anthropicKey) {
  console.error('❌ Error: Anthropic API key not found in .env file');
  console.error('   Please add ANTHROPIC_API_KEY to your .env file');
  console.error('   Get your key from: https://console.anthropic.com/');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

// Generate word using Claude
async function generateWord(topic = 'general absurdity') {
  console.log('\n🎨 Generating word...');
  
  const prompt = `Create a brand new, made-up word that sounds like it could be real English but isn't. 
It should be funny, whimsical, or slightly absurd.
Context or theme: ${topic}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "word": "the made-up word",
  "pronunciation": "phonetic pronunciation like vibe-LIV-ee-on (NOT IPA)",
  "partOfSpeech": "noun/verb/adjective/etc",
  "definition": "a funny definition",
  "example": "a usage example in quotes",
  "origin": "fake etymological origin"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = message.content[0].text;
  let jsonText = text.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  return JSON.parse(jsonText);
}

// Display word for review
function displayWord(wordData) {
  console.log('\n' + '='.repeat(60));
  console.log(`📖 ${wordData.word}`);
  console.log('='.repeat(60));
  console.log(`🔊 Pronunciation: ${wordData.pronunciation}`);
  console.log(`📝 Part of Speech: ${wordData.partOfSpeech}`);
  console.log(`\n💡 Definition:`);
  console.log(`   ${wordData.definition}`);
  console.log(`\n💬 Example:`);
  console.log(`   ${wordData.example}`);
  console.log(`\n🌍 Origin:`);
  console.log(`   ${wordData.origin}`);
  console.log('='.repeat(60) + '\n');
}

// Get next available date
async function getNextAvailableDate() {
  const { data, error } = await supabase
    .from('words')
    .select('scheduled_date')
    .eq('status', 'published')
    .order('scheduled_date', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching dates:', error);
    throw error;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (!data || data.length === 0) {
    return tomorrow.toISOString().split('T')[0];
  }

  const latestDate = new Date(data[0].scheduled_date);
  
  if (latestDate < tomorrow) {
    return tomorrow.toISOString().split('T')[0];
  }

  const nextDate = new Date(latestDate);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString().split('T')[0];
}

// Save word to Supabase
async function saveWord(wordData) {
  console.log('💾 Saving to database...');
  
  const scheduledDate = await getNextAvailableDate();
  
  const wordToSave = {
    id: Date.now().toString(),
    word: wordData.word,
    pronunciation: wordData.pronunciation,
    part_of_speech: wordData.partOfSpeech,
    definition: wordData.definition,
    example: wordData.example,
    origin: wordData.origin,
    illustration_url: generatePlaceholderSVG(wordData.word),
    audio_base64: null,
    created_at: new Date().toISOString(),
    scheduled_date: scheduledDate,
    status: 'published',
    votes: 0
  };

  const { data, error } = await supabase
    .from('words')
    .insert(wordToSave)
    .select();

  if (error) {
    console.error('❌ Error saving word:', error);
    throw error;
  }

  console.log(`✅ Word saved successfully!`);
  console.log(`📅 Scheduled for: ${scheduledDate}`);
  return data[0];
}

// Generate a simple placeholder SVG
function generatePlaceholderSVG(word) {
  const colors = [
    '#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', 
    '#FCE4EC', '#E0F2F1', '#F1F8E9', '#FFF9C4'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${color}"/>
    <text x="50%" y="50%" font-family="serif" font-size="48" fill="#424242" text-anchor="middle" dominant-baseline="middle">${word}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Main interactive flow
async function main() {
  console.log('🎭 Word of Tomorrow - Local Word Generator');
  console.log('==========================================\n');

  try {
    // Get topic
    const topic = process.argv[2] || await question('Enter a topic or theme (or press Enter for random): ');
    
    // Generate word
    const wordData = await generateWord(topic || 'general absurdity');
    
    // Display word
    displayWord(wordData);
    
    // Ask for approval
    const approve = await question('Do you want to save this word? (y/n): ');
    
    if (approve.toLowerCase() === 'y' || approve.toLowerCase() === 'yes') {
      await saveWord(wordData);
      console.log('\n🎉 Done! Check your app to see the word.\n');
    } else {
      console.log('\n🗑️  Word discarded.\n');
      
      const retry = await question('Generate another word? (y/n): ');
      if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
        rl.close();
        main();
        return;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
