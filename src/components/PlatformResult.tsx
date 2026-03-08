import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { SearchResult, PhotoSimilarity } from "@/hooks/useSearch";

const similarityConfig: Record<string, { label: string; color: string; emoji: string }> = {
  high: { label: "Yüksek benzerlik", color: "text-terminal bg-terminal/10 border-terminal/30", emoji: "✅" },
  medium: { label: "Orta benzerlik", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", emoji: "🟡" },
  low: { label: "Düşük benzerlik", color: "text-muted-foreground bg-muted/10 border-muted/30", emoji: "⚪" },
  none: { label: "Eşleşmedi", color: "text-muted-foreground/50 bg-muted/5 border-muted/20", emoji: "❌" },
  pending: { label: "Karşılaştırılıyor...", color: "text-terminal/50 bg-terminal/5 border-terminal/20", emoji: "⏳" },
  skipped: { label: "Atlandı", color: "text-muted-foreground/40 bg-muted/5 border-muted/20", emoji: "⏭️" },
};

interface PlatformResultProps {
  result: SearchResult;
}

export function PlatformResult({ result }: PlatformResultProps) {
  const { platform, url, status, meta } = result;
  const [expanded, setExpanded] = useState(false);
  const hasMeta = meta && (meta.avatar || meta.bio || meta.title);
  const isExpandable = (status === "found" || status === "uncertain") && hasMeta;

  return (
    <div className="rounded-md border font-mono text-sm transition-all duration-300 overflow-hidden"
      style={{
        borderColor:
          status === "found" ? "hsl(var(--terminal) / 0.5)"
          : status === "uncertain" ? "hsl(45 100% 50% / 0.4)"
          : status === "error" ? "hsl(var(--destructive) / 0.4)"
          : "hsl(var(--muted) / 0.3)",
        background:
          status === "found" ? "hsl(var(--terminal) / 0.05)"
          : status === "uncertain" ? "hsl(45 100% 50% / 0.05)"
          : status === "error" ? "hsl(var(--destructive) / 0.05)"
          : "hsl(var(--muted) / 0.05)",
      }}
    >
      <div
        className={`flex items-center justify-between px-4 py-2.5 ${
          isExpandable ? "cursor-pointer hover:bg-terminal/5" : ""
        } ${
          status === "found" ? "text-terminal"
          : status === "not_found" ? "text-muted-foreground/60"
          : status === "uncertain" ? "text-amber-400"
          : status === "error" ? "text-destructive"
          : "text-muted-foreground/40"
        }`}
        onClick={() => isExpandable && setExpanded(!expanded)}
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
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-1 text-xs hover:underline ${
                status === "uncertain" ? "text-amber-400" : "text-terminal"
              }`}
            >
              Profili aç <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {isExpandable && (
            expanded
              ? <ChevronUp className="h-3.5 w-3.5 text-terminal/50" />
              : <ChevronDown className="h-3.5 w-3.5 text-terminal/50" />
          )}
        </div>
      </div>

      {/* Profile Preview */}
      {expanded && hasMeta && (
        <div className="px-4 pb-3 pt-1 border-t border-terminal/10 flex gap-3 items-start animate-in slide-in-from-top-1 duration-200">
          {meta.avatar && (
            <img
              src={meta.avatar}
              alt={`${platform.name} avatar`}
              className="w-12 h-12 rounded-md object-cover shrink-0 border border-terminal/20"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="min-w-0 space-y-0.5">
            {meta.title && (
              <p className="text-xs font-semibold text-terminal truncate">{meta.title}</p>
            )}
            {meta.bio && (
              <p className="text-xs text-muted-foreground/70 line-clamp-3 leading-relaxed">{meta.bio}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
