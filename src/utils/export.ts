import type { SearchResult } from "@/hooks/useSearch";

export function exportAsJSON(results: SearchResult[], username: string) {
  const data = {
    username,
    timestamp: new Date().toISOString(),
    results: results.map((r) => ({
      platform: r.platform.name,
      status: r.status,
      url: r.url,
      category: r.platform.category,
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), `sherlock_${username}.json`, "application/json");
}

export function exportAsCSV(results: SearchResult[], username: string) {
  const header = "Platform,Category,Status,URL";
  const rows = results.map(
    (r) => `"${r.platform.name}","${r.platform.category}","${r.status}","${r.url}"`
  );
  downloadFile([header, ...rows].join("\n"), `sherlock_${username}.csv`, "text/csv");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
