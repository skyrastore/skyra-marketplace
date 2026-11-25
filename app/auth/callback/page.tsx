"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. First try: subscribe to SIGNED_IN event (fires once supabase-js
    //    processes the URL hash and stores tokens). This is the reliable path.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Full reload (not router.replace) so every page reads the fresh session
        window.location.assign("/");
      }
    });

    // 2. Belt-and-braces: if the hash was already processed before we subscribed
    //    (super fast), check getSession() right away too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.assign("/");
    });

    // 3. Hard timeout — if nothing happened after 4s, bounce to login with err
    const fallback = setTimeout(() => {
      window.location.assign("/login?error=callback_timeout");
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#1a52b8 0%,#2970ff 100%)",
        color: "#fff",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          border: "3px solid rgba(255,255,255,.3)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontFamily: "'Fredoka'", fontSize: "1rem", fontWeight: 600 }}>Menyelesaikan login…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
