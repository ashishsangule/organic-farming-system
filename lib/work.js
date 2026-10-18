// Shared list of work types used by Daily Work and My Tasks
export const ACTS = [
  ["Watering", "💧"],
  ["Sowing", "🌱"],
  ["Weeding", "🌿"],
  ["Fertilizer", "🧪"],
  ["Spraying", "🐛"],
  ["Pruning", "✂️"],
  ["Ploughing", "🚜"],
  ["Harvesting", "🌾"],
  ["Other", "📝"],
];

// Known work types are shown with an icon and translated; other text is shown as typed.
export function workLabel(name, t) {
  const f = ACTS.find((x) => x[0] === name);
  return f ? f[1] + " " + t("a_" + name) : name;
}
