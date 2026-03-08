import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Filter, MapPin, Briefcase, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platforms as builtInPlatforms } from "@/data/platforms";
import { getCustomPlatforms } from "@/utils/customPlatforms";

export interface SearchFilters {
  selectedCategories: string[];
  locationKeyword: string;
  bioKeyword: string;
  referencePhoto: string | null; // base64 data URL
}

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  disabled?: boolean;
}

export const DEFAULT_FILTERS: SearchFilters = {
  selectedCategories: [],
  locationKeyword: "",
  bioKeyword: "",
  referencePhoto: null,
};

export function AdvancedFilters({ filters, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const allCategories = useMemo(() => {
    const all = [...builtInPlatforms, ...getCustomPlatforms()];
    return Array.from(new Set(all.map((p) => p.category))).sort();
  }, []);

  const toggleCategory = (cat: string) => {
    const selected = filters.selectedCategories.includes(cat)
      ? filters.selectedCategories.filter((c) => c !== cat)
      : [...filters.selectedCategories, cat];
    onChange({ ...filters, selectedCategories: selected });
  };

  const selectAll = () => onChange({ ...filters, selectedCategories: [] }); // empty = all

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'ı aşmamalı");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...filters, referencePhoto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const hasActiveFilters =
    filters.selectedCategories.length > 0 ||
    filters.locationKeyword.trim() !== "" ||
    filters.bioKeyword.trim() !== "" ||
    filters.referencePhoto !== null;

  return (
    <div className="w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded text-xs font-mono transition-all text-muted-foreground hover:text-terminal hover:bg-terminal/10"
      >
        <Filter className="h-3 w-3" />
        Gelişmiş Filtreler
        {hasActiveFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-terminal inline-block" />
        )}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-3 p-4 rounded-lg border border-terminal/20 bg-surface space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Platform categories */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-terminal/70 flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Platform Kategorileri
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                disabled={disabled}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                  filters.selectedCategories.length === 0
                    ? "bg-terminal text-background"
                    : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
                }`}
              >
                Tümü
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  disabled={disabled}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    filters.selectedCategories.includes(cat)
                      ? "bg-terminal text-background"
                      : "bg-muted/20 text-muted-foreground hover:bg-terminal/10 hover:text-terminal"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location keyword */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-terminal/70 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Konum Filtresi
            </label>
            <Input
              value={filters.locationKeyword}
              onChange={(e) => onChange({ ...filters, locationKeyword: e.target.value })}
              placeholder="ör: Istanbul, Turkey, San Francisco..."
              disabled={disabled}
              maxLength={100}
              className="bg-background border-terminal/20 text-terminal placeholder:text-terminal/30 font-mono text-xs focus-visible:ring-terminal h-8"
            />
            <p className="text-[10px] text-muted-foreground/40 font-mono">
              Biyografide bu konum geçen sonuçları gösterir
            </p>
          </div>

          {/* Bio keyword */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-terminal/70 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Meslek / Anahtar Kelime
            </label>
            <Input
              value={filters.bioKeyword}
              onChange={(e) => onChange({ ...filters, bioKeyword: e.target.value })}
              placeholder="ör: developer, designer, photographer..."
              disabled={disabled}
              maxLength={100}
              className="bg-background border-terminal/20 text-terminal placeholder:text-terminal/30 font-mono text-xs focus-visible:ring-terminal h-8"
            />
            <p className="text-[10px] text-muted-foreground/40 font-mono">
              Başlık veya biyografide bu kelime geçen sonuçları gösterir
            </p>
          </div>

          {/* Reference photo */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-terminal/70 flex items-center gap-1.5">
              <Image className="h-3 w-3" /> Referans Fotoğraf
            </label>
            <div className="flex items-center gap-2">
              {filters.referencePhoto ? (
                <div className="flex items-center gap-2">
                  <img
                    src={filters.referencePhoto}
                    alt="Referans"
                    className="w-10 h-10 rounded-md object-cover border border-terminal/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ ...filters, referencePhoto: null })}
                    disabled={disabled}
                    className="text-xs text-destructive hover:bg-destructive/10 font-mono h-7"
                  >
                    Kaldır
                  </Button>
                </div>
              ) : (
                <label className={`cursor-pointer px-3 py-1.5 rounded text-xs font-mono border border-dashed border-terminal/30 text-terminal/60 hover:bg-terminal/5 hover:text-terminal transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  Fotoğraf yükle
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={disabled}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/40 font-mono">
              Bulunan profil fotoğraflarıyla AI karşılaştırması yapar (max 2MB)
            </p>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(DEFAULT_FILTERS)}
              disabled={disabled}
              className="text-xs text-muted-foreground hover:text-terminal font-mono w-full"
            >
              Tüm filtreleri temizle
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
