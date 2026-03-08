import { SearchBar } from "@/components/SearchBar";
import { ResultsList } from "@/components/ResultsList";
import { useSearch } from "@/hooks/useSearch";
import { exportAsJSON, exportAsCSV } from "@/utils/export";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, Terminal } from "lucide-react";

const Index = () => {
  const { results, isSearching, progress, username, search, reset, searchMode, guessedUsernames } = useSearch();
  const hasResults = results.length > 0;
  const isDone = hasResults && !isSearching;

  // For name mode, only show found results
  const displayResults = searchMode === "name"
    ? results.filter((r) => r.status === "found")
    : results;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
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
      </div>

      {/* Search */}
      <SearchBar
        onSearch={search}
        onReset={reset}
        isSearching={isSearching}
        hasResults={hasResults}
      />

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
        <div className="flex gap-2">
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
