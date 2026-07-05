# NeuroVerse OS — Installation

This guide walks you through installing NeuroVerse OS for development and production use.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Valid NeuroVerse OS License** (contact kb15us@gmail.com)

---

## 🔑 Step 1: Obtain a License

NeuroVerse OS is open-source software (MIT License). No license purchase is required for any use, including production.

### License Types:

- **Startup License** — For organizations with <10 employees or <$1M revenue
- **Enterprise License** — For organizations with 10+ employees or $1M+ revenue
- **Web3/DePIN License** — For decentralized applications and DAOs

### Request a License:

Email kb15us@gmail.com with:
- Organization name and size
- Use case description
- Expected deployment scale
- License type of interest

You will receive:
- License key
- License agreement PDF
- Access to @neuroverse/os npm package

---

## 📦 Step 2: Install the Package

### For Production:

```bash
npm install @neuroverse/os
```

### For Development:

```bash
npm install @neuroverse/os --save-dev
```

---

## 🔧 Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# NeuroVerse OS License
NEUROVERSE_LICENSE_KEY=your_license_key_here

# AI Provider (choose one)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here

# Optional: Supabase for cloud sync
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

---

## ✅ Step 4: Verify Installation

Create a test file to verify NeuroVerse OS is working:

```typescript
// test-neuroverse.ts
import { initializeEchelon, validateLicense } from '@neuroverse/os';

async function testInstallation() {
  // Validate license
  const isValid = await validateLicense(process.env.NEUROVERSE_LICENSE_KEY!);
  
  if (!isValid) {
    console.error('❌ Invalid license key');
    return;
  }
  
  console.log('✅ License validated');
  
  // Initialize Echelon
  const echelon = initializeEchelon({
    operator: {
      uuid: crypto.randomUUID(),
      callsign: 'Test-01',
      archetype: {
        primary: 'WATCHTOWER',
        shadow: 'VEIL',
        rising: 'ENGINE'
      },
      traits: [],
      shadows: [],
      powers: [],
      shortTermMemory: [],
      longTermMemory: [],
      completedLessons: [],
      currentLesson: 1,
      isGraduated: false
    },
    mode: 'training',
    stage: 'briefing',
    aiProvider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!
  });
  
  console.log('✅ Echelon initialized');
  
  // Test chat
  const response = await echelon.chat({
    userMessage: 'What is my mission?'
  });
  
  console.log('✅ Chat response received:', response.text);
}

testInstallation();
```

Run the test:

```bash
npx ts-node test-neuroverse.ts
```

Expected output:

```
✅ License validated
✅ Echelon initialized
✅ Chat response received: Operator Test-01, your mission is...
```

---

## 🚀 Step 5: Integration

### Import NeuroVerse OS in Your Application

```typescript
// src/main.ts
import { 
  initializeEchelon, 
  OperatorModel,
  MissionStage 
} from '@neuroverse/os';

// Initialize with your operator data
const operator: OperatorModel = {
  // ... your operator configuration
};

const echelon = initializeEchelon({
  operator,
  mode: 'training',
  stage: 'briefing',
  aiProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!
});

// Use Echelon in your application
const response = await echelon.chat({
  userMessage: 'What should I focus on?',
  context: {
    lessonTitle: 'Systems Thinking',
    lessonContent: 'You will learn to see patterns...'
  }
});
```

---

## 🔒 Step 6: Secure Your Keys

### Never Commit Keys to Git

Add to `.gitignore`:

```
.env
.env.local
.env.production
```

### Use Environment Variables in Production

For Vercel:

```bash
vercel env add NEUROVERSE_LICENSE_KEY
vercel env add OPENAI_API_KEY
```

For Netlify:

```bash
netlify env:set NEUROVERSE_LICENSE_KEY your_key_here
netlify env:set OPENAI_API_KEY your_key_here
```

For Railway:

```bash
railway variables set NEUROVERSE_LICENSE_KEY=your_key_here
railway variables set OPENAI_API_KEY=your_key_here
```

---

## 🐛 Troubleshooting

### "License key invalid or expired"

**Solution**: Verify your license key is correct in `.env`:

```bash
echo $NEUROVERSE_LICENSE_KEY
```

Contact kb15us@gmail.com if your license is expired or revoked.

### "Module not found: @neuroverse/os"

**Solution**: Ensure the package is installed:

```bash
npm list @neuroverse/os
```

If not found, reinstall:

```bash
npm install @neuroverse/os --force
```

### "Cannot resolve TypeScript types"

**Solution**: Ensure TypeScript is configured to include node_modules:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## 📚 Next Steps

- Read the [Developer Guide](./DEVELOPER_GUIDE.md) to learn how to build on NeuroVerse OS
- Review [Architecture](./ARCHITECTURE.md) to understand the Eight-Box Scaffold
- See [Configuration](./CONFIGURATION.md) for advanced Echelon options

---

## 📞 Support

For installation issues or licensing questions:

**Email**: kb15us@gmail.com

---

**NeuroVerse OS — Two Minds. One Mission. Save the World.**
