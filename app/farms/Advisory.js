"use client";

// Typical water used per acre for one knapsack spray (adjust for small plants).
const WATER_PER_ACRE = 200;

// perL = dose per litre of water, acre = dose per acre.
const P = {
  neem: { n: "Neem oil", s: "safe", dose: "3-5 ml per litre of water (check the strength on the label)", perL: [3, 5, "ml"] },
  nske: { n: "Neem seed kernel extract (NSKE 5%)", s: "safe", dose: "50 g crushed kernel per litre of water, soak overnight and filter", perL: [50, 50, "g"] },
  bt: { n: "Bt (Bacillus thuringiensis)", s: "safe", dose: "1-2 g or ml per litre of water, spray in the evening", perL: [1, 2, "g"] },
  npv: { n: "NPV (virus for caterpillars)", s: "safe", dose: "About 1 ml per litre of water, spray in the evening (follow label)", perL: [1, 1, "ml"] },
  tricho: { n: "Trichoderma", s: "safe", dose: "Seed: 4-10 g per kg seed. Soil: 1 kg mixed with 50 kg well-rotted FYM per acre", acre: [1, 1, "kg"] },
  pseudo: { n: "Pseudomonas fluorescens", s: "safe", dose: "Seed: 10 g per kg seed. Spray: 2-5 g per litre of water", perL: [2, 5, "g"] },
  beau: { n: "Beauveria bassiana", s: "safe", dose: "About 5 g per litre of water", perL: [5, 5, "g"] },
  tg: { n: "Trichogramma egg cards", s: "safe", dose: "About 1 card per acre per release, 4-6 weekly releases (follow supplier label)", acre: [1, 1, "cards"] },
  phero: { n: "Pheromone traps", s: "safe", dose: "4-5 traps per acre", acre: [4, 5, "traps"] },
  yellow: { n: "Yellow sticky traps", s: "safe", dose: "8-10 traps per acre", acre: [8, 10, "traps"] },
  blue: { n: "Blue sticky traps", s: "safe", dose: "8-10 traps per acre", acre: [8, 10, "traps"] },
  sulphur: { n: "Wettable sulphur", s: "limited", dose: "2-3 g per litre of water, not in hot afternoon hours. Needs certifier approval", perL: [2, 3, "g"] },
  bordeaux: { n: "Bordeaux mixture (copper)", s: "limited", dose: "1% = 10 g copper sulphate + 10 g lime per litre of water. Needs certifier approval", perL: [10, 10, "g"] },
};

// [pest, [product ids], optional tip]
const CROPS = [
  { n: "Tomato (टोमॅटो)", k: ["tomato", "टोमॅटो"], pests: [
    ["Fruit borer", ["bt", "npv", "phero", "nske"]],
    ["Whitefly", ["yellow", "neem"]],
    ["Early / late blight", ["pseudo", "tricho", "bordeaux"], "Remove infected leaves and avoid wetting the leaves."],
  ] },
  { n: "Onion (कांदा)", k: ["onion", "कांदा"], pests: [
    ["Thrips", ["blue", "neem"]],
    ["Purple blotch", ["pseudo", "tricho"], "Keep wider spacing and avoid overhead watering."],
  ] },
  { n: "Brinjal (वांगी)", k: ["brinjal", "eggplant", "वांगी"], pests: [
    ["Shoot and fruit borer", ["phero", "bt", "nske"], "Cut and destroy affected shoots."],
    ["Jassids", ["neem", "yellow"]],
    ["Bacterial wilt", ["tricho"], "Rotate crops and do not plant after tomato or chilli."],
  ] },
  { n: "Chilli (मिरची)", k: ["chilli", "chili", "मिरची"], pests: [
    ["Thrips and mites", ["neem", "nske"]],
    ["Fruit rot (anthracnose)", ["pseudo", "tricho"]],
    ["Leaf curl (spread by whitefly)", ["yellow", "neem"], "Grow a border crop of maize or sorghum."],
  ] },
  { n: "Okra (भेंडी)", k: ["okra", "bhendi", "ladyfinger", "भेंडी"], pests: [
    ["Jassids and whitefly", ["neem", "yellow"]],
    ["Fruit borer", ["phero", "bt"]],
    ["Yellow vein mosaic", ["yellow"], "Pull out and destroy infected plants early."],
  ] },
  { n: "Cotton (कापूस)", k: ["cotton", "कापूस"], pests: [
    ["Pink bollworm", ["phero", "tg", "nske"]],
    ["Aphids, jassids and whitefly", ["neem", "beau"], "Protect ladybirds and other friendly insects."],
  ] },
  { n: "Soybean (सोयाबीन)", k: ["soybean", "soyabean", "सोयाबीन"], pests: [
    ["Leaf-eating caterpillars", ["npv", "bt", "nske"]],
    ["Yellow mosaic (spread by whitefly)", ["yellow", "neem"], "Use resistant varieties."],
  ] },
  { n: "Wheat (गहू)", k: ["wheat", "गहू"], pests: [
    ["Aphids", ["neem"], "Protect ladybirds."],
    ["Rust", [], "Use resistant varieties and sow on time. Avoid heavy nitrogen."],
    ["Termites", ["nske"], "Apply well-rotted FYM and neem cake in the soil."],
  ] },
  { n: "Maize (मका)", k: ["maize", "corn", "मका"], pests: [
    ["Fall armyworm", ["nske", "bt", "neem"], "Spray into the whorl early, in the morning or evening."],
    ["Stem borer", ["tg"]],
  ] },
  { n: "Rice (भात / तांदूळ)", k: ["rice", "paddy", "भात", "तांदूळ"], pests: [
    ["Stem borer", ["phero", "tg"]],
    ["Leaf folder", ["neem", "nske"]],
    ["Blast", ["pseudo"], "Use resistant varieties and avoid excess nitrogen."],
  ] },
  { n: "Pomegranate (डाळिंब)", k: ["pomegranate", "डाळिंब"], pests: [
    ["Fruit borer", ["bt", "neem"], "Bag the fruits."],
    ["Thrips", ["neem", "blue"]],
    ["Bacterial blight", ["bordeaux"], "Use clean planting material and prune infected twigs."],
  ] },
  { n: "Grapes (द्राक्ष)", k: ["grape", "द्राक्ष"], pests: [
    ["Downy mildew", ["pseudo", "bordeaux"]],
    ["Powdery mildew", ["sulphur"]],
    ["Thrips and mealybug", ["neem", "beau"]],
  ] },
  { n: "Sugarcane (ऊस)", k: ["sugarcane", "sugar cane", "ऊस"], pests: [
    ["Early shoot borer", ["tg", "phero"]],
    ["Woolly aphid", ["neem"], "Protect natural enemies like Dipha and Micromus."],
  ] },
];

const AVOID = [
  "Chlorpyrifos",
  "Monocrotophos",
  "Endosulfan (banned)",
  "Imidacloprid and other neonicotinoids",
  "Cypermethrin and other synthetic pyrethroids",
  "Carbofuran",
  "Glyphosate",
  "Paraquat",
  "Mancozeb and other synthetic fungicides",
];

function fmt(n, unit) {
  if (unit === "ml" && n >= 1000) return `${+(n / 1000).toFixed(1)} L`;
  if (unit === "g" && n >= 1000) return `${+(n / 1000).toFixed(1)} kg`;
  return `${+n.toFixed(1)} ${unit}`;
}

function range(lo, hi, unit, mult) {
  return lo === hi ? fmt(lo * mult, unit) : `${fmt(lo * mult, unit)} to ${fmt(hi * mult, unit)}`;
}

function quantity(p, acres, t) {
  if (!acres) return null;
  if (p.perL) {
    const water = acres * WATER_PER_ACRE;
    return `${t("forAcres").replace("{a}", acres)} (${t("water").replace("{w}", water)}): ${range(p.perL[0], p.perL[1], p.perL[2], water)}`;
  }
  if (p.acre) {
    return `${t("forAcres").replace("{a}", acres)}: ${range(p.acre[0], p.acre[1], p.acre[2], acres)}`;
  }
  return null;
}

const pill = {
  safe: { background: "#e5f7eb", color: "#176b3a", label: "Safe for organic" },
  limited: { background: "#fbeccb", color: "#8a5a00", label: "Ask certifier first" },
};

export default function Advisory({ crop, acres, t = (k) => k }) {
  const text = (crop || "").toLowerCase();
  const matched = CROPS.filter((c) => c.k.some((k) => text.includes(k)));

  return (
    <div
      style={{
        marginTop: "14px",
        background: "#f4f8f5",
        border: "1px solid #d5ddd8",
        borderRadius: "10px",
        padding: "14px",
        fontSize: "14px",
      }}
    >
      {matched.length === 0 && (
        <p style={{ margin: "0 0 10px" }}>{t("noAdvisory")}</p>
      )}

      {matched.map((c) => (
        <div key={c.n} style={{ marginBottom: "14px" }}>
          <h4 style={{ margin: "0 0 8px", color: "#164c36", fontSize: "16px" }}>
            {c.n}
          </h4>

          {c.pests.map(([pest, ids, tip]) => (
            <div key={pest} style={{ marginBottom: "10px" }}>
              <strong>{t("problem")}: {pest}</strong>

              {tip && <div style={{ color: "#555", margin: "2px 0" }}>{t("tip")}: {tip}</div>}

              {ids.map((id) => {
                const p = P[id];
                const qty = quantity(p, acres, t);
                return (
                  <div
                    key={id}
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      margin: "6px 0",
                    }}
                  >
                    <span style={{ fontWeight: "600" }}>{p.n}</span>{" "}
                    <span
                      style={{
                        background: pill[p.s].background,
                        color: pill[p.s].color,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {t(p.s === "safe" ? "safe" : "ask")}
                    </span>
                    <div>{t("dose")}: {p.dose}</div>
                    {qty && <div style={{ color: "#164c36" }}>{qty}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <div
        style={{
          background: "#f9e0dd",
          color: "#8c1d18",
          borderRadius: "8px",
          padding: "8px 10px",
          marginBottom: "10px",
        }}
      >
        <strong>{t("avoidTitle")}</strong>{" "}
        {AVOID.join(", ")}.
      </div>

      <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
        {t("disclaimer").replace("{w}", WATER_PER_ACRE)}
      </p>
    </div>
  );
}

export function CropPicker({ picked, setPicked, other, setOther, t }) {
  const toggle = (n) =>
    setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);

  return (
    <div>
      <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px", fontWeight: "600" }}>
        {t("pickCrops")}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {CROPS.map((c) => {
          const on = picked.includes(c.n);
          return (
            <button
              type="button"
              key={c.n}
              onClick={() => toggle(c.n)}
              style={{
                padding: "9px 14px",
                borderRadius: "999px",
                border: "1px solid #176b3a",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                background: on ? "#176b3a" : "white",
                color: on ? "white" : "#176b3a",
              }}
            >
              {on ? "✓ " : ""}
              {c.n}
            </button>
          );
        })}
      </div>

      <input
        value={other}
        onChange={(e) => setOther(e.target.value)}
        placeholder={t("otherCrop")}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: "10px",
          padding: "12px",
          border: "1px solid #d5ddd8",
          borderRadius: "8px",
          fontSize: "15px",
        }}
      />
    </div>
  );
}
