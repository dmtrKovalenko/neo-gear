import { useState, useEffect } from "react";

export function useStickyState<T>(
  key: string,
  defaultValue: T,
  version = 1
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const versionedKey = `${key}:v${version}`;

  const loadValue = (): T => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const stored = localStorage.getItem(versionedKey);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (e) {
      console.warn(`Failed to load sticky state for "${versionedKey}":`, e);
    }
    return defaultValue;
  };

  const [state, setState] = useState<T>(loadValue);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(versionedKey, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to save sticky state for "${versionedKey}":`, e);
    }
  }, [versionedKey, state]);

  return [state, setState];
}
