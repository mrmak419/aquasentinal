#ifndef SECRETS_H
#define SECRETS_H

// ==========================================
// EXAMPLE SECRETS FILE
// Rename this file to 'secrets.h' and fill in your actual credentials.
// 'secrets.h' is ignored by git so your keys remain safe!
// ==========================================

// Supabase Configuration
// Ensure your URL points to the RPC function, NOT the table!
const char* supabase_url = "https://YOUR_PROJECT_REF.supabase.co/rest/v1/rpc/log_telemetry";
const char* supabase_key = "YOUR_SUPABASE_ANON_KEY";

// Device Configuration
// Generate a standard UUID (e.g. from uuidgenerator.net) for each physical ESP32 node
const char* device_id = "123e4567-e89b-12d3-a456-426614174000";
// Make up a random password for this specific device
const char* device_secret = "your_secure_password_here";

#endif
