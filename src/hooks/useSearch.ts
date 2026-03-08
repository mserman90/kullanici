import { useState, useCallback } from "react";
import { platforms, type Platform } from "@/data/platforms";

export interface SearchResult {
  platform: Platform;
  url: string;
  status: "found" | "not_found" | "error" | "pending";
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [username, setUsername] = useState("");

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setUsername(query);
    setIsSearching(true);
    setProgress(0);

    const initial: SearchResult[] = platforms.map((p) => ({
      platform: p,
      url: p.url.replace("{username}", query),
      status: "pending",
    }));
    setResults(initial);

    // Simulate search with staggered results (real fetch blocked by CORS)
    for (let i = 0; i < platforms.length; i++) {
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
      const found = Math.random() > 0.35; // ~65% found rate for demo
      setResults((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: found ? "found" : "not_found" } : r
        )
      );
      setProgress(((i + 1) / platforms.length) * 100);
    }

    setIsSearching(false);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setProgress(0);
    setUsername("");
    setIsSearching(false);
  }, []);

  return { results, isSearching, progress, username, search, reset };
}
