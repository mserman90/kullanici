import { useState, useCallback } from "react";
import { platforms as builtInPlatforms, type Platform } from "@/data/platforms";
import { supabase } from "@/integrations/supabase/client";
import { generateUsernames } from "@/utils/usernameGenerator";
import { getCustomPlatforms } from "@/utils/customPlatforms";
import type { SearchMode } from "@/components/SearchBar";

export interface ProfileMeta {
  avatar?: string;
  bio?: string;
  title?: string;
}

export type PhotoSimilarity = "high" | "medium" | "low" | "none" | "pending" | "skipped";

export interface SearchResult {
  platform: Platform;
  url: string;
  status: "found" | "not_found" | "uncertain" | "error" | "pending";
  guessedUsername?: string;
  meta?: ProfileMeta;
  photoSimilarity?: PhotoSimilarity;
}

const BATCH_SIZE = 10;

function getAllPlatforms(selectedCategories?: string[]): Platform[] {
  const all = [...builtInPlatforms, ...getCustomPlatforms()];
  if (selectedCategories && selectedCategories.length > 0) {
    return all.filter((p) => selectedCategories.includes(p.category));
  }
  return all;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [username, setUsername] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("username");
  const [guessedUsernames, setGuessedUsernames] = useState<string[]>([]);

  const comparePhotos = useCallback(async (referencePhoto: string, currentResults: SearchResult[]) => {
    const withAvatars = currentResults.filter(
      (r) => (r.status === "found" || r.status === "uncertain") && r.meta?.avatar
    );
    if (withAvatars.length === 0) return;

    setIsComparing(true);

    // Mark eligible results as pending comparison
    setResults((prev) =>
      prev.map((r) =>
        withAvatars.some((w) => w.platform.name === r.platform.name && w.guessedUsername === r.guessedUsername)
          ? { ...r, photoSimilarity: "pending" as const }
          : r
      )
    );

    // Process in batches of 8
    const PHOTO_BATCH = 8;
    for (let i = 0; i < withAvatars.length; i += PHOTO_BATCH) {
      const batch = withAvatars.slice(i, i + PHOTO_BATCH);
      const avatars = batch.map((r) => ({
        platformName: r.platform.name,
        avatarUrl: r.meta!.avatar!,
        guessedUsername: r.guessedUsername,
      }));

      try {
        const { data, error } = await supabase.functions.invoke("compare-photos", {
          body: { referencePhoto, avatars },
        });

        if (error || !data?.results) {
          setResults((prev) =>
            prev.map((r) =>
              batch.some((b) => b.platform.name === r.platform.name && b.guessedUsername === r.guessedUsername)
                ? { ...r, photoSimilarity: "skipped" as const }
                : r
            )
          );
        } else {
          setResults((prev) =>
            prev.map((r) => {
              const match = data.results.find(
                (d: { platformName: string; similarity: string; guessedUsername?: string }) =>
                  d.platformName === r.platform.name &&
                  (!d.guessedUsername || d.guessedUsername === r.guessedUsername)
              );
              return match ? { ...r, photoSimilarity: match.similarity as PhotoSimilarity } : r;
            })
          );
        }
      } catch {
        setResults((prev) =>
          prev.map((r) =>
            batch.some((b) => b.platform.name === r.platform.name && b.guessedUsername === r.guessedUsername)
              ? { ...r, photoSimilarity: "skipped" as const }
              : r
          )
        );
      }
    }

    setIsComparing(false);
  }, []);

  const searchUsername = useCallback(async (query: string, selectedCategories?: string[]) => {
    const platforms = getAllPlatforms(selectedCategories);
    const initial: SearchResult[] = platforms.map((p) => ({
      platform: p,
      url: p.url.replace("{username}", query),
      status: "pending" as const,
    }));
    setResults(initial);

    for (let i = 0; i < platforms.length; i += BATCH_SIZE) {
      const batch = initial.slice(i, i + BATCH_SIZE);
      const urls = batch.map((r) => ({ name: r.platform.name, url: r.url }));

      try {
        const { data, error } = await supabase.functions.invoke("check-username", {
          body: { urls },
        });

        if (error || !data?.results) {
          setResults((prev) =>
            prev.map((r) =>
              urls.some((u) => u.name === r.platform.name) ? { ...r, status: "error" } : r
            )
          );
        } else {
          setResults((prev) =>
            prev.map((r) => {
              const match = data.results.find(
                (d: { name: string; status: string; meta?: ProfileMeta }) => d.name === r.platform.name
              );
              return match ? { ...r, status: match.status, meta: match.meta } : r;
            })
          );
        }
      } catch {
        setResults((prev) =>
          prev.map((r) =>
            urls.some((u) => u.name === r.platform.name) ? { ...r, status: "error" } : r
          )
        );
      }

      setProgress(Math.min(((i + BATCH_SIZE) / platforms.length) * 100, 100));
    }
  }, []);

  const searchByName = useCallback(async (firstName: string, lastName: string, selectedCategories?: string[]) => {
    const platforms = getAllPlatforms(selectedCategories);
    const usernames = generateUsernames(firstName, lastName);
    setGuessedUsernames(usernames);

    // Create results: each platform × each username guess
    const initial: SearchResult[] = [];
    for (const uname of usernames) {
      for (const p of platforms) {
        initial.push({
          platform: p,
          url: p.url.replace("{username}", uname),
          status: "pending",
          guessedUsername: uname,
        });
      }
    }
    setResults(initial);

    const totalChecks = initial.length;
    let completed = 0;

    for (let i = 0; i < initial.length; i += BATCH_SIZE) {
      const batch = initial.slice(i, i + BATCH_SIZE);
      const urls = batch.map((r) => ({
        name: `${r.platform.name}__${r.guessedUsername}`,
        url: r.url,
      }));

      try {
        const { data, error } = await supabase.functions.invoke("check-username", {
          body: { urls },
        });

        if (error || !data?.results) {
          setResults((prev) =>
            prev.map((r) => {
              const key = `${r.platform.name}__${r.guessedUsername}`;
              return urls.some((u) => u.name === key) ? { ...r, status: "error" } : r;
            })
          );
        } else {
          setResults((prev) =>
            prev.map((r) => {
              const key = `${r.platform.name}__${r.guessedUsername}`;
              const match = data.results.find(
                (d: { name: string; status: string; meta?: ProfileMeta }) => d.name === key
              );
              return match ? { ...r, status: match.status, meta: match.meta } : r;
            })
          );
        }
      } catch {
        setResults((prev) =>
          prev.map((r) => {
            const key = `${r.platform.name}__${r.guessedUsername}`;
            return urls.some((u) => u.name === key) ? { ...r, status: "error" } : r;
          })
        );
      }

      completed += batch.length;
      setProgress(Math.min((completed / totalChecks) * 100, 100));
    }
  }, []);

  const search = useCallback(
    async (query: string, mode: SearchMode, firstName?: string, lastName?: string, selectedCategories?: string[], referencePhoto?: string | null) => {
      setIsSearching(true);
      setProgress(0);
      setSearchMode(mode);

      if (mode === "username") {
        setUsername(query);
        await searchUsername(query, selectedCategories);
      } else if (firstName && lastName) {
        setUsername(`${firstName} ${lastName}`);
        await searchByName(firstName, lastName, selectedCategories);
      }

      setIsSearching(false);

      // If reference photo provided, run comparison
      if (referencePhoto) {
        // Get latest results after search completes
        setResults((currentResults) => {
          // Trigger comparison asynchronously
          comparePhotos(referencePhoto, currentResults);
          return currentResults;
        });
      }
    },
    [searchUsername, searchByName, comparePhotos]
  );

  const reset = useCallback(() => {
    setResults([]);
    setProgress(0);
    setUsername("");
    setIsSearching(false);
    setGuessedUsernames([]);
  }, []);

  return { results, isSearching, progress, username, search, reset, searchMode, guessedUsernames };
}
