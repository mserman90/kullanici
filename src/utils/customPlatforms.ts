import type { Platform } from "@/data/platforms";

const STORAGE_KEY = "custom-platforms";

export function getCustomPlatforms(): Platform[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Platform[];
  } catch {
    return [];
  }
}

export function saveCustomPlatforms(platforms: Platform[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(platforms));
}

export function addCustomPlatform(platform: Platform) {
  const existing = getCustomPlatforms();
  existing.push(platform);
  saveCustomPlatforms(existing);
  return existing;
}

export function removeCustomPlatform(name: string) {
  const existing = getCustomPlatforms().filter((p) => p.name !== name);
  saveCustomPlatforms(existing);
  return existing;
}
