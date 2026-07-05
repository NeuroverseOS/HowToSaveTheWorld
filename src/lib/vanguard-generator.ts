// NeuroVerse OS Vanguard Callsign Generator
// Generates deterministic callsign from user UUID only
// NO archetype influence — purely operational designation

const GREEK_LETTERS = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
  "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function generateCallsign(userId: string): {
  callsign: string;
  full_identity: string;
} {
  // Hash user UUID to get deterministic values
  const hash = hashString(userId);
  
  // Select Greek letter (0-23)
  const letterIndex = hash % GREEK_LETTERS.length;
  const letter = GREEK_LETTERS[letterIndex];
  
  // Generate two-digit number (00-99)
  const number = Math.floor((hash / 100) % 100)
    .toString()
    .padStart(2, '0');
  
  const callsign = `${letter}-${number}`;
  const full_identity = `Vanguard ${callsign}`;
  
  return { callsign, full_identity };
}
