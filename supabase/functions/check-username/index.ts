import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckRequest {
  urls: { name: string; url: string }[];
}

// Patterns that indicate a profile was NOT found (login pages, 404 pages, generic pages)
const NOT_FOUND_PATTERNS = [
  /page not found/i,
  /404/i,
  /this page doesn.?t exist/i,
  /user not found/i,
  /profile.*not found/i,
  /account.*not found/i,
  /no user/i,
  /doesn.?t have a personal/i,
  /sign up/i,
  /create.*account/i,
  /join.*today/i,
  /this account doesn.?t exist/i,
  /hmm.*this page doesn/i,
  /sorry.*we couldn/i,
  /the page you.?re looking for/i,
  /nothing to see here/i,
];

// Patterns that strongly indicate a real profile exists
const FOUND_PATTERNS = [
  /followers/i,
  /following/i,
  /repositories/i,
  /contributions/i,
  /posts/i,
  /joined/i,
  /member since/i,
  /bio/i,
  /profile/i,
];

function analyzeContent(html: string, url: string): "found" | "not_found" | "uncertain" {
  // Check for not-found signals first
  const notFoundScore = NOT_FOUND_PATTERNS.reduce(
    (score, pattern) => score + (pattern.test(html) ? 1 : 0),
    0
  );

  // Check for found signals
  const foundScore = FOUND_PATTERNS.reduce(
    (score, pattern) => score + (pattern.test(html) ? 1 : 0),
    0
  );

  // Strong not-found signals
  if (notFoundScore >= 2) return "not_found";

  // Strong found signals
  if (foundScore >= 2 && notFoundScore === 0) return "found";

  // Ambiguous
  return "uncertain";
}

async function checkUrl(
  name: string,
  url: string
): Promise<{ name: string; url: string; status: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Use GET to retrieve HTML content for analysis
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    // Clear 404/410 = definitely not found
    if (res.status === 404 || res.status === 410) {
      return { name, url, status: "not_found" };
    }

    // Server error = can't determine
    if (res.status >= 500) {
      return { name, url, status: "error" };
    }

    // Read a limited amount of body for analysis (first 50KB)
    const reader = res.body?.getReader();
    if (!reader) {
      // Fallback: status-only check
      const found = res.status >= 200 && res.status < 400;
      return { name, url, status: found ? "found" : "not_found" };
    }

    let html = "";
    const decoder = new TextDecoder();
    const maxBytes = 50_000;
    let bytesRead = 0;

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.length;
    }
    reader.cancel();

    // For redirects to login/signup pages, likely not found
    const finalUrl = res.url || url;
    if (
      finalUrl !== url &&
      (/login|signin|sign-up|signup|register/i.test(finalUrl))
    ) {
      return { name, url, status: "not_found" };
    }

    // Analyze HTML content
    const contentResult = analyzeContent(html, url);

    if (contentResult === "found") {
      return { name, url, status: "found" };
    } else if (contentResult === "not_found") {
      return { name, url, status: "not_found" };
    }

    // Uncertain: fall back to HTTP status
    const found = res.status >= 200 && res.status < 400;
    return { name, url, status: found ? "found" : "not_found" };
  } catch {
    return { name, url, status: "error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = (await req.json()) as CheckRequest;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const batch = urls.slice(0, 10);

    const results = await Promise.allSettled(
      batch.map(({ name, url }) => checkUrl(name, url))
    );

    const data = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { name: "", url: "", status: "error" }
    );

    return new Response(JSON.stringify({ results: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
