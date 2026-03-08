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
];

// Platform-specific rules to reduce false positives
interface PlatformRule {
  hostPattern: RegExp;
  notFoundPatterns?: RegExp[];
  foundPatterns?: RegExp[];
  alwaysUncertain?: boolean; // force status-only check
}

const PLATFORM_RULES: PlatformRule[] = [
  {
    hostPattern: /tiktok\.com/i,
    notFoundPatterns: [
      /couldn.?t find this account/i,
      /check out the latest videos/i,
      /discover.*tiktok/i,
      /something went wrong/i,
    ],
    foundPatterns: [
      /follower/i,
      /following/i,
      /likes?\b/i,
      /videos?\b/i,
    ],
    alwaysUncertain: true, // TikTok is a SPA, HTML is unreliable
  },
  {
    hostPattern: /snapchat\.com/i,
    notFoundPatterns: [
      /snapchat\.com\/add\b/i, // stayed on generic add page
      /add me on snapchat/i,
      /page not available/i,
    ],
    foundPatterns: [
      /snapcode/i,
      /snap\s*score/i,
      /subscriber/i,
    ],
    alwaysUncertain: true, // Snapchat rarely exposes public profiles
  },
  {
    hostPattern: /discord\.com/i,
    alwaysUncertain: true, // Discord profiles are not publicly scrapeable
  },
  {
    hostPattern: /t\.me/i,
    notFoundPatterns: [
      /if you have.*telegram/i,
      /get telegram/i,
      /install telegram/i,
    ],
    foundPatterns: [
      /subscribers?/i,
      /members?/i,
      /online/i,
    ],
  },
  {
    hostPattern: /slack\.com/i,
    alwaysUncertain: true, // Slack workspaces are private
  },
  {
    hostPattern: /x\.com|twitter\.com/i,
    notFoundPatterns: [
      /this account doesn.?t exist/i,
      /account suspended/i,
      /caution.*this profile/i,
    ],
    foundPatterns: [
      /followers?/i,
      /following/i,
      /tweets?/i,
      /posts?/i,
    ],
  },
  {
    hostPattern: /instagram\.com/i,
    notFoundPatterns: [
      /sorry.*this page isn.?t available/i,
      /the link you followed may be broken/i,
    ],
    foundPatterns: [
      /followers?/i,
      /following/i,
      /posts?/i,
    ],
  },
  {
    hostPattern: /facebook\.com/i,
    notFoundPatterns: [
      /page not found/i,
      /this content isn.?t available/i,
      /the link may be broken/i,
    ],
    foundPatterns: [
      /friends?/i,
      /followers?/i,
      /timeline/i,
    ],
  },
  {
    hostPattern: /steamcommunity\.com/i,
    notFoundPatterns: [
      /the specified profile could not be found/i,
      /error/i,
    ],
    foundPatterns: [
      /level\s*\d/i,
      /badges/i,
      /games/i,
      /friends/i,
    ],
  },
  {
    hostPattern: /roblox\.com/i,
    notFoundPatterns: [
      /page cannot be found/i,
      /404/i,
    ],
    foundPatterns: [
      /friends/i,
      /followers/i,
      /following/i,
      /member since/i,
    ],
  },
];

function getPlatformRule(url: string): PlatformRule | undefined {
  return PLATFORM_RULES.find((r) => r.hostPattern.test(url));
}

function analyzeContent(html: string, url: string): "found" | "not_found" | "uncertain" {
  const rule = getPlatformRule(url);

  // Platform marked as always uncertain (can't reliably scrape)
  if (rule?.alwaysUncertain) return "uncertain";

  // Use platform-specific patterns if available, else fallback to generic
  const notFoundList = rule?.notFoundPatterns
    ? [...NOT_FOUND_PATTERNS, ...rule.notFoundPatterns]
    : NOT_FOUND_PATTERNS;

  const foundList = rule?.foundPatterns || FOUND_PATTERNS;

  const notFoundScore = notFoundList.reduce(
    (score, pattern) => score + (pattern.test(html) ? 1 : 0),
    0
  );

  const foundScore = foundList.reduce(
    (score, pattern) => score + (pattern.test(html) ? 1 : 0),
    0
  );

  // Strong not-found signals
  if (notFoundScore >= 2) return "not_found";

  // For platforms with custom rules, require stronger found signals
  if (rule) {
    if (foundScore >= 2 && notFoundScore === 0) return "found";
    return "uncertain";
  }

  // Generic: found if decent signal
  if (foundScore >= 2 && notFoundScore === 0) return "found";

  return "uncertain";
}

function extractMeta(html: string): { avatar?: string; bio?: string; title?: string } {
  const meta: { avatar?: string; bio?: string; title?: string } = {};

  // og:image
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImage?.[1]) meta.avatar = ogImage[1];

  // og:description or meta description
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
    || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (ogDesc?.[1]) meta.bio = ogDesc[1].substring(0, 200);

  // og:title
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle?.[1]) meta.title = ogTitle[1].substring(0, 100);

  return meta;
}

async function checkUrl(
  name: string,
  url: string
): Promise<{ name: string; url: string; status: string; meta?: { avatar?: string; bio?: string; title?: string } }> {
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

    // Check if this platform has alwaysUncertain flag
    const rule = getPlatformRule(url);
    if (rule?.alwaysUncertain) {
      return { name, url, status: "uncertain" };
    }

    // Uncertain without platform rule: fall back to HTTP status
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
