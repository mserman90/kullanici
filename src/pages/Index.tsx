import { useState, useCallback, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultsList } from "@/components/ResultsList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomPlatformManager } from "@/components/CustomPlatformManager";
import { AdvancedFilters, DEFAULT_FILTERS, type SearchFilters } from "@/components/AdvancedFilters";
import { useSearch } from "@/hooks/useSearch";
import { exportAsJSON, exportAsCSV } from "@/utils/export";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, Terminal, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [platformVersion, setPlatformVersion] = useState(0);
  const refreshPlatforms = useCallback(() => setPlatformVersion((v) => v + 1), []);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const { results, isSearching, isComparing, progress, username, search, reset, searchMode, guessedUsernames } = useSearch();
  const hasResults = results.length > 0;
  const isDone = hasResults && !isSearching;

  // Apply post-search filters (location, keyword in bio/title)
  const displayResults = useMemo(() => {
    let filtered = searchMode === "name"
      ? results.filter((r) => r.status === "found")
      : results;

    const loc = filters.locationKeyword.trim().toLowerCase();
    const kw = filters.bioKeyword.trim().toLowerCase();

    if (loc || kw) {
      filtered = filtered.map((r) => {
        // Only filter found/uncertain results that have meta
        if (r.status !== "found" && r.status !== "uncertain") return r;
        if (!r.meta) return r;

        const bioText = `${r.meta.bio || ""} ${r.meta.title || ""}`.toLowerCase();

        const locMatch = !loc || bioText.includes(loc);
        const kwMatch = !kw || bioText.includes(kw);

        if (!locMatch || !kwMatch) {
          // Mark as filtered out by dimming - change to not_found visually
          return { ...r, _filtered: true } as typeof r & { _filtered?: boolean };
        }
        return r;
      });

      // Move filtered-out items to the end, or hide them
      if (loc || kw) {
        filtered = filtered.filter((r) => {
          if (r.status !== "found" && r.status !== "uncertain") return true;
          if (!r.meta) return true; // keep items without meta (can't filter)
          const bioText = `${r.meta.bio || ""} ${r.meta.title || ""}`.toLowerCase();
          const locMatch = !loc || bioText.includes(loc);
          const kwMatch = !kw || bioText.includes(kw);
          return locMatch && kwMatch;
        });
      }
    }

    return filtered;
  }, [results, searchMode, filters.locationKeyword, filters.bioKeyword]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
      <ThemeToggle />
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Terminal className="h-8 w-8 text-terminal" />
          <h1 className="text-4xl font-bold font-mono text-terminal tracking-tight">
            Kullanıcı Adı
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm max-w-md">
          Sosyal medya platformlarında kullanıcı adı arayın. 50+ platform desteklenir.
        </p>
        <CustomPlatformManager onPlatformsChange={refreshPlatforms} />
      </div>

      {/* Search */}
      <SearchBar
        onSearch={search}
        onReset={reset}
        isSearching={isSearching}
        hasResults={hasResults}
        selectedCategories={filters.selectedCategories}
        referencePhoto={filters.referencePhoto}
      />

      {/* Advanced Filters */}
      <AdvancedFilters filters={filters} onChange={setFilters} disabled={isSearching} />

      {/* Progress */}
      {isSearching && (
        <div className="w-full max-w-2xl space-y-1">
          <Progress value={progress} className="h-1.5 bg-muted/20 [&>div]:bg-terminal" />
          <p className="text-xs text-terminal/60 font-mono text-center">
            &gt; {username} aranıyor... {Math.round(progress)}%
          </p>
          {searchMode === "name" && (
            <p className="text-xs text-terminal/40 font-mono text-center">
              {guessedUsernames.length} kullanıcı adı varyasyonu × {Math.round(results.length / Math.max(guessedUsernames.length, 1))} platform
            </p>
          )}
        </div>
      )}

      {/* Photo comparison progress */}
      {isComparing && (
        <div className="w-full max-w-2xl text-xs font-mono text-center text-terminal/60 animate-pulse">
          🔍 Referans fotoğraf ile profil fotoğrafları AI ile karşılaştırılıyor...
        </div>
      )}

      {/* Active filter info */}
      {isDone && (filters.locationKeyword.trim() || filters.bioKeyword.trim()) && (
        <div className="w-full max-w-2xl text-xs font-mono text-terminal/60 text-center">
          <p>
            Filtre uygulandı → {displayResults.filter((r) => r.status === "found" || r.status === "uncertain").length} eşleşme
            {filters.locationKeyword.trim() && <span className="text-terminal/40"> | konum: "{filters.locationKeyword.trim()}"</span>}
            {filters.bioKeyword.trim() && <span className="text-terminal/40"> | anahtar kelime: "{filters.bioKeyword.trim()}"</span>}
          </p>
        </div>
      )}

      {/* Name mode info */}
      {isDone && searchMode === "name" && (
        <div className="w-full max-w-2xl text-xs font-mono text-terminal/60 text-center space-y-1">
          <p>
            {guessedUsernames.length} varyasyon denendi → {displayResults.length} eşleşme bulundu
          </p>
        </div>
      )}

      {/* Export buttons */}
      {isDone && displayResults.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAsJSON(displayResults, username)}
            className="font-mono text-xs border-terminal/30 text-terminal hover:bg-terminal/10"
          >
            <Download className="h-3 w-3 mr-1" /> JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAsCSV(displayResults, username)}
            className="font-mono text-xs border-terminal/30 text-terminal hover:bg-terminal/10"
          >
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const shareable = displayResults
                  .filter((r) => r.status === "found" || r.status === "uncertain")
                  .map((r) => ({
                    platform: r.platform,
                    url: r.url,
                    status: r.status,
                    meta: r.meta,
                    guessedUsername: r.guessedUsername,
                  }));

                const { data, error } = await supabase
                  .from("shared_results")
                  .insert([{
                    username,
                    search_mode: searchMode,
                    results: JSON.parse(JSON.stringify(shareable)),
                  }])
                  .select("id")
                  .single();

                if (error || !data) {
                  toast.error("Paylaşım oluşturulamadı");
                  return;
                }

                const shareUrl = `${window.location.origin}/share/${data.id}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Paylaşım linki panoya kopyalandı!");
              } catch {
                toast.error("Bir hata oluştu");
              }
            }}
            className="font-mono text-xs border-terminal/30 text-terminal hover:bg-terminal/10"
          >
            <Share2 className="h-3 w-3 mr-1" /> Paylaş
          </Button>
        </div>
      )}

      {/* Results */}
      <ResultsList results={displayResults} showGuessedUsername={searchMode === "name"} />

      {/* Empty state */}
      {!hasResults && (
        <div className="text-center mt-8 font-mono text-muted-foreground/40 text-sm space-y-1">
          <p>&gt; Aramaya başlamak için bir kullanıcı adı veya ad-soyad girin</p>
          <p className="text-xs">&gt; Örnek: johndoe, elonmusk, torvalds</p>
        </div>
      )}
    </div>
  );
};

export default Index;
