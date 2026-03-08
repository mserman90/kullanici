import { useState, useCallback } from "react";
import { platforms, type Platform } from "@/data/platforms";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  platform: Platform;
  url: string;
  status: "found" | "not_found" | "error" | "pending";
}

const BATCH_SIZE = 10;

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

    // Process in batches of BATCH_SIZE via edge function
    for (let i = 0; i < platforms.length; i += BATCH_SIZE) {
      const batch = initial.slice(i, i + BATCH_SIZE);
      const urls = batch.map((r) => ({ name: r.platform.name, url: r.url }));

      try {
        const { data, error } = await supabase.functions.invoke("check-username", {
          body: { urls },
        });

        if (error || !data?.results) {
          // Mark batch as error
          setResults((prev) =>
            prev.map((r) =>
              urls.some((u) => u.name === r.platform.name)
                ? { ...r, status: "error" }
                : r
            )
          );
        } else {
          setResults((prev) =>
            prev.map((r) => {
              const match = data.results.find(
                (d: { name: string; status: string }) => d.name === r.platform.name
              );
              return match ? { ...r, status: match.status } : r;
            })
          );
        }
      } catch {
        setResults((prev) =>
          prev.map((r) =>
            urls.some((u) => u.name === r.platform.name)
              ? { ...r, status: "error" }
              : r
          )
        );
      }

      setProgress(Math.min(((i + BATCH_SIZE) / platforms.length) * 100, 100));
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
