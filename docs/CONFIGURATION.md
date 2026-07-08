# How to Save the World — Configuration

This document describes all configuration options for How to Save the World.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

**IMPORTANT:** FOXHOLE Protocol is not configurable. It is a canonical NeuroVerse protocol and must only be referenced, never modified, in the PWA.

---

## 🔧 Environment Variables

How to Save the World uses environment variables for configuration. Create a `.env` file in the project root.

---

## 🤖 AI Provider Configuration

### OpenAI (Recommended)

```bash
VITE_OPENAI_API_KEY=sk-proj-...
```

**Supported Models:**
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

### Anthropic (Claude)

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Supported Models:**
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku

### Google (Gemini)

```bash
VITE_GOOGLE_API_KEY=AIzaSy...
```

**Supported Models:**
- Gemini 2.0 Pro
- Gemini 1.5 Pro
- Gemini 1.5 Flash

### Local LLM (Ollama)

```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

**Supported Models:**
- llama3
- mistral
- codellama
- Any model available in Ollama

---

## 🔐 NeuroVerse OS License

**Required for production use:**

```bash
VITE_NEUROVERSE_LICENSE_KEY=your_license_key_here
```

Contact kb15us@gmail.com to obtain a license.

---

## ☁️ Optional: Supabase Cloud Sync

If you want to enable cloud backup using Supabase:

```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=yourprojectid
```

**Note**: Cloud sync is **optional**. How to Save the World works entirely local-first without Supabase.

---

## 🎨 PWA Configuration

### Manifest (`public/manifest.json`)

```json
{
  "name": "How to Save the World",
  "short_name": "HTSTW",
  "description": "Decentralized Leadership Training",
  "theme_color": "#0A3D5C",
  "background_color": "#000000",
  "display": "standalone",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (`vite.config.ts`)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'lessons.json', 'ace/**/*'],
      manifest: {
        name: 'How to Save the World',
        short_name: 'HTSTW',
        theme_color: '#0A3D5C',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## 🎨 Design System Configuration

### Tailwind Config (`tailwind.config.ts`)

```typescript
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // ... more semantic tokens
      },
    },
  },
};
```

### CSS Variables (`src/index.css`)

```css
:root {
  /* Light Mode */
  --background: 0 0% 100%;
  --foreground: 203 65% 20%;
  --primary: 203 65% 30%;
  --primary-foreground: 0 0% 100%;
  /* ... */
}

.dark {
  /* Dark Mode */
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --primary: 203 65% 60%;
  --primary-foreground: 0 0% 0%;
  /* ... */
}
```

---

## 🌍 Language Configuration

How to Save the World supports 10 languages:

```typescript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '简体中文' },
  { code: 'ar', name: 'العربية' },
];
```

Default language is detected from browser settings or defaults to English.

---

## 🔊 Audio Configuration

### Text-to-Speech Settings

```typescript
interface AudioSettings {
  enabled: boolean;
  voice: VoiceModel;  // 'onyx' | 'alloy' | 'echo' | 'nova' | 'shimmer' | 'fable'
  speed: number;      // 0.5 - 2.0
  pitch: number;      // 0.5 - 2.0 (browser TTS only)
  volume: number;     // 0.0 - 1.0
}
```

Stored in `localStorage` under key `audioSettings`.

---

## 📊 State Configuration

### localStorage Keys

```typescript
const STATE_KEYS = {
  USER_STATE: 'neuroverse_state',           // Operator identity, progress, memory
  REFLECTIONS: 'neuroverse_reflections_v2', // All 5-point reflections
  MISSION_LOGS: 'neuroverse_mission_logs',  // Field Guide entries
  ECHELON_CACHE: 'nv:echelonMessages',      // Echelon conversation cache
  AUDIO_SETTINGS: 'audioSettings',          // TTS preferences
  THEME: 'theme',                           // 'light' | 'dark'
  LANGUAGE: 'language',                     // 'en' | 'es' | etc.
};
```

### State Schema

```typescript
interface StateModel {
  system: {
    installedPWA: boolean;
    aiConnected: boolean;
    echelonOnline: boolean;
    diagnosticsPassed: boolean;
    activationComplete: boolean;
  };
  user: {
    uuid: string;
    callsign: string;
    archetype: ArchetypeData;
    language: string;
  };
  progress: {
    assessmentComplete: boolean;
    sessionNumber: number;
    currentLessonId: number;
    completedLessons: number[];
    isGraduated: boolean;
  };
  timestamps: {
    installation: string;
    aiConnection: string;
    echelonActivation: string;
    assessmentCompletion: string;
    lastMissionCompletion: string;
    graduation: string | null;
  };
  version: number;
}
```

---

## 🔧 Build Configuration

### Vite Config (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react(), VitePWA(...)],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        },
      },
    },
  },
});
```

---

## 📞 Support

For configuration questions:

**Email**: kb15us@gmail.com

---

**How to Save the World — Decentralized Leadership Training**
