import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBREDDITS = [
  "malefashionadvice",
  "femalefashionadvice",
  "streetwear",
  "outfits",
];

const CLOTHING_KEYWORDS = [
  "jeans", "chinos", "trousers", "joggers", "cargo", "skirt", "shorts",
  "shirt", "tee", "t-shirt", "hoodie", "sweater", "blouse", "polo", "turtleneck", "henley",
  "sneakers", "boots", "loafers", "heels", "sandals", "oxford shoes",
  "jacket", "blazer", "coat", "puffer", "denim jacket", "leather jacket",
  "watch", "necklace", "sunglasses", "belt", "bag", "cap", "hat",
  "slim fit", "oversized", "regular fit", "relaxed",
  "streetwear", "casual", "formal", "minimal", "vintage", "preppy", "bohemian", "sporty",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const subreddit of SUBREDDITS) {
      try {
        // Fetch top posts from Reddit JSON API (no auth needed)
        const redditResponse = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
          {
            headers: {
              "User-Agent": "StyleMatchAI/1.0",
            },
          }
        );

        if (!redditResponse.ok) {
          console.error(`Failed to fetch r/${subreddit}: ${redditResponse.status}`);
          continue;
        }

        const redditData = await redditResponse.json();
        const posts = redditData.data?.children || [];

        for (const post of posts.slice(0, 5)) {
          const title = post.data?.title || "";
          const selftext = post.data?.selftext || "";
          const content = `${title} ${selftext}`.substring(0, 2000);

          if (content.length < 20) continue;

          // Extract clothing items mentioned
          const extractedItems: string[] = [];
          const contentLower = content.toLowerCase();
          for (const keyword of CLOTHING_KEYWORDS) {
            if (contentLower.includes(keyword) && !extractedItems.includes(keyword)) {
              extractedItems.push(keyword);
            }
          }

          if (extractedItems.length < 2) continue;

          // Use AI for sentiment analysis of clothing combinations
          try {
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
                    content: `You analyze fashion discussions. Extract clothing combinations and rate sentiment from -1 (negative) to 1 (positive). Return ONLY valid JSON: {"combinations": [{"items": ["item1","item2"], "sentiment": 0.8}], "overall_sentiment": 0.7}`,
                  },
                  {
                    role: "user",
                    content: `Analyze this fashion discussion:\n${content}`,
                  },
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const analysisText = aiData.choices?.[0]?.message?.content || "{}";
              
              let analysis;
              try {
                // Strip markdown code blocks if present
                const cleaned = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                analysis = JSON.parse(cleaned);
              } catch {
                analysis = { combinations: [], overall_sentiment: 0 };
              }

              results.push({
                subreddit,
                post_title: title.substring(0, 500),
                extracted_items: extractedItems,
                extracted_combinations: analysis.combinations || [],
                sentiment_score: analysis.overall_sentiment || 0,
                raw_content: content.substring(0, 1000),
              });
            }
          } catch (aiErr) {
            console.error("AI analysis error:", aiErr);
            results.push({
              subreddit,
              post_title: title.substring(0, 500),
              extracted_items: extractedItems,
              extracted_combinations: [],
              sentiment_score: 0,
              raw_content: content.substring(0, 1000),
            });
          }

          // Rate limit between posts
          await new Promise((r) => setTimeout(r, 500));
        }

        // Rate limit between subreddits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (subErr) {
        console.error(`Error processing r/${subreddit}:`, subErr);
      }
    }

    // Store results in database
    if (results.length > 0) {
      const { error } = await supabase.from("reddit_fashion_data").insert(results);
      if (error) console.error("Error storing reddit data:", error);
    }

    // Update item compatibility based on Reddit data
    const allCombinations = results.flatMap((r) => r.extracted_combinations);
    if (allCombinations.length > 0) {
      // Fetch existing items to match names
      const { data: clothingItems } = await supabase.from("clothing_items").select("id, name");
      const itemsByName = new Map((clothingItems || []).map((i: any) => [i.name.toLowerCase(), i.id]));

      for (const combo of allCombinations) {
        if (!combo.items || combo.items.length < 2) continue;
        // Try to match items to database entries
        const matchedIds: string[] = [];
        for (const itemName of combo.items) {
          for (const [dbName, dbId] of itemsByName) {
            if (dbName.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(dbName.split(" ").pop() || "")) {
              matchedIds.push(dbId as string);
              break;
            }
          }
        }

        // Create compatibility edges for matched pairs
        for (let i = 0; i < matchedIds.length; i++) {
          for (let j = i + 1; j < matchedIds.length; j++) {
            const score = Math.round(50 + (combo.sentiment || 0) * 50);
            await supabase.from("item_compatibility").upsert(
              {
                item_a_id: matchedIds[i],
                item_b_id: matchedIds[j],
                compatibility_score: Math.max(0, Math.min(100, score)),
                source: "reddit",
              },
              { onConflict: "item_a_id,item_b_id" }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        posts_analyzed: results.length,
        combinations_found: results.reduce((acc, r) => acc + r.extracted_combinations.length, 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-reddit-fashion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
