# Admin 2FA Security Setup

## Overview

The NeuroVerse OS admin system uses Supabase authentication with optional 2FA (Two-Factor Authentication) for maximum security. Regular users never encounter authentication—the system runs entirely local-first on their devices.

## Admin Security Architecture

### What's Protected

- `/admin` - Admin dashboard
- `/admin/import-lessons` - Lesson database management
- All future admin routes
- Supabase database write operations via RLS policies

### How It Works

1. **Route Guards**: `AdminRoute` component wraps all admin pages
2. **Session Check**: Must have active Supabase auth session
3. **Role Validation**: User must have `admin` role in `user_roles` table
4. **RLS Policies**: Database enforces admin-only access via Row Level Security

### Regular Users vs Admin

| Feature | Regular Users | Admin |
|---------|--------------|-------|
| Authentication | ❌ None required | ✅ Supabase Auth + 2FA |
| Data Storage | ✅ Local only (localStorage) | ✅ Supabase database |
| Lesson Access | ✅ Bundled in PWA (`/public/lessons.json`) | ✅ Import/Export via Supabase |
| Database Access | ❌ Never touches server | ✅ Full admin privileges |
| Privacy | ✅ Sovereign, anonymous | N/A (single admin account) |

---

## Setting Up 2FA

### Option A: Magic Link (Recommended, No Setup Required)

Magic links provide 2FA-like security automatically:
- Email-based authentication
- Links expire after use
- Requires access to your email account
- Built-in to Supabase Auth

**How to use:**
1. Go to `/auth`
2. Enter your admin email
3. Check your email for the magic link
4. Click the link to authenticate
5. You're logged in with admin access

### Option B: TOTP (Google Authenticator Style)

For traditional 2FA with authenticator apps:

#### 1. Enable MFA in Lovable Cloud

<lov-presentation-actions>
  <lov-presentation-open-backend>View Backend</lov-presentation-open-backend>
</lov-presentation-actions>

1. Click "View Backend" above to access your Supabase project
2. In the Supabase dashboard, go to Authentication → Providers
3. Find the Multi-Factor Authentication (MFA) section
4. Enable Time-based One-Time Password (TOTP)
5. Save your settings

#### 2. Enroll Your Admin Account

After enabling TOTP in Supabase:
1. Log in to `/auth` with your admin credentials
2. Navigate to `/settings` or your account management page
3. Follow the enrollment flow:
   - Scan QR code with authenticator app (Google Authenticator, Authy, 1Password, etc.)
   - Enter 6-digit verification code
   - Save backup codes in a secure location
4. Future logins will require:
   - Email + Password
   - 6-digit TOTP code from your authenticator

---

## Security Best Practices

### For Your Admin Account

✅ **DO:**
- Use a strong, unique password (20+ characters)
- Enable 2FA/TOTP immediately
- Store backup codes in a password manager
- Log out after admin sessions
- Restrict admin access to trusted networks only
- Regularly audit the `user_roles` table

❌ **DON'T:**
- Share admin credentials
- Log in from public/untrusted devices
- Leave admin sessions open unattended
- Store credentials in plaintext
- Disable RLS policies

### Database Security

All admin operations are protected by Row Level Security (RLS):

```sql
-- Example: Only admins can modify lessons
CREATE POLICY "Admins can manage lessons"
ON lessons
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## Adding Additional Admin Users (If Needed)

If you need to grant admin access to another account:

### Via Supabase Console

1. <lov-presentation-actions><lov-presentation-open-backend>View Backend</lov-presentation-open-backend></lov-presentation-actions>
2. Navigate to **Table Editor** → **user_roles**
3. Click **Insert** → **Insert row**
4. Enter:
   - `user_id`: The UUID of the user (from `auth.users` table)
   - `role`: Select `admin`
5. Save

### Via SQL

```sql
-- First, create the user account in Supabase Auth (via /auth page)
-- Then grant admin role:
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

---

## Testing Your Security

### Test Admin Access

1. ✅ Log in via `/auth` with admin credentials
2. ✅ Verify redirect to `/admin` (not `/dashboard`)
3. ✅ Confirm "Admin Dashboard" button appears
4. ✅ Access `/admin/import-lessons` successfully
5. ✅ Attempt to import/export lessons

### Test Non-Admin User

1. ✅ Create a test user account (without admin role)
2. ✅ Log in via `/auth`
3. ✅ Verify redirect to `/dashboard` (not `/admin`)
4. ❌ Attempt to access `/admin` directly → should redirect to `/dashboard`
5. ❌ Attempt to access `/admin/import-lessons` → should redirect
6. ✅ Verify "Access Denied" toast appears

### Test Unauthenticated Access

1. ❌ Visit `/admin` while logged out → should redirect to `/auth`
2. ❌ Visit `/admin/import-lessons` while logged out → should redirect to `/auth`
3. ✅ Regular app routes (`/`, `/dashboard`, `/missions`) work without auth

---

## Troubleshooting

### "Access Denied" Error

**Problem:** Logged in but still seeing "Access Denied"

**Solution:**
1. Verify your user has admin role in `user_roles` table
2. Check Supabase logs for RLS policy errors
3. Ensure `has_role()` function exists and works correctly
4. Log out and log back in to refresh session

### Can't Access `/auth`

**Problem:** Auth page not loading or redirecting

**Solution:**
1. Check Site URL in Supabase Auth settings matches your deployed URL
2. Verify Redirect URLs include your preview and deployed URLs
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### 2FA Not Working

**Problem:** TOTP codes rejected during login

**Solution:**
1. Verify time sync on your device (TOTP requires accurate time)
2. Check authenticator app is using correct account
3. Use backup codes if available
4. Re-enroll 2FA from scratch if necessary
5. Contact Supabase support for MFA issues

### Regular Users Seeing Auth Prompts

**Problem:** Users being redirected to `/auth` unexpectedly

**Solution:**
- Regular users should NEVER see `/auth`
- Check that admin routes are properly guarded
- Verify no links to `/auth` exist in user-facing UI
- Ensure local-first lesson loading works without authentication

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│           REGULAR USER FLOW                  │
│  (No Auth, Completely Local)                │
├─────────────────────────────────────────────┤
│  PWA Install → localStorage → lessons.json   │
│  All data sovereign, offline, encrypted      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│             ADMIN FLOW                       │
│  (2FA Auth Required)                        │
├─────────────────────────────────────────────┤
│  /auth → 2FA → /admin → Supabase Access     │
│  Import lessons → Export JSON → Publish      │
│  Regular users download updated bundle       │
└─────────────────────────────────────────────┘
```

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Lovable Cloud Security](https://docs.lovable.dev/features/security)

---

**Last Updated:** 2025-01-23  
**NeuroVerse OS Version:** 1.0  
**Maintained By:** Project Admin
