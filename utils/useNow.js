import { useEffect, useState } from "react";

// Re-renders the component every `intervalMs` so "upcoming" vs "past"
// labels stay correct while the screen is open.
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
