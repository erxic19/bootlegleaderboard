/**
 * Bootleg Juice & Co. Cloudflare Worker
 *
 * Environment variables in Cloudflare:
 *   SW_API_KEY = SilentWolf API key
 *   SW_GAME_ID = SilentWolf game ID
 */

const SW_BASE = "https://api.silentwolf.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...CORS_HEADERS, ...(init.headers || {}) },
  });
}

function cleanName(value) {
  return String(value || "").trim().slice(0, 24);
}

function cleanLeaderboard(value) {
  return String(value || "main").trim().slice(0, 48) || "main";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (!env.SW_API_KEY || !env.SW_GAME_ID) {
      return json({ success: false, error: "Worker is missing SilentWolf configuration" }, { status: 500 });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/scores") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      const max = Math.min(Math.max(parseInt(url.searchParams.get("max") || "15", 10) || 15, 1), 100);
      const ldboard = cleanLeaderboard(url.searchParams.get("ldboard_name"));
      const swUrl = `${SW_BASE}/get_scores/${env.SW_GAME_ID}?max=${max}&ldboard_name=${encodeURIComponent(ldboard)}`;

      try {
        const swRes = await fetch(swUrl, {
          headers: { "x-api-key": env.SW_API_KEY },
        });
        const data = await swRes.json();

        if (!swRes.ok) {
          return json({ scores: [], success: false, error: data.message || "SilentWolf request failed" }, { status: swRes.status });
        }

        const scores = (data.top_scores || []).map((s) => ({
          player_name: s.pn,
          score: s.s,
          time: s.md?.time ?? null,
          timestamp: s.t,
        }));

        return json({ scores, success: true });
      } catch (e) {
        return json({ scores: [], success: false, error: e.message }, { status: 500 });
      }
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }

      const playerName = cleanName(body.player_name || body.playerName || body.name);
      const score = Number(body.score);
      const ldboard = cleanLeaderboard(body.ldboard_name || body.leaderboard || body.leaderboard_name);
      const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

      if (!playerName) {
        return json({ success: false, error: "player_name is required" }, { status: 400 });
      }

      if (!Number.isFinite(score)) {
        return json({ success: false, error: "score must be a number" }, { status: 400 });
      }

      const swPayload = {
        player_name: playerName,
        score,
        ldboard_name: ldboard,
        metadata,
      };

      try {
        const swRes = await fetch(`${SW_BASE}/add_score/${env.SW_GAME_ID}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.SW_API_KEY,
          },
          body: JSON.stringify(swPayload),
        });
        const data = await swRes.json();

        if (!swRes.ok) {
          return json({ success: false, error: data.message || "SilentWolf request failed" }, { status: swRes.status });
        }

        return json({ success: true, result: data });
      } catch (e) {
        return json({ success: false, error: e.message }, { status: 500 });
      }
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  },
};
