import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// By default the login lasts only until the browser tab/window is closed.
// If the user ticks "Keep me signed in", the login is stored for later visits.
const storage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    const keep = window.localStorage.getItem("remember_me") === "1";
    (keep ? window.localStorage : window.sessionStorage).setItem(key, value);
    (keep ? window.sessionStorage : window.localStorage).removeItem(key);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storage },
});
