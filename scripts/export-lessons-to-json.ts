import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function exportLessonsToJSON() {
  console.log('📥 Fetching all lessons from Supabase...\n');

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number', { ascending: true });

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    process.exit(1);
  }

  if (!lessons || lessons.length === 0) {
    console.error('❌ No lessons found in database');
    process.exit(1);
  }

  console.log(`✅ Fetched ${lessons.length} lessons\n`);

  // Write to public/lessons.json
  const jsonContent = JSON.stringify(lessons, null, 2);
  writeFileSync('public/lessons.json', jsonContent, 'utf-8');

  console.log('✅ Successfully wrote lessons to public/lessons.json');
  console.log(`📊 Total lessons: ${lessons.length}`);
  console.log(`📦 File size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
}

exportLessonsToJSON();
