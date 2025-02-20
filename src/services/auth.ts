import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use environment variables for the Supabase URL and Key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Initialize your Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);

// =====================================================================
// Sign up a new user with first name, last name, email and password
// =====================================================================
export async function signUpWithEmail(
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  });
  if (error) {
    throw error;
  }
  return data;
}

// =====================================================================
// Sign in a user with email and password
// =====================================================================
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw error;
  }
  return data;
}

// =====================================================================
// Logout and Reset MFA
// =====================================================================
// This function unenrolls any enrolled MFA (TOTP) factors and then signs
// the user out. On the next login, the user will start with an unverified factor (aal1),
// and the MFA challenge will be triggered.
export async function logoutAndResetMFA(): Promise<void> {
  try {
    // List currently enrolled MFA factors
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      console.error('Error listing MFA factors:', listError.message);
      // Optionally, continue even if listing fails
    } else if (data && data.totp) {
      // Loop through each TOTP factor and unenroll it
      for (const factor of data.totp) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (unenrollError) {
          console.error('Error unenrolling MFA factor:', unenrollError.message);
        } else {
          console.log(`MFA factor ${factor.id} unenrolled.`);
        }
      }
    }
    // Finally, sign the user out
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out:', signOutError.message);
    } else {
      console.log('User signed out and MFA reset.');
    }
  } catch (err) {
    console.error('Unexpected error during logout:', err);
  }
}

// =====================================================================
// Verify MFA code and upgrade assurance level (aal2)
// =====================================================================
export async function verifyMfa({
  code,
  factorId,
  challengeId,
}: { code: string; factorId: string; challengeId: string; }) {
  const { data, error } = await supabase.auth.mfa.verify({ code, factorId, challengeId });
  if (error) {
    throw error;
  }
  return data;
}

// =====================================================================
// You can add more authentication-related functions below...
// =====================================================================
