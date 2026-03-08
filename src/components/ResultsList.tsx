import { useState, useMemo } from "react";
import { PlatformResult } from "./PlatformResult";
import type { SearchResult } from "@/hooks/useSearch";

interface ResultsListProps {
  results: SearchResult[];
  showGuessedUsername?: boolean;
}

const STATUS_FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "found", label: "Bulundu" },
  { key: "uncertain", label: "Belirsiz" },
  { key: "not_found", label: "Bulunamadı" },
] as const;

export function ResultsList({ results, showGuessedUsername = false }: ResultsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(results.map((r) => r.platform.category)));
    return ["all", ...cats.sort()];
  }, [results]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const catMatch = activeCategory === "all" || r.platform.category === activeCategory;
      const statusMatch = activeStatus === "all" || r.status === activeStatus;
      return catMatch && statusMatch;
    });
  }, [results, activeCategory, activeStatus]);

  const found = results.filter((r) => r.status === "found").length;
  const uncertain = results.filter((r) => r.status === "uncertain").length;
  const done = results.filter((r) => r.status !== "pending").length;

  // Group by guessed username when in name mode
  const grouped = useMemo(() => {
    if (!showGuessedUsername) return null;
    const map = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const key = r.guessedUsername || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filtered, showGuessedUsername]);
  if (results.length === 0) return null;

  return (
    <div className="w-full max-w-2xl space-y-3">
      {/* Stats */}
      <div className="flex justify-between text-xs font-mono text-terminal/70 px-1">
        <span>{done}/{results.length} tarandı</span>
        <span>
          {found} bulundu
          {uncertain > 0 && <span className="text-amber-400 ml-2">{uncertain} belirsiz</span>}
        </span>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const count = cat === "all"
            ? results.length
            : results.filter((r) => r.platform.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                activeCategory === cat
                  ? "bg-terminal text-background"
                  : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
              }`}
            >
              {cat === "all" ? "Tümü" : cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Status filters - hide in name mode since we pre-filter to found */}
      {!showGuessedUsername && (
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count =
              key === "all"
                ? (activeCategory === "all" ? results : results.filter((r) => r.platform.category === activeCategory)).length
                : (activeCategory === "all" ? results : results.filter((r) => r.platform.category === activeCategory)).filter((r) => r.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveStatus(key)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  activeStatus === key
                    ? "bg-terminal/80 text-background"
                    : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
        {grouped ? (
          Array.from(grouped.entries()).map(([uname, items]) => (
            <div key={uname} className="space-y-1">
              <p className="text-xs font-mono text-terminal/50 px-1 pt-2">
                @{uname}
              </p>
              {items.map((r) => (
                <PlatformResult key={`${r.platform.name}-${r.guessedUsername}`} result={r} />
              ))}
            </div>
          ))
        ) : (
          filtered.map((r) => (
            <PlatformResult key={r.platform.name} result={r} />
          ))
        )}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground/50 font-mono text-xs py-4">
            Bu filtreye uygun sonuç bulunamadı
          </p>
        )}
      </div>
    </div>
  );
}
