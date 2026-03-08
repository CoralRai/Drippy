import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  gender: string;
  body_types: string[];
  style_tags: string[];
  color_palette: string[];
  fit_type: string | null;
  occasions: string[];
  amazon_link: string | null;
  myntra_link: string | null;
  flipkart_link: string | null;
  image_url: string | null;
}

interface StyleQuiz {
  gender: string;
  body_type: string;
  preferred_fit: string;
  style_preferences: string[];
  color_palette: string[];
  skin_tone: string;
  age_group: string;
  height: string;
  weight: string;
}

interface CompatibilityEdge {
  item_a_id: string;
  item_b_id: string;
  compatibility_score: number;
}

interface UserInteraction {
  interaction_type: string;
  style_tags: string[];
  clothing_item_id: string | null;
}

interface ScoreBreakdown {
  body_type: number;
  occasion: number;
  compatibility: number;
  style_preference: number;
  color_match: number;
  fit_match: number;
  personalization: number;
  reddit_boost: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { occasion, user_id } = await req.json();
    if (!occasion || !user_id) {
      return new Response(JSON.stringify({ error: "occasion and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all needed data in parallel
    const [quizResult, itemsResult, compatResult, interactionsResult, redditResult] = await Promise.all([
      supabase.from("style_quizzes").select("*").eq("user_id", user_id).maybeSingle(),
      supabase.from("clothing_items").select("*"),
      supabase.from("item_compatibility").select("*"),
      supabase.from("user_interactions").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("reddit_fashion_data").select("*").gte("expires_at", new Date().toISOString()).limit(50),
    ]);

    const quiz: StyleQuiz | null = quizResult.data;
    const items: ClothingItem[] = itemsResult.data || [];
    const compatEdges: CompatibilityEdge[] = compatResult.data || [];
    const interactions: UserInteraction[] = interactionsResult.data || [];
    const redditData = redditResult.data || [];

    // Build compatibility lookup
    const compatMap = new Map<string, number>();
    for (const edge of compatEdges) {
      compatMap.set(`${edge.item_a_id}-${edge.item_b_id}`, edge.compatibility_score);
      compatMap.set(`${edge.item_b_id}-${edge.item_a_id}`, edge.compatibility_score);
    }

    // Build personalization weights from interactions
    const styleBoosts = new Map<string, number>();
    const itemBoosts = new Map<string, number>();
    for (const interaction of interactions) {
      const weight = interaction.interaction_type === "like" ? 3 : interaction.interaction_type === "click" ? 1 : interaction.interaction_type === "dislike" ? -5 : interaction.interaction_type === "purchase" ? 5 : 0;
      for (const tag of interaction.style_tags) {
        styleBoosts.set(tag, (styleBoosts.get(tag) || 0) + weight);
      }
      if (interaction.clothing_item_id) {
        itemBoosts.set(interaction.clothing_item_id, (itemBoosts.get(interaction.clothing_item_id) || 0) + weight);
      }
    }

    // Build Reddit style boost map
    const redditStyleBoosts = new Map<string, number>();
    for (const rd of redditData) {
      for (const item of rd.extracted_items) {
        const current = redditStyleBoosts.get(item.toLowerCase()) || 0;
        redditStyleBoosts.set(item.toLowerCase(), current + (rd.sentiment_score || 0) * 10);
      }
    }

    // Filter items by gender
    const genderFilter = quiz?.gender?.toLowerCase() || "unisex";
    const genderItems = items.filter(
      (i) => i.gender === "unisex" || i.gender === genderFilter
    );

    // Categorize items
    const tops = genderItems.filter((i) => i.category === "top");
    const bottoms = genderItems.filter((i) => i.category === "bottom");
    const footwearItems = genderItems.filter((i) => i.category === "footwear");
    const outerwearItems = genderItems.filter((i) => i.category === "outerwear");
    const accessories = genderItems.filter((i) => i.category === "accessory");

    // Score a single item against user profile
    function scoreItem(item: ClothingItem): { score: number; breakdown: Partial<ScoreBreakdown> } {
      let bodyTypeScore = 0;
      let occasionScore = 0;
      let styleScore = 0;
      let colorScore = 0;
      let fitScore = 0;
      let personalizationScore = 0;
      let redditBoost = 0;

      if (quiz) {
        // Body type compatibility (0-20)
        const bodyKey = quiz.body_type.toLowerCase().split(" ")[0];
        if (item.body_types.some((bt) => bt.toLowerCase().includes(bodyKey))) {
          bodyTypeScore = 20;
        }

        // Occasion match (0-25)
        if (item.occasions.includes(occasion)) {
          occasionScore = 25;
        }

        // Style preference match (0-20)
        const matchingStyles = item.style_tags.filter((tag) =>
          quiz.style_preferences.some((pref) => pref.toLowerCase() === tag.toLowerCase())
        );
        styleScore = Math.min(matchingStyles.length * 7, 20);

        // Color match (0-15)
        const matchingColors = item.color_palette.filter((c) =>
          quiz.color_palette.some((pc) => pc.toLowerCase() === c.toLowerCase())
        );
        colorScore = Math.min(matchingColors.length * 5, 15);

        // Fit match (0-10)
        if (item.fit_type && quiz.preferred_fit) {
          const fitKey = quiz.preferred_fit.toLowerCase().split(" ")[0];
          if (item.fit_type.toLowerCase().includes(fitKey)) {
            fitScore = 10;
          } else if (
            (fitKey === "oversized" && item.fit_type === "relaxed") ||
            (fitKey === "slim" && item.fit_type === "regular")
          ) {
            fitScore = 5;
          }
        }
      }

      // Personalization from interactions (0-10)
      for (const tag of item.style_tags) {
        personalizationScore += styleBoosts.get(tag) || 0;
      }
      personalizationScore += itemBoosts.get(item.id) || 0;
      personalizationScore = Math.max(0, Math.min(personalizationScore, 10));

      // Reddit trending boost (0-5)
      for (const tag of item.style_tags) {
        redditBoost += redditStyleBoosts.get(tag.toLowerCase()) || 0;
      }
      redditBoost = Math.max(0, Math.min(Math.round(redditBoost), 5));

      return {
        score: bodyTypeScore + occasionScore + styleScore + colorScore + fitScore + personalizationScore + redditBoost,
        breakdown: {
          body_type: bodyTypeScore,
          occasion: occasionScore,
          style_preference: styleScore,
          color_match: colorScore,
          fit_match: fitScore,
          personalization: personalizationScore,
          reddit_boost: redditBoost,
        },
      };
    }

    // Score all items
    const scoredTops = tops.map((t) => ({ item: t, ...scoreItem(t) })).sort((a, b) => b.score - a.score);
    const scoredBottoms = bottoms.map((b) => ({ item: b, ...scoreItem(b) })).sort((a, b) => b.score - a.score);
    const scoredFootwear = footwearItems.map((f) => ({ item: f, ...scoreItem(f) })).sort((a, b) => b.score - a.score);
    const scoredOuterwear = outerwearItems.map((o) => ({ item: o, ...scoreItem(o) })).sort((a, b) => b.score - a.score);
    const scoredAccessories = accessories.map((a) => ({ item: a, ...scoreItem(a) })).sort((a, b) => b.score - a.score);

    // Generate outfit combinations using top candidates
    const generatedOutfits = [];
    const topCandidates = scoredTops.slice(0, 5);
    const bottomCandidates = scoredBottoms.slice(0, 5);
    const footwearCandidates = scoredFootwear.slice(0, 4);

    for (const top of topCandidates) {
      for (const bottom of bottomCandidates) {
        // Get compatibility score between top and bottom
        const topBottomCompat = compatMap.get(`${top.item.id}-${bottom.item.id}`) || 50;

        for (const shoe of footwearCandidates) {
          const topShoeCompat = compatMap.get(`${top.item.id}-${shoe.item.id}`) || 50;
          const bottomShoeCompat = compatMap.get(`${bottom.item.id}-${shoe.item.id}`) || 50;

          const avgCompat = (topBottomCompat + topShoeCompat + bottomShoeCompat) / 3;
          const itemScoreAvg = (top.score + bottom.score + shoe.score) / 3;
          const totalScore = Math.round(itemScoreAvg * 0.6 + avgCompat * 0.4);

          // Pick best outerwear if occasion calls for it
          const needsOuterwear = ["winter", "formal", "office", "interview", "wedding"].includes(occasion);
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
            score_breakdown: {
              top_score: top.breakdown,
              bottom_score: bottom.breakdown,
              footwear_score: shoe.breakdown,
              compatibility: Math.round(avgCompat),
            },
          });
        }
      }
    }

    // Sort by total score and take top 9
    generatedOutfits.sort((a, b) => b.total_score - a.total_score);
    const topOutfits = generatedOutfits.slice(0, 9);

    // Use AI to generate styling tips for top outfits
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && topOutfits.length > 0) {
      try {
        const outfitDescriptions = topOutfits.map((o, i) =>
          `Outfit ${i + 1}: ${o.top.name} + ${o.bottom.name} + ${o.footwear.name}${o.outerwear ? ` + ${o.outerwear.name}` : ""}${o.accessory ? ` + ${o.accessory.name}` : ""} (occasion: ${occasion})`
        ).join("\n");

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "You are a fashion stylist. For each outfit, provide a one-sentence styling tip. Return ONLY a JSON array of strings, one tip per outfit. No markdown, no explanation.",
              },
              {
                role: "user",
                content: `Generate styling tips for these outfits:\n${outfitDescriptions}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const tipsText = aiData.choices?.[0]?.message?.content || "";
          try {
            const tips = JSON.parse(tipsText);
            topOutfits.forEach((outfit, i) => {
              if (tips[i]) {
                (outfit as any).styling_tip = tips[i];
              }
            });
          } catch {
            // If JSON parse fails, try to extract tips line by line
            const lines = tipsText.split("\n").filter((l: string) => l.trim());
            topOutfits.forEach((outfit, i) => {
              if (lines[i]) {
                (outfit as any).styling_tip = lines[i].replace(/^\d+[\.\)]\s*/, "");
              }
            });
          }
        }
      } catch (e) {
        console.error("AI styling tips error:", e);
      }
    }

    // Store generated outfits for caching
    const outfitsToStore = topOutfits.map((o) => ({
      user_id,
      occasion,
      top_item_id: o.top.id,
      bottom_item_id: o.bottom.id,
      footwear_item_id: o.footwear.id,
      outerwear_item_id: o.outerwear?.id || null,
      accessory_item_id: o.accessory?.id || null,
      total_score: o.total_score,
      score_breakdown: o.score_breakdown,
      styling_tip: (o as any).styling_tip || null,
    }));

    // Clear old generated outfits for this user+occasion, then insert new
    await supabase.from("generated_outfits").delete().eq("user_id", user_id).eq("occasion", occasion);
    if (outfitsToStore.length > 0) {
      await supabase.from("generated_outfits").insert(outfitsToStore);
    }

    return new Response(
      JSON.stringify({
        outfits: topOutfits.map((o) => ({
          top: o.top,
          bottom: o.bottom,
          footwear: o.footwear,
          outerwear: o.outerwear,
          accessory: o.accessory,
          total_score: o.total_score,
          compatibility_avg: o.compatibility_avg,
          score_breakdown: o.score_breakdown,
          styling_tip: (o as any).styling_tip,
        })),
        quiz_data: quiz,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-outfits error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
