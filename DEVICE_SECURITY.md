# Device Registration & Security

This document explains the device registration and validation security feature implemented in the Budget Planner application.

## Overview

The application now implements device-based authentication to ensure that each user can only be logged in from one device at a time. This prevents session hijacking and ensures data isolation between different users.

## How It Works

### 1. Device Fingerprinting

When a user logs in or signs up, the application generates a unique device fingerprint based on:

- User agent string
- Platform information
- Screen resolution
- Color depth
- Timezone offset
- Language preferences
- CPU cores (hardware concurrency)
- Device memory (if available)
- Canvas fingerprint (lightweight version)

All these components are combined and hashed using SHA-256 to create a unique device identifier.

**File:** `src/lib/device/fingerprint.ts`

### 2. Device Registration

**On Login/Signup:**
- After successful authentication, the device fingerprint is generated
- The fingerprint is registered in the `user_devices` table in Supabase
- The fingerprint is stored in localStorage for subsequent requests
- Each user can only have ONE registered device at a time (enforced by unique constraint)

**Files:**
- `src/app/login/page.tsx` - Registers device on login
- `src/app/signup/page.tsx` - Registers device on signup
- `src/server/routers/device.ts` - Device registration API

### 3. Device Validation

**On Every Protected Request:**
- The device fingerprint is sent via HTTP headers (`x-device-fingerprint`)
- The server validates the fingerprint against the registered device
- If the fingerprint doesn't match, the user is immediately logged out
- The `last_active_at` timestamp is updated on successful validation

**Files:**
- `src/server/trpc.ts` - Protected procedure with device validation
- `src/lib/trpc/client.tsx` - Sends fingerprint in headers

### 4. Auto-Logout on Device Mismatch

If a device mismatch is detected:
1. The server throws a `UNAUTHORIZED` error with message "Device verification failed"
2. The client-side error handler catches this error
3. The device fingerprint is cleared from localStorage
4. The user is signed out from Supabase
5. The user is redirected to the login page

**File:** `src/lib/trpc/client.tsx` - Error handling for device validation

### 5. Device Cleanup

**On Logout:**
- The device registration is removed from the database
- The device fingerprint is cleared from localStorage
- The user session is terminated

**Files:**
- `src/server/routers/auth.ts` - Unregisters device on signOut
- `src/lib/auth/useUser.tsx` - Clears fingerprint on SIGNED_OUT event

## Database Schema

### `user_devices` Table

```sql
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_device UNIQUE (user_id)
);
```

**Key Points:**
- One device per user (unique constraint on `user_id`)
- Cascade delete when user is deleted
- Row Level Security (RLS) enabled
- Users can only access their own device records

**Migration File:** `supabase/migrations/create_user_devices_table.sql`

## API Endpoints

### Device Router (`trpc.device`)

1. **`register`** (Protected)
   - Registers or updates the current device
   - Input: Device fingerprint and metadata
   - Replaces existing device if already registered

2. **`validate`** (Protected)
   - Validates if the current device matches the registered device
   - Input: Device fingerprint
   - Returns: `{ valid: boolean, reason: string | null }`

3. **`getCurrent`** (Protected)
   - Gets the currently registered device information
   - Returns: Device metadata and timestamps

4. **`unregister`** (Protected)
   - Unregisters the current device
   - Used during logout

## Security Benefits

1. **Session Isolation:** Ensures that users can only access their own data from their registered device
2. **Prevents Session Hijacking:** Even if session cookies are stolen, they won't work from a different device
3. **Automatic Logout:** Suspicious activity triggers immediate logout
4. **Single Device Policy:** Each user can only be logged in from one device at a time
5. **Idle Session Protection:** After being idle, reloading will verify the device before loading data

## Testing the Feature

### Test Case 1: Normal Login Flow
1. Sign up or log in to the application
2. Device is registered automatically
3. Browse the application - all requests succeed
4. Sign out - device is unregistered

### Test Case 2: Device Mismatch Detection
1. Log in as User A on Device 1
2. Clear localStorage or manually change the `device_fingerprint` value
3. Reload the page or make any request
4. User should be automatically logged out with message "Device verification failed"

### Test Case 3: Multi-User Session Isolation
1. Log in as User A on Device 1
2. Browse and create some expenses
3. Log out (device unregistered)
4. Log in as User B on the same device (new device registered)
5. Verify that only User B's data is visible
6. Reload after being idle
7. Verify that User B's data is still shown (not User A's)

## Implementation Files

### Core Files
- `src/lib/device/fingerprint.ts` - Device fingerprinting utility
- `src/server/routers/device.ts` - Device management API
- `src/server/trpc.ts` - Protected procedure with device validation
- `supabase/migrations/create_user_devices_table.sql` - Database schema

### Integration Files
- `src/app/login/page.tsx` - Login with device registration
- `src/app/signup/page.tsx` - Signup with device registration
- `src/server/routers/auth.ts` - SignOut with device cleanup
- `src/lib/auth/useUser.tsx` - Auth provider with device management
- `src/lib/trpc/client.tsx` - tRPC client with device headers and error handling

## Configuration

No additional configuration is required. The feature is automatically enabled for all users.

### Environment Variables

No new environment variables are needed. The feature uses the existing Supabase configuration.

## Limitations

1. **Browser Fingerprinting Accuracy:** Device fingerprints may change if the user updates their browser or changes system settings
2. **Single Device Policy:** Users cannot be logged in from multiple devices simultaneously
3. **Incognito/Private Mode:** May generate different fingerprints than normal mode
4. **Browser Extensions:** Some privacy extensions may interfere with fingerprint generation

## Future Enhancements

1. Multi-device support with device management UI
2. Device naming and identification
3. Session activity monitoring
4. Suspicious activity alerts
5. Trusted device whitelisting
