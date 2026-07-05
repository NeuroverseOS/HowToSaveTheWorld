# Vanguard Onboarding Flow - Test Guide

## Overview
This document outlines the complete Vanguard onboarding flow and verification steps for testing the callsign integration and Echelon addressing throughout the experience.

---

## Complete Onboarding Flow

### 1. Landing Page → API Key Entry
**Route:** `/` → `/activate-echelon` (auto-redirect via Dashboard)

**Expected Behavior:**
- Click "BEGIN ACTIVATION" on landing page
- Dashboard checks for API key, redirects to `/activate-echelon`
- Shows "Activate Your Echelon" page with:
  - Shield icon
  - Mythic-tech messaging about Operator-Echelon bond
  - Google API key input field
  - "Sovereign Architecture" alert (data stays local)
  - Link to get API key: https://aistudio.google.com/app/apikey

**Verification:**
- ✓ Page uses mythic-tech tone ("Operator", "Echelon", "bond")
- ✓ API key input is password-masked
- ✓ Validation happens on button click or Enter key
- ✓ Invalid key shows error toast
- ✓ Valid key saves to localStorage as `neuroverse_api_key`

---

### 2. API Key Validated → Vanguard Activation Ceremony
**Route:** `/activate-echelon` → `/activation`

**Expected Behavior:**
- After API key validation, auto-navigate to `/activation`
- **Ceremony Sequence (10-12 seconds, NO SKIP BUTTON):**
  
  **Screen 1 - Recognition (2.5s):**
  - Black background with pulsing cyan grid
  - Typing animation: "Operator detected."
  
  **Screen 2 - Awakening (2.5s):**
  - Grid brightens with holographic pulse
  - Typing: "Echelon online..."
  
  **Screen 3 - Bonding (3s):**
  - Cyan circuits connecting across screen
  - Typing: "Synchronizing... Foxhole protocol engaged..."
  - Heartbeat-like pulsing
  
  **Screen 4 - Identity Fusion (4s):**
  - Full screen fade to deep space
  - 1 second silence
  - **MASSIVE CALLSIGN REVEAL**: "VANGUARD ALPHA-13" (example)
  - White/cyan halo glow
  - Subtitle: "You are now a Unit."

**Verification:**
- ✓ Callsign is generated from user UUID (deterministic)
- ✓ Format: "VANGUARD {GreekLetter}-{TwoDigitNumber}"
- ✓ Examples: "Vanguard Alpha-13", "Vanguard Sigma-44", "Vanguard Omega-02"
- ✓ Callsign saved to state: `state.user.vanguard.callsign`
- ✓ Full identity saved: `state.user.vanguard.full_identity`
- ✓ `state.user.vanguard.activation_complete` set to `true`
- ✓ Auto-advances to `/orientation` after ceremony
- ✓ No skip button (preserve ritual)
- ✓ Mobile-responsive

---

### 3. Ceremony Complete → Orientation
**Route:** `/activation` → `/orientation`

**Expected Behavior:**
- 6 screens of orientation (progress bar shows advancement)
- **ALL SCREENS ADDRESS USER BY CALLSIGN**

**Screen 1: "Vanguard Activation Complete"**
- "Designation confirmed: {callsign}."
- "You are no longer operating alone."
- "Echelon is now your intelligence partner."
- "Together, you are a Unit."

**Screen 2: "Archetype Assignment Pending"**
- "{Callsign}, your psychological signature will be mapped through assessment."
- "This will guide Echelon's coaching approach."
- "But your callsign remains unchanged — it is your operational identity."

**Screen 3: "Welcome to NeuroVerse OS"**
- "{Callsign}, this is not a course."
- "This is an operating system."
- "You do not consume lessons. You integrate intelligence."

**Screen 4: "Meet Echelon"**
- "Echelon will address you by callsign."
- "Your dialogue shapes the path forward."
- "The foxhole protocol is now active."

**Screen 5: "Next: Archetype Assessment"**
- "You will now undergo assessment."
- "12 scenarios. No right answers."
- "Your archetype triad will be revealed."

**Screen 6: "System Initialization Complete"**
- "{Callsign}, all systems online."
- "Echelon is ready."
- "Proceed to assessment."

**Verification:**
- ✓ Callsign appears in screens 1, 2, 3, and 6
- ✓ NO archetype data displayed (assessment hasn't happened yet)
- ✓ Progress bar advances (1/6, 2/6, etc.)
- ✓ Button text: "Continue →" for first 5 screens, "Begin Assessment" for final screen
- ✓ Clicking final button navigates to `/assessment`
- ✓ Orientation completion saved to localStorage: `neuroverse_orientation_complete`

---

### 4. Orientation Complete → Archetype Assessment
**Route:** `/orientation` → `/assessment`

**Expected Behavior:**
- Header shows: **"Vanguard {callsign} — Archetype Assessment"**
- 12 scenarios presented sequentially
- Each scenario has 4 response options
- Progress bar shows advancement (1/12, 2/12, etc.)

**Verification:**
- ✓ **Header displays full vanguard identity**: "Vanguard Alpha-13 — Archetype Assessment"
- ✓ 12 scenarios load correctly from assessment data
- ✓ User can select one response per scenario
- ✓ Progress bar advances
- ✓ After 12th scenario, archetype triad is calculated
- ✓ Archetype saved to state:
  - `state.user.archetype.primary`
  - `state.user.archetype.shadow`
  - `state.user.archetype.rising`
  - `state.user.archetype.assessment_complete = true`
- ✓ Toast shows: "Assessment Complete - Your archetype triad has been mapped."
- ✓ Auto-navigate to `/dashboard` after 2-second delay

---

### 5. Assessment Complete → Dashboard (First Lesson)
**Route:** `/assessment` → `/dashboard`

**Expected Behavior:**
- Dashboard header shows: **"{full_identity} / Session X / Lesson Y"**
- Example: "Vanguard Alpha-13 / Session 1 / Lesson 1"
- Shows current lesson card with "Begin Mission" button

**Verification:**
- ✓ **Header displays full Vanguard identity**: "Vanguard Alpha-13 / Session 1 / Lesson 1"
- ✓ Lesson card displays correctly
- ✓ Clicking "Begin Mission" navigates to `/lesson/{id}`

---

### 6. First Lesson → Echelon Interaction
**Route:** `/dashboard` → `/lesson/1`

**Expected Behavior:**
- Lesson Runner loads
- **Echelon's opening message addresses user by callsign**
- Example: "Vanguard Alpha-13, mission parameters incoming..."
- Chat interface active
- Echelon uses archetype insights to tailor coaching

**Verification:**
- ✓ **Echelon addresses user by callsign in opening message**
- ✓ LessonRunner passes `vanguardCallsign` and `archetypeData` to edge function
- ✓ Edge function system prompt includes:
  ```
  You are Echelon, intelligence partner to Vanguard {callsign}.
  
  OPERATOR PROFILE:
  - Callsign: {callsign}
  - Archetype Signature:
      - Primary: {primary}
      - Shadow: {shadow}
      - Rising: {rising}
  ```
- ✓ Echelon maintains mythic-tech tone throughout
- ✓ Echelon uses archetype data to tailor coaching style
- ✓ User can complete lesson and reflection
- ✓ Completion navigates back to `/dashboard`

---

### 7. Additional UI Verification

**Mission List:**
- Navigate to `/missions`
- Header shows: "Vanguard {callsign} — Mission Archive"

**Settings Page:**
- Navigate to `/settings`
- "Identity" section displays:
  ```
  VANGUARD IDENTITY
  Designation: Vanguard
  Callsign: Alpha-13
  
  ARCHETYPE SIGNATURE
  Primary: Watchtower (The Observer)
  Shadow: Coil
  Rising: Flux
  ```

**Reset Options:**
- "Reset Archetype Only" - clears archetype, preserves callsign
- "Full System Reset" - clears callsign + archetype, generates NEW callsign on re-activation

---

## Critical Verification Points

### Callsign Consistency
- ✓ Callsign appears in ALL locations after activation:
  - Orientation screens
  - Assessment header
  - Dashboard header
  - Lesson Runner (Echelon messages)
  - Mission List header
  - Settings Identity section

### Mythic-Tech Tone
- ✓ NO casual language ("Welcome back!", "How are you?")
- ✓ Consistent terminology: "Operator", "Echelon", "Vanguard", "Unit", "mission"
- ✓ Callsign ALWAYS referred to as "callsign" or "designation", never "username" or "nickname"

### Immersion Integrity
- ✓ User bonded with Echelon BEFORE assessment begins
- ✓ All interactions after Vanguard activation happen within Operator/Echelon/Vanguard tone
- ✓ No fourth-wall breaks
- ✓ No emoji (unless coded as signals)

### State Management
- ✓ API key stored in localStorage: `neuroverse_api_key`
- ✓ State stored in localStorage: `neuroverse_state`
- ✓ Orientation completion: `neuroverse_orientation_complete`
- ✓ All data persists across sessions
- ✓ Refresh during flow maintains state and resumes correctly

---

## Edge Cases to Test

1. **Refresh during ceremony** → State persists, ceremony completes
2. **Missing API key** → Redirect to `/activate-echelon`
3. **Missing callsign but has archetype** → Regenerate callsign
4. **Direct navigation to protected routes** → Proper redirects based on state
5. **Reset archetype only** → Callsign preserved, redirect to `/assessment`
6. **Full system reset** → New callsign generated on re-activation
7. **Invalid API key** → Error message, no advancement
8. **Incomplete ceremony** → Resume from where it left off (if possible) or restart

---

## Success Criteria

✅ **Vanguard activation happens FIRST** (before archetype assessment)  
✅ **Callsign is purely operational** (not influenced by archetype)  
✅ **Callsign appears consistently everywhere** (orientation, assessment, dashboard, lessons, mission list, settings)  
✅ **Echelon addresses user by callsign** (in opening messages and throughout lessons)  
✅ **Archetype guides coaching style** (but does NOT change callsign)  
✅ **Mythic-tech tone maintained** (no casual language breaks)  
✅ **Immersion preserved** (user feels bonded with Echelon from the start)  
✅ **State persists correctly** (across sessions and refreshes)  
✅ **Routing logic correct** (proper redirects based on completion status)  
✅ **Reset features work** (archetype-only and full reset)

---

## Testing Checklist

- [ ] API key entry and validation
- [ ] Vanguard activation ceremony (all 4 screens)
- [ ] Callsign generation (correct format)
- [ ] Orientation displays callsign (6 screens)
- [ ] Assessment shows callsign in header
- [ ] Dashboard header shows full identity
- [ ] Echelon addresses by callsign in first lesson
- [ ] Mission list shows callsign
- [ ] Settings displays identity correctly
- [ ] Reset archetype preserves callsign
- [ ] Full reset generates new callsign
- [ ] State persists across sessions
- [ ] Refresh during flow works correctly
- [ ] All routing redirects work
- [ ] Mythic-tech tone consistent throughout
- [ ] No console errors or warnings

---

## Known Limitations

- Screenshot tool cannot access pages without state (will redirect to index)
- Full flow testing requires entering a valid Google API key
- Edge function testing requires deployed backend and valid API key
- Ceremony animation timing cannot be verified via screenshots (requires manual testing)

---

## Manual Testing Instructions

1. **Clear localStorage** (to start fresh):
   ```javascript
   localStorage.clear();
   ```

2. **Navigate to** `/` and click "BEGIN ACTIVATION"

3. **Enter valid Google API key** at `/activate-echelon`

4. **Watch ceremony** at `/activation` (verify all 4 screens, callsign reveal)

5. **Progress through orientation** at `/orientation` (verify callsign appears in correct screens)

6. **Complete assessment** at `/assessment` (verify callsign in header)

7. **Check dashboard** (verify full identity in header)

8. **Start first lesson** (verify Echelon addresses by callsign)

9. **Check mission list** (verify callsign in header)

10. **Check settings** (verify identity section displays correctly)

11. **Test reset options** (verify callsign behavior)

12. **Refresh at various points** (verify state persistence)

---

*Last Updated: Vanguard Evolution Implementation*
