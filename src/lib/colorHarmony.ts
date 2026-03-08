// Color harmony engine for outfit scoring
// Uses color theory principles: complementary, analogous, triadic, neutral combinations

interface ColorInfo {
  name: string;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
}

const COLOR_MAP: Record<string, ColorInfo> = {
  black: { name: "black", hex: "#1A1A1A", hue: 0, saturation: 0, lightness: 10 },
  white: { name: "white", hex: "#FFFFFF", hue: 0, saturation: 0, lightness: 100 },
  navy: { name: "navy", hex: "#001F3F", hue: 210, saturation: 100, lightness: 12 },
  gray: { name: "gray", hex: "#808080", hue: 0, saturation: 0, lightness: 50 },
  brown: { name: "brown", hex: "#8B4513", hue: 25, saturation: 76, lightness: 31 },
  beige: { name: "beige", hex: "#D2B48C", hue: 34, saturation: 44, lightness: 69 },
  cream: { name: "cream", hex: "#FFFDD0", hue: 57, saturation: 100, lightness: 91 },
  khaki: { name: "khaki", hex: "#C3B091", hue: 37, saturation: 33, lightness: 67 },
  red: { name: "red", hex: "#DC143C", hue: 348, saturation: 83, lightness: 47 },
  blue: { name: "blue", hex: "#4A90D9", hue: 212, saturation: 64, lightness: 57 },
  green: { name: "green", hex: "#228B22", hue: 120, saturation: 61, lightness: 34 },
  pink: { name: "pink", hex: "#FFB6C1", hue: 351, saturation: 100, lightness: 86 },
  blush: { name: "blush", hex: "#DE5D83", hue: 345, saturation: 65, lightness: 62 },
  yellow: { name: "yellow", hex: "#FFD700", hue: 51, saturation: 100, lightness: 50 },
  olive: { name: "olive", hex: "#808000", hue: 60, saturation: 100, lightness: 25 },
  indigo: { name: "indigo", hex: "#2B2D42", hue: 235, saturation: 21, lightness: 21 },
  silver: { name: "silver", hex: "#C0C0C0", hue: 0, saturation: 0, lightness: 75 },
  gold: { name: "gold", hex: "#FFD700", hue: 51, saturation: 100, lightness: 50 },
  nude: { name: "nude", hex: "#E3BC9A", hue: 29, saturation: 55, lightness: 75 },
};

// Neutrals pair well with everything
const NEUTRALS = new Set(["black", "white", "gray", "navy", "beige", "cream", "khaki", "brown", "nude", "silver"]);

// Pre-defined high-harmony pairs
const HARMONY_PAIRS: Record<string, string[]> = {
  navy: ["white", "cream", "brown", "beige", "khaki", "gold", "red"],
  black: ["white", "red", "gold", "silver", "pink", "cream"],
  white: ["navy", "black", "blue", "brown", "olive", "indigo", "red"],
  brown: ["white", "cream", "beige", "navy", "olive", "khaki", "gold"],
  blue: ["white", "cream", "brown", "beige", "navy", "khaki"],
  olive: ["white", "cream", "brown", "beige", "black", "khaki"],
  indigo: ["white", "cream", "brown", "beige"],
  red: ["black", "white", "navy", "gray"],
  pink: ["white", "gray", "navy", "cream", "black"],
  cream: ["navy", "brown", "olive", "blue", "black"],
};

export function getColorHarmonyScore(colors: (string | null | undefined)[]): number {
  const validColors = colors.filter((c): c is string => !!c).map((c) => c.toLowerCase());

  if (validColors.length < 2) return 70; // Single item, neutral score

  let totalScore = 0;
  let comparisons = 0;

  for (let i = 0; i < validColors.length; i++) {
    for (let j = i + 1; j < validColors.length; j++) {
      totalScore += pairScore(validColors[i], validColors[j]);
      comparisons++;
    }
  }

  return comparisons > 0 ? Math.round(totalScore / comparisons) : 50;
}

function pairScore(a: string, b: string): number {
  // Same color family
  if (a === b) return 60; // Monochrome — decent but not exciting

  // Both neutrals
  if (NEUTRALS.has(a) && NEUTRALS.has(b)) return 85;

  // One neutral + one color = always safe
  if (NEUTRALS.has(a) || NEUTRALS.has(b)) return 80;

  // Check curated harmony pairs
  if (HARMONY_PAIRS[a]?.includes(b) || HARMONY_PAIRS[b]?.includes(a)) return 95;

  // Fall back to hue-based scoring
  const infoA = COLOR_MAP[a];
  const infoB = COLOR_MAP[b];

  if (!infoA || !infoB) return 50;

  const hueDiff = Math.abs(infoA.hue - infoB.hue);
  const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);

  // Complementary (150-180°) → good contrast
  if (normalizedDiff >= 150 && normalizedDiff <= 180) return 75;

  // Analogous (0-30°) → harmonious
  if (normalizedDiff <= 30) return 80;

  // Triadic (110-130°) → vibrant
  if (normalizedDiff >= 110 && normalizedDiff <= 130) return 70;

  // Clash zone (30-110°) → potentially clashing
  return 40;
}

export function getWeatherFabricScore(
  weatherSuggestion: "hot" | "warm" | "cool" | "cold",
  itemNames: string[]
): number {
  const combined = itemNames.join(" ").toLowerCase();

  const lightweightKeywords = ["linen", "crop", "sandal", "tee", "polo", "sneaker"];
  const heavyKeywords = ["puffer", "coat", "turtleneck", "boot", "hoodie", "leather jacket", "blazer"];

  const hasLight = lightweightKeywords.some((k) => combined.includes(k));
  const hasHeavy = heavyKeywords.some((k) => combined.includes(k));

  switch (weatherSuggestion) {
    case "hot":
      if (hasLight && !hasHeavy) return 20;
      if (hasHeavy) return 0;
      return 10;
    case "warm":
      if (hasLight) return 15;
      return 10;
    case "cool":
      if (hasHeavy) return 15;
      return 8;
    case "cold":
      if (hasHeavy && !hasLight) return 20;
      if (hasLight && !hasHeavy) return 0;
      return 10;
    default:
      return 10;
  }
}
