import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Try to query the words table
  const { data, error } = await supabase.from('words').select('count');
  
  if (error) {
    if (error.message.includes('relation "public.words" does not exist')) {
      console.error('❌ Tables do not exist! You need to run the SQL schema first.');
      console.log('\n📝 Steps to fix:');
      console.log('1. Go to https://supabase.com/dashboard/project/zvvzbstfuqdaavswtxlb/editor');
      console.log('2. Click on "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Copy/paste the contents of supabase-schema.sql');
      console.log('5. Click "Run" to execute the schema');
      return false;
    }
    console.error('❌ Connection error:', error.message);
    return false;
  }
  
  console.log('✅ Connected to Supabase successfully!');
  return true;
}

async function addSlacktivity() {
  const word = {
    id: crypto.randomUUID(),
    word: 'Slacktivity',
    pronunciation: 'slack-TIV-ih-tee',
    part_of_speech: 'noun',
    definition: 'The art of appearing busy at work while actually doing very little, often involving strategic placement of open spreadsheets and intense staring at monitors.',
    example: '"Karen\'s slacktivity reached new heights when she spent two hours \'researching\' office plants online while maintaining a furrowed brow."',
    origin: 'Modern Corporate, from "slack" (to avoid work) + "activity" (appearance of doing something), coined circa 2020 during the rise of remote work.',
    illustration_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="48" text-anchor="middle" dy=".3em"%3ESlacktivity%3C/text%3E%3C/svg%3E',
    audio_base64: null,
    created_at: new Date().toISOString(),
    scheduled_date: formatDate(getTomorrow()),
    status: 'published',
    votes: 0
  };

  console.log('\n📝 Adding word to database...');
  console.log(`   Word: ${word.word}`);
  console.log(`   Scheduled for: ${word.scheduled_date}`);
  
  const { data, error } = await supabase.from('words').insert(word).select();
  
  if (error) {
    console.error('❌ Error inserting word:', error.message);
    return false;
  }
  
  console.log('✅ Word added successfully!');
  console.log('\n🎉 "Slacktivity" is now in your database!');
  console.log('🌐 Check it out at: http://localhost:3000');
  return true;
}

async function main() {
  console.log('🚀 Word of Tomorrow - Add Slacktivity\n');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await addSlacktivity();
}

main();
