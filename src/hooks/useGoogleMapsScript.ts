import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script."));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export function useGoogleMapsScript() {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_GOOGLE_MAPS_API_KEY environment variable.");
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, [loaded]);

  return { loaded, error };
}
