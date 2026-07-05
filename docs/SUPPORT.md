# How to Save the World — Support

Need help with How to Save the World? This document explains how to get support.

**Note:** FOXHOLE Protocol is a canonical bonding protocol inside the NeuroVerse, not the name of this platform. This PWA implements the FOXHOLE bonding moment as part of onboarding; the full protocol definition lives in the NeuroVerse Canon repository.

---

## 📧 Contact Information

All inquiries should be sent to:

**Email:** kb15us@gmail.com

---

## 🆘 What Can I Get Help With?

### Technical Support
- Installation issues
- Configuration questions
- PWA deployment problems
- Bug reports
- Performance issues

### NeuroVerse OS Licensing
- Requesting a license for production use
- License renewal
- Upgrading license tiers
- Web3/DePIN licensing questions

### Feature Requests
- New capabilities
- UI/UX improvements
- Translation requests
- ACE Box content suggestions

### Content Questions
- Lesson curriculum
- Archetype system
- Field Guide interpretation
- Reflection guidance

---

## 📋 Before You Contact Us

Please review the documentation first:

- [README.md](../README.md) — Overview and quick start
- [Installation](./INSTALLATION.md) — Setup and deployment guide
- [Configuration](./CONFIGURATION.md) — Environment variables
- [Architecture](./ARCHITECTURE.md) — Foxhole vs. NeuroVerse OS
- [Troubleshooting](#troubleshooting) — Common issues (below)

---

## 🐛 Bug Reports

### GitHub Issues (Preferred)

For public bug reports, use GitHub Issues:

**https://github.com/NeuroverseOS/HowToSaveTheWorld/issues**

**Issue Template:**

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.0]
- Device: [e.g., iPhone 15 Pro]
- PWA installed: [Yes/No]

## Screenshots
[If applicable]

## Console Errors
[Copy any errors from browser console]
```

### Email (For Sensitive Issues)

For security vulnerabilities or sensitive issues, email kb15us@gmail.com directly.

---

## 💡 Feature Requests

### GitHub Discussions (Preferred)

For feature requests, use GitHub Discussions:

**https://github.com/NeuroverseOS/HowToSaveTheWorld/discussions**

**Discussion Template:**

```markdown
## Feature Description
[What feature do you want?]

## Use Case
[Why is this feature valuable?]

## Proposed Solution
[How could this be implemented?]

## Alternatives Considered
[What other approaches did you think about?]
```

---

## ❓ Common Questions

### "How do I install How to Save the World locally?"

See [Installation Guide](./INSTALLATION.md).

### "Do I need a NeuroVerse OS license for local development?"

**No.** NeuroVerse OS licensing is only required for **production deployment** to public domains.

Local development and testing are free.

### "Can I use How to Save the World offline?"

**Yes.** How to Save the World is a PWA with offline-first architecture. Once installed, all lessons and core functionality work without internet.

However, Echelon requires an AI provider API (OpenAI, Claude, etc.), which needs internet unless you're using a local LLM (Ollama).

### "How do I export my data?"

Go to **Settings → Export My Data**. This generates a JSON file with all your state, reflections, and Field Guide entries.

### "Can I sync across devices?"

Yes, via optional cloud sync. Go to **Settings → Multi-Device Sync** and enter your own Supabase credentials.

Alternatively, export your data from one device and import it on another.

---

## 🔧 Troubleshooting

### "PWA not installing on mobile"

**Solution**: Ensure you're accessing the app over **HTTPS**. PWAs require secure connections.

### "Lessons not loading"

**Solution**: 
1. Check browser console for errors (F12 → Console)
2. Verify `public/lessons.json` is accessible
3. Clear cache and hard reload (Ctrl+Shift+R)

### "Echelon not responding"

**Solution**:
1. Verify your AI provider API key is valid
2. Check browser console for API errors
3. Try switching AI providers (Settings → AI Provider)

### "State reset after closing browser"

**Solution**: Your browser may be blocking localStorage. Check:
- Settings → Privacy → Allow cookies
- Incognito/Private mode disables localStorage

### "Service worker not updating"

**Solution**: Force refresh:
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- **Mobile**: Long-press reload button → "Hard Reload"

### "Archetype assessment not saving"

**Solution**:
1. Complete all 12 scenarios
2. Don't close the page mid-assessment
3. Check console for errors
4. Export your state as backup

---

## ⏰ Response Times

We aim to respond to all inquiries within **48-72 hours**.

### Priority Levels:

| Priority | Response Time | Description |
|----------|---------------|-------------|
| **Critical** | 24 hours | Security vulnerabilities, data loss |
| **High** | 48 hours | Production bugs, deployment issues |
| **Medium** | 3-5 days | Feature requests, non-critical bugs |
| **Low** | 1 week | General questions, documentation |

---

## 🌍 Community Resources

### GitHub Discussions
- Ask questions
- Share experiences
- Connect with other operators

### GitHub Issues
- Report bugs
- Track feature development

### Reddit (Coming Soon)
- r/FoxholeProtocol (planned)

### Discord (Coming Soon)
- Real-time community chat (planned)

---

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) — System design
- [Installation](./INSTALLATION.md) — Setup guide
- [Configuration](./CONFIGURATION.md) — Environment variables
- [Folder Structure](./FOLDER_STRUCTURE.md) — Repository layout
- [Contributing](../CONTRIBUTING.md) — How to contribute
- [Governance](./GOVERNANCE.md) — Decision-making process

---

## 🔒 Privacy

All support inquiries are treated as confidential. We will never:

- Share your operator data with third parties
- Publicly disclose your use case without permission
- Log or store your AI provider keys
- Use your data for analytics or telemetry

---

## 📞 Other Contact Options

For urgent issues or high-priority inquiries, you may also reach out via:

- **GitHub Issues** — Public bug reports
- **GitHub Discussions** — Public feature requests and questions

However, **email is the preferred contact method** for all support requests.

---

**How to Save the World — Two Minds. One Mission. Save the World.**
