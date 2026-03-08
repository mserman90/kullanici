import { useState } from "react";
import { Search, RotateCcw, User, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SearchMode = "username" | "name";

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode, firstName?: string, lastName?: string, selectedCategories?: string[], referencePhoto?: string | null) => void;
  onReset: () => void;
  isSearching: boolean;
  hasResults: boolean;
  selectedCategories?: string[];
  referencePhoto?: string | null;
}

export function SearchBar({ onSearch, onReset, isSearching, hasResults, selectedCategories, referencePhoto }: SearchBarProps) {
  const [mode, setMode] = useState<SearchMode>("username");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "username" && username.trim()) {
      onSearch(username.trim(), "username", undefined, undefined, selectedCategories, referencePhoto);
    } else if (mode === "name" && firstName.trim() && lastName.trim()) {
      onSearch("", "name", firstName.trim(), lastName.trim(), selectedCategories, referencePhoto);
    }
  };

  const canSubmit =
    mode === "username" ? !!username.trim() : !!(firstName.trim() && lastName.trim());

  return (
    <div className="w-full max-w-2xl space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1.5 justify-center">
        <button
          type="button"
          onClick={() => setMode("username")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            mode === "username"
              ? "bg-terminal text-background"
              : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
          }`}
        >
          <AtSign className="h-3 w-3" />
          Kullanıcı Adı
        </button>
        <button
          type="button"
          onClick={() => setMode("name")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
            mode === "name"
              ? "bg-terminal text-background"
              : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
          }`}
        >
          <User className="h-3 w-3" />
          Ad & Soyad
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-3 w-full">
        {mode === "username" ? (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı girin..."
              disabled={isSearching}
              className="pl-10 bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono focus-visible:ring-terminal"
            />
          </div>
        ) : (
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal" />
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ad..."
                disabled={isSearching}
                className="pl-10 bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono focus-visible:ring-terminal"
              />
            </div>
            <div className="flex-1">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyad..."
                disabled={isSearching}
                className="bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono focus-visible:ring-terminal"
              />
            </div>
          </div>
        )}
        <Button
          type="submit"
          disabled={isSearching || !canSubmit}
          className="bg-terminal text-background hover:bg-terminal/80 font-mono"
        >
          {isSearching ? "Aranıyor..." : "Ara"}
        </Button>
        {hasResults && !isSearching && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUsername("");
              setFirstName("");
              setLastName("");
              onReset();
            }}
            className="border-terminal/30 text-terminal hover:bg-terminal/10 font-mono"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
