import { CheckCircle2, XCircle, Loader2, ExternalLink, HelpCircle } from "lucide-react";
import type { SearchResult } from "@/hooks/useSearch";

interface PlatformResultProps {
  result: SearchResult;
}

export function PlatformResult({ result }: PlatformResultProps) {
  const { platform, url, status } = result;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-md border font-mono text-sm transition-all duration-300 ${
        status === "found"
          ? "border-terminal/50 bg-terminal/5 text-terminal"
          : status === "not_found"
          ? "border-muted/30 bg-muted/5 text-muted-foreground/60"
          : status === "uncertain"
          ? "border-amber-500/40 bg-amber-500/5 text-amber-400"
          : status === "error"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-muted/20 bg-muted/5 text-muted-foreground/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {status === "pending" && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-terminal/50" />}
        {status === "found" && <CheckCircle2 className="h-4 w-4 shrink-0 text-terminal" />}
        {status === "not_found" && <XCircle className="h-4 w-4 shrink-0" />}
        {status === "uncertain" && <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />}
        {status === "error" && <XCircle className="h-4 w-4 shrink-0" />}
        <span className="font-semibold whitespace-nowrap">{platform.name}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/50 hidden sm:inline">
          {platform.category}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {status === "uncertain" && (
          <span className="text-xs text-amber-400/80">Belirsiz</span>
        )}
        {(status === "found" || status === "uncertain") && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs hover:underline ${
              status === "uncertain" ? "text-amber-400" : "text-terminal"
            }`}
          >
            Profili aç <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
