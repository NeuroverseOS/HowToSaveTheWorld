/**
 * Seed a Supabase project with the canonical 96-lesson curriculum.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npm run seed
 *
 * (or: npx tsx scripts/seed-database.ts)
 *
 * What it does:
 *   1. Reads all lessons from public/lessons.json
 *   2. Upserts them into the `lessons` table (conflict target: lesson_number)
 *   3. Updates `lesson_metadata` (total_lessons, bumps lesson_version)
 *
 * What it does NOT do:
 *   - No DDL. The schema must already exist — apply it with the repo's
 *     migrations via `supabase link` + `supabase db push` before seeding.
 *     See docs/SELF_HOSTING.md for the full walkthrough.
 *
 * Requires the SERVICE ROLE key (not the anon key) because the lessons and
 * lesson_metadata tables are write-protected by RLS.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables.\n');
  console.error('   SUPABASE_URL               your project URL, e.g. https://xxxxx.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY  your project service role key (Dashboard → Settings → API)\n');
  console.error('Example:');
  console.error('   SUPABASE_URL=https://xxxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run seed');
  process.exit(1);
}

try {
  new URL(SUPABASE_URL);
} catch {
  console.error(`❌ SUPABASE_URL is not a valid URL: ${SUPABASE_URL}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 20;

async function seedDatabase(): Promise<void> {
  // 1. Load lessons from public/lessons.json
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const lessonsPath = join(scriptDir, '..', 'public', 'lessons.json');

  console.log(`📖 Reading lessons from ${lessonsPath}...`);
  const raw = JSON.parse(readFileSync(lessonsPath, 'utf-8'));
  const lessons: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw.lessons;

  if (!Array.isArray(lessons) || lessons.length === 0) {
    console.error('❌ No lessons found in public/lessons.json');
    process.exit(1);
  }
  console.log(`✅ Loaded ${lessons.length} lessons\n`);

  // 2. Upsert lessons in batches (conflict target: lesson_number, which is UNIQUE)
  console.log(`📤 Upserting lessons into ${new URL(SUPABASE_URL).host} ...`);
  for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
    const batch = lessons.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('lessons')
      .upsert(batch, { onConflict: 'lesson_number' });

    if (error) {
      console.error(`\n❌ Upsert failed on batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      if (/relation .* does not exist/i.test(error.message)) {
        console.error('\n   The schema is missing. Apply migrations first:');
        console.error('     supabase link --project-ref <your-project-ref>');
        console.error('     supabase db push');
      }
      process.exit(1);
    }
    process.stdout.write(`   ...${Math.min(i + BATCH_SIZE, lessons.length)}/${lessons.length}\r`);
  }
  console.log(`\n✅ Upserted ${lessons.length} lessons\n`);

  // 3. Update lesson_metadata: total_lessons + bump lesson_version
  console.log('🏷️  Updating lesson_metadata...');
  const { data: existing, error: metaReadError } = await supabase
    .from('lesson_metadata')
    .select('id, lesson_version')
    .limit(1)
    .maybeSingle();

  if (metaReadError) {
    console.error(`❌ Could not read lesson_metadata: ${metaReadError.message}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  if (existing) {
    const newVersion = (existing.lesson_version ?? 0) + 1;
    const { error } = await supabase
      .from('lesson_metadata')
      .update({
        total_lessons: lessons.length,
        lesson_version: newVersion,
        last_updated: now,
      })
      .eq('id', existing.id);

    if (error) {
      console.error(`❌ Could not update lesson_metadata: ${error.message}`);
      process.exit(1);
    }
    console.log(`✅ lesson_metadata updated (total_lessons=${lessons.length}, lesson_version=${newVersion})\n`);
  } else {
    const { error } = await supabase
      .from('lesson_metadata')
      .insert({
        total_lessons: lessons.length,
        lesson_version: 1,
        last_updated: now,
      });

    if (error) {
      console.error(`❌ Could not insert lesson_metadata: ${error.message}`);
      process.exit(1);
    }
    console.log(`✅ lesson_metadata created (total_lessons=${lessons.length}, lesson_version=1)\n`);
  }

  // 4. Verify
  const { count, error: countError } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn(`⚠️  Could not verify final count: ${countError.message}`);
  } else {
    console.log(`🔎 Verification: lessons table now holds ${count} rows`);
  }

  console.log('\n🎉 Seed complete. Point the app at this backend via Settings → Data Sovereignty.');
}

seedDatabase().catch((error) => {
  console.error('❌ Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
