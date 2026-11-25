"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase JS auto-captures the OAuth hash/code on this URL
    // via detectSessionInUrl (default). Give it a tick, then bounce.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? "/" : "/login?error=callback_failed");
    }, 400);
    return () => clearTimeout(timer);
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
