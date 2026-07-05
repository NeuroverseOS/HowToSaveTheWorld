// ACE Box 08 System Literacy Loader
// Local-first, deterministic knowledge retrieval
// NO embeddings, NO cloud dependencies

export interface ACEEntry {
  id: string;
  title: string;
  body: string;
  q?: string;
  a?: string;
}

export interface ACEFile {
  id: string;
  category: string;
  title: string;
  entries: ACEEntry[];
}

export interface ACEBox08Index {
  box: string;
  title: string;
  purpose: string;
  files: string[];
  triggers: {
    keywords: string[];
    context_type: string;
  };
}

// In-memory cache
let aceCache: Map<string, ACEFile> | null = null;
let aceIndex: ACEBox08Index | null = null;

const ACE_BASE_PATH = '/ace/box08_system_literacy';

// System Literacy trigger keywords
const SYSTEM_LITERACY_KEYWORDS = [
  "how does this work",
  "how does this system",
  "explain this feature",
  "why did you do that",
  "what is echelon",
  "how do i use",
  "i'm confused",
  "explain the neuroverse",
  "help me understand",
  "what does this mean",
  "i don't get this",
  "i'm lost",
  "what is this",
  "help",
];

/**
 * Load ACE Box 08 index and all knowledge files
 * Caches in memory for subsequent calls
 */
export async function loadACEBox08(): Promise<Map<string, ACEFile>> {
  if (aceCache) {
    return aceCache;
  }

  try {
    // Load index
    const indexResponse = await fetch(`${ACE_BASE_PATH}/box08_index.json`);
    aceIndex = await indexResponse.json();

    const cache = new Map<string, ACEFile>();

    // Load all knowledge files in parallel
    const filePromises = aceIndex.files.map(async (filename) => {
      const response = await fetch(`${ACE_BASE_PATH}/${filename}`);
      const data: ACEFile = await response.json();
      return { filename: filename.replace('.json', ''), data };
    });

    const results = await Promise.all(filePromises);
    
    results.forEach(({ filename, data }) => {
      cache.set(filename, data);
    });

    aceCache = cache;
    console.log('[ACE BOX 08] Loaded successfully:', cache.size, 'files');
    
    return cache;
  } catch (error) {
    console.error('[ACE BOX 08] Failed to load:', error);
    throw error;
  }
}

/**
 * Detect if a user message triggers System Literacy mode
 * Uses deterministic keyword matching (local, no embeddings)
 */
export function detectSystemLiteracyTrigger(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  return SYSTEM_LITERACY_KEYWORDS.some(keyword => 
    normalized.includes(keyword)
  );
}

/**
 * Get relevant knowledge entries based on user message
 * Returns array of entries to inject into Echelon context
 */
export async function getRelevantEntries(message: string): Promise<ACEEntry[]> {
  const cache = await loadACEBox08();
  const normalized = message.toLowerCase();
  const results: ACEEntry[] = [];

  // Keyword-based content matching
  if (normalized.includes('echelon') || normalized.includes('how does this work')) {
    const echelonFile = cache.get('how_echelon_works');
    if (echelonFile) {
      results.push(...echelonFile.entries);
    }
  }

  if (normalized.includes('neuroverse') || normalized.includes('system')) {
    const neuroverseFile = cache.get('how_neuroverse_works');
    if (neuroverseFile) {
      results.push(...neuroverseFile.entries);
    }
  }

  if (normalized.includes('how do i') || normalized.includes('how to use')) {
    const usageFile = cache.get('how_to_use');
    if (usageFile) {
      results.push(...usageFile.entries);
    }
  }

  if (normalized.includes('problem') || normalized.includes('not working') || normalized.includes('glitch')) {
    const troubleshootFile = cache.get('troubleshooting');
    if (troubleshootFile) {
      results.push(...troubleshootFile.entries);
    }
  }

  // Default: return all "How to Use" entries if no specific match
  if (results.length === 0) {
    const usageFile = cache.get('how_to_use');
    if (usageFile) {
      results.push(...usageFile.entries);
    }
  }

  console.log('[ACE BOX 08] Retrieved', results.length, 'entries for:', message.substring(0, 50));
  
  return results;
}

/**
 * Get all entries from a specific ACE file
 */
export async function getACEFile(filename: string): Promise<ACEFile | null> {
  const cache = await loadACEBox08();
  return cache.get(filename) || null;
}

/**
 * Get FAQ entries specifically
 */
export async function getFAQEntries(): Promise<ACEEntry[]> {
  const faqFile = await getACEFile('faq');
  return faqFile?.entries || [];
}

/**
 * Format entries for Echelon context injection
 */
export function formatEntriesForContext(entries: ACEEntry[]): string {
  return entries.map(entry => {
    if (entry.q && entry.a) {
      return `Q: ${entry.q}\nA: ${entry.a}`;
    }
    return `[${entry.title}]\n${entry.body}`;
  }).join('\n\n');
}
