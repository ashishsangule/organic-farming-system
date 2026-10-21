import { createClient } from "@supabase/supabase-js";

// Allow up to 60 seconds for the AI to answer
export const maxDuration = 60;

// Set GEMINI_API_KEY (Google AI Studio) OR ANTHROPIC_API_KEY in Vercel
// (Project > Settings > Environment Variables). If both are set, Gemini is used.
// Optional: GEMINI_MODEL to pick a Gemini model, CHAT_MODEL to pick a Claude model.
const MODEL = process.env.CHAT_MODEL || "claude-haiku-5-5";

// Used only if the list of available models cannot be fetched
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.8-flash"];

let modelCache = null;
let modelCacheAt = 0;

// Asks Google which Gemini models this key can use and puts the fastest first
// (flash-lite models answer quickest, then normal flash models, newest versions first).
async function discoverModels(key) {
  if (process.env.GEMINI_MODEL) return [process.env.GEMINI_MODEL];
  if (modelCache && Date.now() - modelCacheAt < 6 * 3600 * 1000) return modelCache;

  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const j = await r.json();
      const names = (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => String(m.name).replace("models/", ""))
        .filter((n) => /^gemini-[\d.]+-flash(-lite)?$/.test(n)); // plain text models, no preview/image/voice ones
      const ver = (n) => parseFloat(n.match(/^gemini-([\d.]+)/)[1]);
      const lite = names.filter((n) => n.endsWith("-lite")).sort((x, y) => ver(y) - ver(x));
      const flash = names.filter((n) => !n.endsWith("-lite")).sort((x, y) => ver(y) - ver(x));
      const list = [...lite.slice(0, 1), ...flash.slice(0, 1), ...lite.slice(1, 2), ...flash.slice(1, 3)];
      if (list.length) {
        modelCache = list;
        modelCacheAt = Date.now();
        return list;
      }
    }
  } catch (e) {
    console.error("Could not list Gemini models", e && e.name);
  }
  return FALLBACK_MODELS;
}

const HEDGE_MS = 1200; // if a model has not started answering by then, also start the next one
const ATTEMPT_MS = 9000; // give up on one model if it has not started answering by then
const RETRYABLE = [404, 429, 500, 502, 503, 504];

// Different models accept different "keep thinking short" settings. The first one that works is remembered.
const THINK_CFGS = [{ thinkingLevel: "minimal" }, { thinkingLevel: "low" }, { thinkingBudget: 0 }, null];
const thinkChoice = {};
let geminiWorking = null;

function geminiBody(system, contents, maxTokens, think) {
  const generationConfig = { maxOutputTokens: maxTokens };
  if (think) generationConfig.thinkingConfig = think;
  return JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig });
}

// Starts the models one after another (a little overlapped when one is slow).
// Resolves with the first successful streaming response, or with an error.
function openGemini(key, models, system, messages, maxTokens) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const order = geminiWorking && models.includes(geminiWorking)
    ? [geminiWorking, ...models.filter((m) => m !== geminiWorking)]
    : models;
  const started = Date.now();

  return new Promise((resolve) => {
    let next = 0;
    let pending = 0;
    let done = false;
    let lastStatus = 502;
    let lastDetail = "";
    const ctrls = [];
    const timers = [];

    const finish = (value, except) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      ctrls.forEach((c) => c !== except && c.abort());
      resolve(value);
    };

    timers.push(
      setTimeout(() => finish({ error: 504, detail: "The AI took too long to answer." }), 22000)
    );

    const launch = () => {
      if (done) return;
      if (next >= order.length) {
        if (pending === 0) finish({ error: lastStatus, detail: lastDetail });
        return;
      }

      const model = order[next++];
      pending++;
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      timers.push(setTimeout(launch, HEDGE_MS));
      const giveUp = setTimeout(() => ctrl.abort(), ATTEMPT_MS);
      timers.push(giveUp);

      const attempt = async (idx) => {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: geminiBody(system, contents, maxTokens, THINK_CFGS[idx]),
          signal: ctrl.signal,
        });
        if (r.status === 400 && idx < THINK_CFGS.length - 1) {
          const txt = await r.text();
          if (/think/i.test(txt)) return attempt(idx + 1); // this model does not accept that setting
          return new Response(txt, { status: 400 });
        }
        if (r.ok) thinkChoice[model] = idx;
        return r;
      };

      const failed = (status, detail) => {
        clearTimeout(giveUp);
        pending--;
        lastStatus = status;
        lastDetail = detail;
        launch();
      };

      attempt(thinkChoice[model] || 0)
        .then(async (r) => {
          if (done) return;
          if (r.ok) {
            geminiWorking = model;
            finish({ res: r, model, ms: Date.now() - started }, ctrl);
            return;
          }

          const txt = await r.text();
          let detail = txt.slice(0, 200);
          try {
            detail = JSON.parse(txt).error.message || detail;
          } catch (e) {}
          detail = String(detail).slice(0, 200);
          console.error("Gemini API error", r.status, model, detail);

          if (RETRYABLE.includes(r.status)) {
            if (model === geminiWorking) geminiWorking = null;
            failed(r.status, detail);
          } else {
            finish({ error: r.status, detail }); // bad key or bad request: other models will not help
          }
        })
        .catch((e) => {
          if (done) return;
          console.error("Gemini call failed", model, e && e.name);
          failed(504, e && e.name === "AbortError" ? "A model was too slow." : "Could not reach the AI service.");
        });
    };

    launch();
  });
}

// Turns Gemini's event stream into plain text that the browser can show as it arrives
function textStream(res, emptyText) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  let sent = false;

  const extract = (line) => {
    if (!line.startsWith("data:")) return "";
    const raw = line.slice(5).trim();
    if (!raw) return "";
    try {
      const j = JSON.parse(raw);
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      return parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
    } catch (e) {
      return "";
    }
  };

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      let out = "";

      if (done) {
        out = extract(buf.trim());
        if (out) {
          sent = true;
          controller.enqueue(enc.encode(out));
        }
        if (!sent) controller.enqueue(enc.encode(emptyText));
        controller.close();
        return;
      }

      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) out += extract(line.trim());
      if (out) {
        sent = true;
        controller.enqueue(enc.encode(out));
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

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

// Open /api/chat in a browser to see whether a key is set (never shows the key itself)
export async function GET() {
  const provider = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "none";
  return Response.json({ configured: provider !== "none", provider });
}

export async function POST(request) {
  const t0 = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!geminiKey && !apiKey) return Response.json({ error: "not_configured" }, { status: 503 });

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
  const voice = body.voice === true;

  const voiceRule = voice
    ? "\n\nThe farmer is talking by voice and your answer will be read aloud. Answer in 3 to 5 short, natural spoken sentences. No lists, no symbols, no emojis."
    : "";

  const system = `${RULES}${voiceRule}\n\nApp language: ${language}\n\nFarmer's data:\n${context || "(no farms added yet)"}`;

  const empty =
    body.lang === "mr"
      ? "माफ करा, मला यावर उत्तर देता आले नाही. कृपया प्रश्न वेगळ्या शब्दांत विचारा."
      : "Sorry, I could not answer that. Please rephrase your question.";

  if (geminiKey) {
    try {
      const preMs = Date.now() - t0;
      const models = await discoverModels(geminiKey);
      const out = await openGemini(geminiKey, models, system, messages, voice ? 1024 : 2048);
      if (out.error) {
        return Response.json({ error: "upstream", status: out.error, detail: out.detail || "" }, { status: 502 });
      }

      const stream = textStream(out.res, empty);
      if (body.stream === true) {
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, no-transform",
            "X-Model": out.model,
            "X-Pre-Ms": String(preMs),
            "X-Gemini-Ms": String(out.ms),
          },
        });
      }
      return Response.json({ reply: (await new Response(stream).text()) || empty });
    } catch (e) {
      console.error("Chat route failed", e);
      return Response.json({ error: "upstream" }, { status: 502 });
    }
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: voice ? 800 : 1500, system, messages }),
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

    return Response.json({ reply: reply || empty });
  } catch (e) {
    console.error("Chat route failed", e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
