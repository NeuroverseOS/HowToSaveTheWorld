# How to Save the World — Installation

This guide walks you through installing and deploying How to Save the World.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **NeuroVerse OS License** (for production use — contact kb15us@gmail.com)

---

## 🚀 Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/NeuroverseOS/HowToSaveTheWorld.git
cd neuroverseos
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React, Vite, TypeScript
- Tailwind CSS, shadcn UI
- @neuroverse/os (requires license for production)
- Supabase client (optional, for cloud sync)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider (choose one)
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_GOOGLE_API_KEY=your_google_key_here

# NeuroVerse OS License (required for production)
VITE_NEUROVERSE_LICENSE_KEY=your_license_key_here

# Optional: Supabase for cloud sync
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Start Development Server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📦 Production Build

### 1. Build the PWA

```bash
npm run build
```

This generates:
- `/dist/` — Static files for deployment
- Service worker for offline capability
- Optimized assets and code splitting

### 2. Preview the Build Locally

```bash
npm run preview
```

Open **http://localhost:4173** to test the production build.

---

## 🌐 Deployment Options

### Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add Environment Variables:**
   ```bash
   vercel env add VITE_NEUROVERSE_LICENSE_KEY
   vercel env add VITE_OPENAI_API_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
   ```

4. **Production Deployment:**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

3. **Add Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add `VITE_NEUROVERSE_LICENSE_KEY`, `VITE_OPENAI_API_KEY`, etc.

### Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Initialize:**
   ```bash
   railway init
   ```

3. **Add Environment Variables:**
   ```bash
   railway variables set VITE_NEUROVERSE_LICENSE_KEY=your_key_here
   railway variables set VITE_OPENAI_API_KEY=your_key_here
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

### Self-Hosting

1. **Build the PWA:**
   ```bash
   npm run build
   ```

2. **Serve with Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /path/to/foxhole-protocol/dist;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Or serve with Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       DocumentRoot /path/to/foxhole-protocol/dist
       
       <Directory /path/to/foxhole-protocol/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

---

## 🔐 NeuroVerse OS Licensing

### Development

You can use Foxhole Protocol for **local development and testing** without a NeuroVerse OS license.

### Production

Deploying Foxhole Protocol to a public domain requires a **valid NeuroVerse OS license**.

**Contact:** kb15us@gmail.com

License types:
- **Startup License** — For <10 employees or <$1M revenue
- **Enterprise License** — For 10+ employees or $1M+ revenue
- **Web3/DePIN License** — For decentralized applications and DAOs

---

## ⚙️ Optional: Supabase Setup

How to Save the World works entirely **local-first** without Supabase. However, you can optionally enable cloud sync.

### 1. Create a Supabase Project

- Go to **https://supabase.com**
- Create a new project
- Note your **Project URL** and **Anon Key**

### 2. Set Environment Variables

```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 3. Run Database Migrations

```bash
supabase db push
```

This creates tables for:
- `lessons` — Lesson content storage
- `user_lesson_progress` — Lesson completion tracking
- `user_reflections` — Reflection storage
- `operator_traits` — Trait unlocks
- `field_guide_pages` — Field Guide entries

---

## 🐛 Troubleshooting

### "Module not found: @neuroverse/os"

**Solution**: Ensure you have a valid NeuroVerse OS license and the package is installed:

```bash
npm list @neuroverse/os
```

If not found, contact kb15us@gmail.com for licensing.

### "PWA not installing on mobile"

**Solution**: Ensure you're serving over **HTTPS** (required for PWA installation). Use Vercel, Netlify, or enable SSL on your server.

### "Service worker not updating"

**Solution**: Force refresh:
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- **Mobile**: Long-press reload button → "Hard Reload"

### "Lessons not loading"

**Solution**: Ensure `public/lessons.json` exists and is being served correctly:

```bash
curl http://localhost:5173/lessons.json
```

---

## 📚 Next Steps

- Read [Configuration](./CONFIGURATION.md) for environment variable options
- Review [Architecture](./ARCHITECTURE.md) to understand How to Save the World vs. NeuroVerse OS
- See [Folder Structure](./FOLDER_STRUCTURE.md) for repository layout

---

## 📞 Support

For installation issues:

**Email**: kb15us@gmail.com

---

**How to Save the World — Decentralized Leadership Training**
