import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (username: string) => void;
  onReset: () => void;
  isSearching: boolean;
  hasResults: boolean;
}

export function SearchBar({ onSearch, onReset, isSearching, hasResults }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Kullanıcı adı girin..."
          disabled={isSearching}
          className="pl-10 bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono focus-visible:ring-terminal"
        />
      </div>
      <Button
        type="submit"
        disabled={isSearching || !value.trim()}
        className="bg-terminal text-background hover:bg-terminal/80 font-mono"
      >
        {isSearching ? "Aranıyor..." : "Ara"}
      </Button>
      {hasResults && !isSearching && (
        <Button
          type="button"
          variant="outline"
          onClick={() => { setValue(""); onReset(); }}
          className="border-terminal/30 text-terminal hover:bg-terminal/10 font-mono"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
