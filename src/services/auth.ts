import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are missing in environment variables.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);


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


export async function logoutAndResetMFA(): Promise<void> {
  try {
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      console.error('Error listing MFA factors:', listError.message);
    } else if (data && data.totp) {
      for (const factor of data.totp) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (unenrollError) {
          console.error('Error unenrolling MFA factor:', unenrollError.message);
        } else {
          console.log(`MFA factor ${factor.id} unenrolled.`);
        }
      }
    }
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


