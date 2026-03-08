import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlatformResult } from "@/components/PlatformResult";
import type { SearchResult } from "@/hooks/useSearch";
import { Terminal, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SharedData {
  username: string;
  search_mode: string;
  results: Array<{
    platform: { name: string; url: string; category: string };
    url: string;
    status: string;
    meta?: { avatar?: string; bio?: string; title?: string };
    guessedUsername?: string;
  }>;
}

const SharedResults = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: row, error: err } = await supabase
        .from("shared_results")
        .select("*")
        .eq("id", id)
        .single();

      if (err || !row) {
        setError("Paylaşılan sonuç bulunamadı");
      } else {
        setData(row as unknown as SharedData);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ThemeToggle />
        <Loader2 className="h-6 w-6 animate-spin text-terminal" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <ThemeToggle />
        <p className="font-mono text-destructive">{error}</p>
        <Link to="/">
          <Button variant="outline" className="font-mono text-xs border-terminal/30 text-terminal">
            <ArrowLeft className="h-3 w-3 mr-1" /> Ana Sayfa
          </Button>
        </Link>
      </div>
    );
  }

  const results: SearchResult[] = data.results.map((r) => ({
    platform: r.platform,
    url: r.url,
    status: r.status as SearchResult["status"],
    meta: r.meta,
    guessedUsername: r.guessedUsername,
  }));

  const found = results.filter((r) => r.status === "found").length;
  const uncertain = results.filter((r) => r.status === "uncertain").length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-6">
      <ThemeToggle />

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Terminal className="h-6 w-6 text-terminal" />
          <h1 className="text-2xl font-bold font-mono text-terminal">
            Paylaşılan Sonuçlar
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          <span className="text-terminal font-semibold">@{data.username}</span> için arama sonuçları
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-xs font-mono text-terminal/70 px-1 mb-3">
          <span>{results.length} platform tarandı</span>
          <span>
            {found} bulundu
            {uncertain > 0 && <span className="text-amber-400 ml-2">{uncertain} belirsiz</span>}
          </span>
        </div>

        <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
          {results.map((r, i) => (
            <PlatformResult key={`${r.platform.name}-${i}`} result={r} />
          ))}
        </div>
      </div>

      <Link to="/">
        <Button variant="outline" className="font-mono text-xs border-terminal/30 text-terminal hover:bg-terminal/10">
          <ArrowLeft className="h-3 w-3 mr-1" /> Yeni Arama
        </Button>
      </Link>
    </div>
  );
};

export default SharedResults;
