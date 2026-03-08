import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Platform } from "@/data/platforms";
import {
  getCustomPlatforms,
  addCustomPlatform,
  removeCustomPlatform,
} from "@/utils/customPlatforms";

interface Props {
  onPlatformsChange: () => void;
}

export function CustomPlatformManager({ onPlatformsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customs, setCustoms] = useState<Platform[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Custom");
  const [error, setError] = useState("");

  useEffect(() => {
    setCustoms(getCustomPlatforms());
  }, [open]);

  const handleAdd = () => {
    setError("");

    const trimName = name.trim();
    const trimUrl = url.trim();

    if (!trimName || trimName.length > 50) {
      setError("Platform adı 1-50 karakter olmalı");
      return;
    }
    if (!trimUrl || !trimUrl.includes("{username}")) {
      setError("URL '{username}' yer tutucusunu içermeli (ör: https://site.com/{username})");
      return;
    }
    try {
      const testUrl = trimUrl.replace("{username}", "test");
      new URL(testUrl);
    } catch {
      setError("Geçerli bir URL girin");
      return;
    }
    if (customs.some((p) => p.name.toLowerCase() === trimName.toLowerCase())) {
      setError("Bu isimde bir platform zaten var");
      return;
    }

    const newPlatform: Platform = {
      name: trimName,
      url: trimUrl,
      category: category.trim() || "Custom",
    };

    const updated = addCustomPlatform(newPlatform);
    setCustoms(updated);
    setName("");
    setUrl("");
    setCategory("Custom");
    onPlatformsChange();
  };

  const handleRemove = (platformName: string) => {
    const updated = removeCustomPlatform(platformName);
    setCustoms(updated);
    onPlatformsChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs border-terminal/30 text-terminal hover:bg-terminal/10"
        >
          <Plus className="h-3 w-3 mr-1" /> Platform Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-terminal/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-terminal flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Özel Platformlar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add form */}
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Platform adı (ör: MySpace)"
              maxLength={50}
              className="bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono text-sm focus-visible:ring-terminal"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL şablonu (ör: https://myspace.com/{username})"
              className="bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono text-sm focus-visible:ring-terminal"
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori (ör: Social)"
              maxLength={30}
              className="bg-surface border-terminal/30 text-terminal placeholder:text-terminal/40 font-mono text-sm focus-visible:ring-terminal"
            />
            {error && (
              <p className="text-xs text-destructive font-mono">{error}</p>
            )}
            <Button
              onClick={handleAdd}
              size="sm"
              className="w-full bg-terminal text-background hover:bg-terminal/80 font-mono text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Ekle
            </Button>
          </div>

          {/* List */}
          {customs.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <p className="text-xs font-mono text-terminal/50">
                {customs.length} özel platform
              </p>
              {customs.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-terminal/20 bg-surface font-mono text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-terminal font-semibold">{p.name}</span>
                    <span className="text-muted-foreground ml-2">{p.category}</span>
                    <p className="text-muted-foreground/50 truncate text-[10px]">{p.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(p.name)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {customs.length === 0 && (
            <p className="text-xs font-mono text-muted-foreground/50 text-center py-2">
              Henüz özel platform eklenmedi
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
