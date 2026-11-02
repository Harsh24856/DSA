// Starts "Continue with Google". `next` is where the visitor lands afterwards.
import { supabase } from "./supabase/client";

export async function signInWithGoogle(next: string): Promise<string | null> {
  const { error } = await supabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
  });
  return error ? error.message : null;
}
