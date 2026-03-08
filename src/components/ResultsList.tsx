import { PlatformResult } from "./PlatformResult";
import type { SearchResult } from "@/hooks/useSearch";

interface ResultsListProps {
  results: SearchResult[];
}

export function ResultsList({ results }: ResultsListProps) {
  if (results.length === 0) return null;

  const found = results.filter((r) => r.status === "found").length;
  const done = results.filter((r) => r.status !== "pending").length;

  return (
    <div className="w-full max-w-2xl space-y-2">
      <div className="flex justify-between text-xs font-mono text-terminal/70 px-1">
        <span>{done}/{results.length} tarandı</span>
        <span>{found} bulundu</span>
      </div>
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
        {results.map((r) => (
          <PlatformResult key={r.platform.name} result={r} />
        ))}
      </div>
    </div>
  );
}
