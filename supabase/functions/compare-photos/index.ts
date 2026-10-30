import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TextContentPart {
  type: "text";
  text: string;
}

interface ImageContentPart {
  type: "image_url";
  image_url: { url: string };
}

type ContentPart = TextContentPart | ImageContentPart;

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referencePhoto, avatars } = await req.json();
    // referencePhoto: base64 data URL
    // avatars: Array<{ platformName: string; avatarUrl: string; guessedUsername?: string }>

    if (!referencePhoto || !avatars || avatars.length === 0) {
      return new Response(
        JSON.stringify({ error: "referencePhoto and avatars are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build image content parts for the AI
    const imageParts: ContentPart[] = [
      {
        type: "text",
        text: `You are a face/photo comparison expert. I will show you a reference photo and several profile avatar images. For each avatar, determine how likely it is the SAME PERSON as the reference photo.

Return ONLY a JSON array with objects like:
[{"index": 0, "similarity": "high"}, {"index": 1, "similarity": "low"}, ...]

similarity values: "high" (very likely same person), "medium" (possibly same person), "low" (unlikely same person), "none" (definitely not same person or no face visible).

Be strict - only mark "high" if facial features clearly match. Consider hair, face shape, skin tone, and distinctive features.`,
      },
      {
        type: "text",
        text: "REFERENCE PHOTO:",
      },
      {
        type: "image_url",
        image_url: { url: referencePhoto },
      },
    ];

    // Fetch each avatar and add as image
    const validAvatars: { index: number; platformName: string; guessedUsername?: string }[] = [];

    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      try {
        // Try to fetch the avatar to verify it's accessible
        const resp = await fetch(avatar.avatarUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
        });
        if (!resp.ok) continue;

        const contentType = resp.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) continue;

        const buffer = await resp.arrayBuffer();
        const base64 = uint8ArrayToBase64(new Uint8Array(buffer));
        const dataUrl = `data:${contentType};base64,${base64}`;

        imageParts.push(
          { type: "text", text: `AVATAR #${validAvatars.length} (${avatar.platformName}):` },
          { type: "image_url", image_url: { url: dataUrl } }
        );
        validAvatars.push({
          index: validAvatars.length,
          platformName: avatar.platformName,
          guessedUsername: avatar.guessedUsername,
        });
      } catch {
        // Skip inaccessible avatars
        continue;
      }

      // Limit to 8 avatars per request to avoid token limits
      if (validAvatars.length >= 8) break;
    }

    if (validAvatars.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI with vision model
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: imageParts,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI comparison failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON array from AI response
    let similarities: { index: number; similarity: string }[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        similarities = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    // Map back to platform names
    const results = validAvatars.map((avatar) => {
      const match = similarities.find((s) => s.index === avatar.index);
      return {
        platformName: avatar.platformName,
        guessedUsername: avatar.guessedUsername,
        similarity: match?.similarity || "none",
      };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compare-photos error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
