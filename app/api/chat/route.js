import { createClient } from "@supabase/supabase-js";

// Allow up to 60 seconds for the AI to answer
export const maxDuration = 60;

// Set GEMINI_API_KEY (Google AI Studio) OR ANTHROPIC_API_KEY in Vercel
// (Project > Settings > Environment Variables). If both are set, Gemini is used.
// Optional: GEMINI_MODEL to pick a Gemini model, CHAT_MODEL to pick a Claude model.
const MODEL = process.env.CHAT_MODEL || "claude-haiku-5-5";

// If GEMINI_MODEL is not set, the newest model is tried first. If a model does not exist (404),
// is busy (429, 5xx) or is slow, the next model is tried too and the first good answer wins.
const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
let geminiWorking = null;

const HEDGE_MS = 2500; // if a model has not started answering by then, also try the next one
const RETRYABLE = [404, 429, 500, 502, 503, 504];

function geminiBody(model, system, contents, maxTokens, quick) {
  const generationConfig = { maxOutputTokens: maxTokens };
  if (quick) {
    // keep "thinking" short so the answer starts fast
    generationConfig.thinkingConfig = model.startsWith("gemini-2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "low" };
  }
  return JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig });
}

// Starts the models one after another (and a little overlapped when one is slow).
// Resolves with the first successful streaming response, or with an error.
function openGemini(key, system, messages, maxTokens) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const order = geminiWorking
    ? [geminiWorking, ...GEMINI_MODELS.filter((m) => m !== geminiWorking)]
    : GEMINI_MODELS;

  return new Promise((resolve) => {
    let next = 0;
    let pending = 0;
    let done = false;
    let lastStatus = 502;
    let lastDetail = "";
    const ctrls = [];
    const timers = [];

    const stopAll = (except) => {
      timers.forEach(clearTimeout);
      ctrls.forEach((c) => c !== except && c.abort());
    };
    const finish = (value, except) => {
      if (done) return;
      done = true;
      stopAll(except);
      resolve(value);
    };

    const deadline = setTimeout(() => {
      lastStatus = 504;
      lastDetail = "The AI took too long to answer.";
      finish({ error: lastStatus, detail: lastDetail });
    }, 25000);
    timers.push(deadline);

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
      const hedge = setTimeout(launch, HEDGE_MS);
      timers.push(hedge);

      const request = (quick) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: geminiBody(model, system, contents, maxTokens, quick),
          signal: ctrl.signal,
        });

      const failed = (status, detail) => {
        clearTimeout(hedge);
        pending--;
        lastStatus = status;
        lastDetail = detail;
        launch();
      };

      request(true)
        .then((r) => (r.status === 400 ? request(false) : r)) // this model may not accept the thinking setting
        .then(async (r) => {
          if (done) return;
          if (r.ok) {
            geminiWorking = model;
            finish({ res: r, model }, ctrl);
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
          failed(504, "Could not reach the AI service.");
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
      const out = await openGemini(geminiKey, system, messages, voice ? 1024 : 2048);
      if (out.error) {
        return Response.json({ error: "upstream", status: out.error, detail: out.detail || "" }, { status: 502 });
      }

      const stream = textStream(out.res, empty);
      if (body.stream === true) {
        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, no-transform" },
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
