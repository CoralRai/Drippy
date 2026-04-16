import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Color harmony scoring (server-side)
const NEUTRALS = new Set(["black", "white", "gray", "navy", "beige", "cream", "khaki", "brown", "nude", "silver"]);
const HARMONY_PAIRS: Record<string, string[]> = {
  navy: ["white", "cream", "brown", "beige", "khaki", "gold", "red"],
  black: ["white", "red", "gold", "silver", "pink", "cream"],
  white: ["navy", "black", "blue", "brown", "olive", "indigo", "red"],
  brown: ["white", "cream", "beige", "navy", "olive", "khaki", "gold"],
  blue: ["white", "cream", "brown", "beige", "navy", "khaki"],
  olive: ["white", "cream", "brown", "beige", "black", "khaki"],
  red: ["black", "white", "navy", "gray"],
  pink: ["white", "gray", "navy", "cream", "black"],
  cream: ["navy", "brown", "olive", "blue", "black"],
};

function colorPairScore(a: string, b: string): number {
  if (a === b) return 60;
  if (NEUTRALS.has(a) && NEUTRALS.has(b)) return 85;
  if (NEUTRALS.has(a) || NEUTRALS.has(b)) return 80;
  if (HARMONY_PAIRS[a]?.includes(b) || HARMONY_PAIRS[b]?.includes(a)) return 95;
  return 50;
}

function getColorHarmony(colors: (string | null)[]): number {
  const valid = colors.filter((c): c is string => !!c).map((c) => c.toLowerCase());
  if (valid.length < 2) return 70;
  let total = 0, count = 0;
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      total += colorPairScore(valid[i], valid[j]);
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 50;
}

function getWeatherScore(weather: string, itemNames: string[]): number {
  const combined = itemNames.join(" ").toLowerCase();
  const lightKeywords = ["linen", "crop", "sandal", "tee", "polo"];
  const heavyKeywords = ["puffer", "coat", "turtleneck", "boot", "hoodie", "leather jacket", "blazer"];
  const hasLight = lightKeywords.some((k) => combined.includes(k));
  const hasHeavy = heavyKeywords.some((k) => combined.includes(k));

  switch (weather) {
    case "hot": return hasLight && !hasHeavy ? 15 : hasHeavy ? 0 : 8;
    case "warm": return hasLight ? 12 : 8;
    case "cool": return hasHeavy ? 12 : 6;
    case "cold": return hasHeavy && !hasLight ? 15 : hasLight && !hasHeavy ? 0 : 8;
    default: return 8;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { occasion, user_id, weather_suggestion, include_wardrobe } = await req.json();
    if (!occasion || !user_id) {
      return new Response(JSON.stringify({ error: "occasion and user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data in parallel
    const [quizResult, itemsResult, compatResult, interactionsResult, redditResult, wardrobeResult] = await Promise.all([
      supabase.from("style_quizzes").select("*").eq("user_id", user_id).maybeSingle(),
      supabase.from("clothing_items").select("*"),
      supabase.from("item_compatibility").select("*"),
      supabase.from("user_interactions").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("reddit_fashion_data").select("*").gte("expires_at", new Date().toISOString()).limit(50),
      include_wardrobe ? supabase.from("user_wardrobe").select("*").eq("user_id", user_id) : Promise.resolve({ data: [] }),
    ]);

    const quiz = quizResult.data;
    const items = itemsResult.data || [];
    const compatEdges = compatResult.data || [];
    const interactions = interactionsResult.data || [];
    const redditData = redditResult.data || [];
    const wardrobeItems = wardrobeResult.data || [];
    const weatherHint = weather_suggestion || "warm";

    // Build compatibility lookup
    const compatMap = new Map<string, number>();
    for (const edge of compatEdges) {
      compatMap.set(`${edge.item_a_id}-${edge.item_b_id}`, edge.compatibility_score);
      compatMap.set(`${edge.item_b_id}-${edge.item_a_id}`, edge.compatibility_score);
    }

    // Build personalization weights from behavior
    const styleBoosts = new Map<string, number>();
    const itemBoosts = new Map<string, number>();
    const categoryPrefs = new Map<string, number>();
    const colorPrefs = new Map<string, number>();
    
    for (const interaction of interactions) {
      const weight = interaction.interaction_type === "like" ? 3 
        : interaction.interaction_type === "save" ? 4
        : interaction.interaction_type === "click" ? 1 
        : interaction.interaction_type === "dislike" ? -5 
        : interaction.interaction_type === "purchase" ? 5 : 0;
      
      for (const tag of (interaction.style_tags || [])) {
        styleBoosts.set(tag, (styleBoosts.get(tag) || 0) + weight);
      }
      if (interaction.clothing_item_id) {
        itemBoosts.set(interaction.clothing_item_id, (itemBoosts.get(interaction.clothing_item_id) || 0) + weight);
      }
      
      // Track category and color preferences from metadata
      const meta = interaction.metadata as any;
      if (meta?.category) {
        categoryPrefs.set(meta.category, (categoryPrefs.get(meta.category) || 0) + weight);
      }
    }

    // Decay older interactions (more recent = higher weight)
    // Already sorted by created_at desc, so first items are most recent
    const recentStyles = new Map<string, number>();
    interactions.slice(0, 30).forEach((interaction, idx) => {
      const recencyMultiplier = 1 - (idx / 30) * 0.5; // 1.0 to 0.5
      const weight = interaction.interaction_type === "like" ? 3 
        : interaction.interaction_type === "save" ? 4
        : interaction.interaction_type === "click" ? 1 : 0;
      for (const tag of (interaction.style_tags || [])) {
        recentStyles.set(tag, (recentStyles.get(tag) || 0) + weight * recencyMultiplier);
      }
    });
    
    // Merge recency-weighted styles into boosts
    for (const [tag, score] of recentStyles) {
      styleBoosts.set(tag, (styleBoosts.get(tag) || 0) + Math.round(score));
    }

    // Reddit boost map
    const redditStyleBoosts = new Map<string, number>();
    for (const rd of redditData) {
      for (const item of (rd.extracted_items || [])) {
        redditStyleBoosts.set(item.toLowerCase(), (redditStyleBoosts.get(item.toLowerCase()) || 0) + (rd.sentiment_score || 0) * 10);
      }
    }

    // Filter by gender
    const genderFilter = quiz?.gender?.toLowerCase() || "unisex";
    const genderItems = items.filter((i: any) => i.gender === "unisex" || i.gender === genderFilter);

    // Categorize
    const tops = genderItems.filter((i: any) => i.category === "top");
    const bottoms = genderItems.filter((i: any) => i.category === "bottom");
    const footwearItems = genderItems.filter((i: any) => i.category === "footwear");
    const outerwearItems = genderItems.filter((i: any) => i.category === "outerwear");
    const accessories = genderItems.filter((i: any) => i.category === "accessory");

    // Score single item
    function scoreItem(item: any): { score: number; breakdown: any } {
      let bodyType = 0, occ = 0, style = 0, color = 0, fit = 0, pers = 0, reddit = 0;

      if (quiz) {
        const bodyKey = (quiz.body_type || "").toLowerCase().split(" ")[0];
        if ((item.body_types || []).some((bt: string) => bt.toLowerCase().includes(bodyKey))) bodyType = 20;
        if ((item.occasions || []).includes(occasion)) occ = 25;
        const matchStyles = (item.style_tags || []).filter((t: string) =>
          (quiz.style_preferences || []).some((p: string) => p.toLowerCase() === t.toLowerCase())
        );
        style = Math.min(matchStyles.length * 7, 20);
        const matchColors = (item.color_palette || []).filter((c: string) =>
          (quiz.color_palette || []).some((pc: string) => pc.toLowerCase() === c.toLowerCase())
        );
        color = Math.min(matchColors.length * 5, 15);
        if (item.fit_type && quiz.preferred_fit) {
          const fitKey = quiz.preferred_fit.toLowerCase().split(" ")[0];
          if (item.fit_type.toLowerCase().includes(fitKey)) fit = 10;
          else if ((fitKey === "oversized" && item.fit_type === "relaxed") || (fitKey === "slim" && item.fit_type === "regular")) fit = 5;
        }
      }

      for (const tag of (item.style_tags || [])) pers += styleBoosts.get(tag) || 0;
      pers += itemBoosts.get(item.id) || 0;
      pers = Math.max(0, Math.min(pers, 10));

      for (const tag of (item.style_tags || [])) reddit += redditStyleBoosts.get(tag.toLowerCase()) || 0;
      reddit = Math.max(0, Math.min(Math.round(reddit), 5));

      return {
        score: bodyType + occ + style + color + fit + pers + reddit,
        breakdown: { body_type: bodyType, occasion: occ, style_preference: style, color_match: color, fit_match: fit, personalization: pers, reddit_boost: reddit },
      };
    }

    // Score and sort all items
    const scoredTops = tops.map((t: any) => ({ item: t, ...scoreItem(t) })).sort((a: any, b: any) => b.score - a.score);
    const scoredBottoms = bottoms.map((b: any) => ({ item: b, ...scoreItem(b) })).sort((a: any, b: any) => b.score - a.score);
    const scoredFootwear = footwearItems.map((f: any) => ({ item: f, ...scoreItem(f) })).sort((a: any, b: any) => b.score - a.score);
    const scoredOuterwear = outerwearItems.map((o: any) => ({ item: o, ...scoreItem(o) })).sort((a: any, b: any) => b.score - a.score);
    const scoredAccessories = accessories.map((a: any) => ({ item: a, ...scoreItem(a) })).sort((a: any, b: any) => b.score - a.score);

    // Generate outfit combinations
    const generatedOutfits: any[] = [];
    const topCands = scoredTops.slice(0, 6);
    const bottomCands = scoredBottoms.slice(0, 6);
    const footwearCands = scoredFootwear.slice(0, 4);

    for (const top of topCands) {
      for (const bottom of bottomCands) {
        const topBottomCompat = compatMap.get(`${top.item.id}-${bottom.item.id}`) || 50;

        for (const shoe of footwearCands) {
          const topShoeCompat = compatMap.get(`${top.item.id}-${shoe.item.id}`) || 50;
          const bottomShoeCompat = compatMap.get(`${bottom.item.id}-${shoe.item.id}`) || 50;
          const avgCompat = (topBottomCompat + topShoeCompat + bottomShoeCompat) / 3;

          // Color harmony score
          const outfitColors = [top.item.primary_color, bottom.item.primary_color, shoe.item.primary_color];
          const colorHarmony = getColorHarmony(outfitColors);

          // Weather score
          const weatherScore = getWeatherScore(weatherHint, [top.item.name, bottom.item.name, shoe.item.name]);

          const itemScoreAvg = (top.score + bottom.score + shoe.score) / 3;
          // Weighted: 40% item scores, 25% compatibility, 20% color harmony, 15% weather
          const totalScore = Math.round(
            itemScoreAvg * 0.40 + avgCompat * 0.25 + colorHarmony * 0.20 + weatherScore * 0.15 * 6.67
          );

          const needsOuterwear = ["winter", "formal", "office", "interview", "wedding"].includes(occasion) || weatherHint === "cold" || weatherHint === "cool";
          const outerwear = needsOuterwear ? scoredOuterwear[0]?.item || null : null;
          const accessory = scoredAccessories[0]?.item || null;

          generatedOutfits.push({
            top: top.item,
            bottom: bottom.item,
            footwear: shoe.item,
            outerwear,
            accessory,
            total_score: Math.min(totalScore, 100),
            compatibility_avg: Math.round(avgCompat),
            color_harmony: colorHarmony,
            weather_score: weatherScore,
            score_breakdown: {
              top_score: top.breakdown,
              bottom_score: bottom.breakdown,
              footwear_score: shoe.breakdown,
              compatibility: Math.round(avgCompat),
              color_harmony: colorHarmony,
              weather_fit: weatherScore,
            },
          });
        }
      }
    }

    // Sort and deduplicate by taking unique top+bottom combos
    generatedOutfits.sort((a, b) => b.total_score - a.total_score);
    const seen = new Set<string>();
    const uniqueOutfits = generatedOutfits.filter((o) => {
      const key = `${o.top.id}-${o.bottom.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const topOutfits = uniqueOutfits.slice(0, 9);

    // AI styling tips
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && topOutfits.length > 0) {
      try {
        const descriptions = topOutfits.map((o: any, i: number) =>
          `Outfit ${i + 1}: ${o.top.name} + ${o.bottom.name} + ${o.footwear.name}${o.outerwear ? ` + ${o.outerwear.name}` : ""}${o.accessory ? ` + ${o.accessory.name}` : ""} (occasion: ${occasion}, weather: ${weatherHint})`
        ).join("\n");

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a fashion stylist. For each outfit, provide a one-sentence styling tip. Return ONLY a JSON array of strings, one tip per outfit. No markdown." },
              { role: "user", content: `Generate styling tips:\n${descriptions}` },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const text = aiData.choices?.[0]?.message?.content || "";
          try {
            const tips = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
            topOutfits.forEach((o: any, i: number) => { if (tips[i]) o.styling_tip = tips[i]; });
          } catch {
            const lines = text.split("\n").filter((l: string) => l.trim());
            topOutfits.forEach((o: any, i: number) => { if (lines[i]) o.styling_tip = lines[i].replace(/^\d+[\.\)]\s*/, ""); });
          }
        }
      } catch (e) { console.error("AI tips error:", e); }
    }

    // Cache results
    const toStore = topOutfits.map((o: any) => ({
      user_id, occasion,
      top_item_id: o.top.id, bottom_item_id: o.bottom.id, footwear_item_id: o.footwear.id,
      outerwear_item_id: o.outerwear?.id || null, accessory_item_id: o.accessory?.id || null,
      total_score: o.total_score, score_breakdown: o.score_breakdown, styling_tip: o.styling_tip || null,
    }));

    await supabase.from("generated_outfits").delete().eq("user_id", user_id).eq("occasion", occasion);
    if (toStore.length > 0) await supabase.from("generated_outfits").insert(toStore);

    return new Response(JSON.stringify({
      outfits: topOutfits.map((o: any) => ({
        top: o.top, bottom: o.bottom, footwear: o.footwear, outerwear: o.outerwear, accessory: o.accessory,
        total_score: o.total_score, compatibility_avg: o.compatibility_avg, color_harmony: o.color_harmony,
        weather_score: o.weather_score, score_breakdown: o.score_breakdown, styling_tip: o.styling_tip,
      })),
      quiz_data: quiz,
      wardrobe_count: wardrobeItems.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-outfits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
