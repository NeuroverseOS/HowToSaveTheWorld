# Admin Setup Instructions

## Setting Up Your Admin Account

1. **Sign Up via /auth page**
   - Go to `/auth` route
   - Create an account with your email and password
   - This will create your user account in Supabase

2. **Grant Admin Role**

After signing up, you need to grant yourself admin privileges. You have two options:

### Option A: Via Lovable Cloud Dashboard

1. Open the Lovable Cloud dashboard (click "View Backend" button)
2. Navigate to the Database section
3. Go to SQL Editor
4. Run this query (replace `YOUR_EMAIL` with your actual email):

```sql
-- Find your user ID and grant admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option B: Automatic Admin for First User (Recommended)

Run this migration to automatically grant admin role to the first user who signs up:

```sql
-- Create function to grant admin to first user
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the first user, make them admin
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_first_user_admin ON auth.users;
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_user_admin();
```

3. **Verify Admin Access**
   - Log out and log back in
   - Navigate to `/dashboard`
   - You should see an "Admin" button in the header
   - Click it to access admin features like lesson import

## Admin Features

Once you're logged in as admin, you can:
- Import all 90 lessons from Excel/CSV
- View and manage lesson data
- Test the full system as a logged-in user
- Access admin-only routes

## Regular Users

Regular users **do not need accounts**. The app runs 100% locally for them with:
- Local UUID identity
- Local state storage
- Offline-first operation
- Optional user-owned Supabase sync (if they want multi-device access)

Only YOU need an admin account for testing and content management.
