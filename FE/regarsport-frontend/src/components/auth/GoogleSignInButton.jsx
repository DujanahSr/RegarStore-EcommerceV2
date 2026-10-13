import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Tombol resmi "Sign in with Google" (Google Identity Services).
 * onCredential menerima ID token (JWT) yang diverifikasi backend. Tidak tampil kalau VITE_GOOGLE_CLIENT_ID kosong.
 */
export default function GoogleSignInButton({ onCredential, text = "continue_with" }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    let attempts = 0;

    const render = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts < 50) setTimeout(render, 150);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => callbackRef.current?.(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text,
        width: Math.min(400, containerRef.current.offsetWidth || 320),
      });
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;
  return <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />;
}
