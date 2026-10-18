import { createClient } from "@supabase/supabase-js";

// Set ANTHROPIC_API_KEY in Vercel (Project > Settings > Environment Variables).
// Optional: CHAT_MODEL to use another Claude model (default is the cheapest one).
const MODEL = process.env.CHAT_MODEL || "claude-haiku-5-5";

// Simple best-effort limit: 30 questions per 10 minutes per user.
const hits = new Map();
function tooMany(userId) {
  const now = Date.now();
  const list = (hits.get(userId) || []).filter((x) => now - x < 10 * 60 * 1000);
  if (list.length >= 30) {
    hits.set(userId, list);
    return true;
  }
  list.push(now);
  hits.set(userId, list);
  return false;
}

const RULES = `You are "Krishi Sahayak", a friendly assistant inside an organic farming app used by farmers in India (mostly Maharashtra).

Rules:
- Reply in the same language the farmer writes in. If they write Marathi in English letters (for example "tomato var whitefly cha upay"), reply in Marathi using Devanagari script. Keep answers short, simple and practical (about 5 to 8 lines).
- Use plain text only. Do not use markdown headings or ** bold. Simple lines starting with "-" are fine.
- Recommend ONLY organic methods: neem oil, neem seed kernel extract (NSKE), Bt, NPV, Trichoderma, Pseudomonas, Beauveria, pheromone and sticky traps, crop rotation, well-rotted FYM, jeevamrut and similar. Never recommend synthetic pesticides or herbicides (chlorpyrifos, monocrotophos, imidacloprid, cypermethrin, glyphosate, paraquat, mancozeb and similar). If the farmer asks about them, say they are not allowed in organic farming and suggest an organic alternative.
- When you give a dose, say it is a typical value and that the farmer should follow the product label and confirm with the certifier or the local Krishi Vigyan Kendra (KVK). Give doses per litre of water, and mention that about 200 litres of water per acre is typical for one spray.
- Do not claim to diagnose with certainty. Ask for the crop stage and symptoms when needed. For serious problems suggest the KVK or an agriculture officer.
- You do not have live weather or market prices. For weather, tell the farmer to use the Weather section of the app.
- Use the farmer's data below when it helps (crop names, acres, tasks). Do not invent data.`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "not_configured" }, { status: 503 });

  // Only signed-in users can use the assistant
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data || !data.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (tooMany(data.user.id)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const context = typeof body.context === "string" ? body.context.slice(0, 3000) : "";
  const language = body.lang === "mr" ? "Marathi" : "English";

  const system = `${RULES}\n\nApp language: ${language}\n\nFarmer's data:\n${context || "(no farms added yet)"}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages }),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("Anthropic API error", r.status, txt.slice(0, 400));
      return Response.json({ error: "upstream", status: r.status }, { status: 502 });
    }

    const j = await r.json();
    const reply = (j.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "..." });
  } catch (e) {
    console.error("Chat route failed", e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
