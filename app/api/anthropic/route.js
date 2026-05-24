// app/api/anthropic/route.js
// Server-side proxy for Anthropic API.
// - Rate limits anonymous searches by IP (uses server-side key)
// - Bypasses rate limit if user provides their own API key (BYOK)

import { checkRateLimit, MAX_SEARCHES_PER_DAY } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// Sources d'offres autorisées pour le web_search.
// Pour modifier : édite cette liste (sous-domaines inclus automatiquement).
// Ex. pour ajouter Welcome to the Jungle : "welcometothejungle.com"
const JOB_SOURCES = [
  "linkedin.com",
  "hellowork.com",
  "indeed.fr",
  "indeed.com",
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, system, useWebSearch = false } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "messages est requis (array)" },
        { status: 400 }
      );
    }

    // BYOK: user-supplied key takes priority, bypasses rate limit
    const userKey = req.headers.get("x-user-api-key");
    const usingBYOK = !!userKey;
    const apiKey = userKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Aucune clé API disponible. Configure ANTHROPIC_API_KEY ou fournis ta propre clé dans les paramètres.",
        },
        { status: 500 }
      );
    }

    // Rate limit: only on web searches (the expensive endpoint), only for anonymous users
    let rateInfo = null;
    if (!usingBYOK && useWebSearch) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "anonymous";

      const result = await checkRateLimit(ip);
      rateInfo = {
        limit: result.limit,
        remaining: Math.max(0, result.remaining - 1),
        configured: result.configured,
      };

      if (!result.success) {
        const resetDate = new Date(result.reset);
        return Response.json(
          {
            error: "rate_limit_exceeded",
            message: `Tu as atteint la limite de ${MAX_SEARCHES_PER_DAY} recherches par jour. Reviens demain ou utilise ta propre clé API dans les paramètres.`,
            limit: result.limit,
            remaining: 0,
            resetAt: resetDate.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Build Anthropic payload
    const payload = {
      model: MODEL,
      max_tokens: 2000,
      messages,
    };
    if (system) payload.system = system;
    if (useWebSearch) {
      payload.tools = [
        {
          type: "web_search_20250305",
          name: "web_search",
          allowed_domains: JOB_SOURCES,
          max_uses: 5,
        },
      ];
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        {
          error: `Anthropic API: ${res.status}`,
          detail: errText.slice(0, 300),
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return Response.json({
      text,
      rateInfo,
      usingBYOK,
    });
  } catch (e) {
    return Response.json(
      { error: "Erreur serveur", detail: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
