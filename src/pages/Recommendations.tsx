import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Loader2, RefreshCw, Zap, TrendingUp, CloudSun, Palette, LayoutGrid, Heart } from "lucide-react";
import DynamicOutfitCard from "@/components/DynamicOutfitCard";
import { useTrackInteraction } from "@/hooks/useTrackInteraction";
import { useWeather } from "@/hooks/useWeather";
import { useToast } from "@/hooks/use-toast";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  style_tags: string[];
  amazon_link: string | null;
  myntra_link: string | null;
  flipkart_link: string | null;
  image_url: string | null;
  primary_color?: string;
}

interface DynamicOutfit {
  top: ClothingItem;
  bottom: ClothingItem;
  footwear: ClothingItem;
  outerwear: ClothingItem | null;
  accessory: ClothingItem | null;
  total_score: number;
  compatibility_avg: number;
  color_harmony?: number;
  weather_score?: number;
  score_breakdown: any;
  styling_tip?: string;
}

interface QuizData {
  body_type: string;
  preferred_fit: string;
  style_preferences: string[];
}

const Recommendations = () => {
  const [searchParams] = useSearchParams();
  const occasion = searchParams.get("occasion") || "casual";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { track } = useTrackInteraction();
  const { weather } = useWeather();
  const [outfits, setOutfits] = useState<DynamicOutfit[]>([]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redditStatus, setRedditStatus] = useState<string | null>(null);
  const [includeWardrobe, setIncludeWardrobe] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("generate-outfits", {
        body: {
          occasion,
          user_id: user.id,
          weather_suggestion: weather?.suggestion || "warm",
          include_wardrobe: includeWardrobe,
        },
      });
      if (error) throw error;
      setOutfits(data.outfits || []);
      setQuizData(data.quiz_data || null);
      track({ interaction_type: "view", style_tags: [occasion] });
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      toast({ title: "Error", description: "Failed to generate recommendations", variant: "destructive" });
    }
  }, [user, occasion, weather, includeWardrobe, track, toast]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRecommendations();
      setLoading(false);
    };
    load();
  }, [fetchRecommendations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
    toast({ title: "Refreshed!", description: "Recommendations regenerated." });
  };

  const handleScrapeReddit = async () => {
    setRedditStatus("Analyzing fashion communities...");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-reddit-fashion");
      if (error) throw error;
      setRedditStatus(`Analyzed ${data.posts_analyzed} posts, found ${data.combinations_found} combos`);
      toast({ title: "Reddit analysis complete!", description: `Found ${data.combinations_found} new fashion combinations.` });
      await fetchRecommendations();
    } catch (error: any) {
      setRedditStatus("Failed to analyze Reddit data");
      toast({ title: "Error", description: "Failed to scrape Reddit fashion data", variant: "destructive" });
    }
  };

  const occasionLabel = occasion.charAt(0).toUpperCase() + occasion.slice(1);

  // Calculate bundle price estimate (dummy for now — shows concept)
  const getBundlePrice = (outfit: DynamicOutfit) => {
    // Price estimation based on item types
    const prices: Record<string, number> = {
      top: 899, bottom: 1299, footwear: 1999, outerwear: 2499, accessory: 599,
    };
    let total = prices.top + prices.bottom + prices.footwear;
    if (outfit.outerwear) total += prices.outerwear;
    if (outfit.accessory) total += prices.accessory;
    return total;
  };

  return (
    <div className="min-h-screen bg-fashion">
      {/* Header */}
      <div className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">StyleMatch AI</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <Button variant="ghost" size="sm" onClick={handleScrapeReddit} disabled={!!redditStatus && redditStatus.includes("Analyzing")}>
              <TrendingUp className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Reddit</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/saved")}>
              <Heart className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Saved</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
              <LayoutGrid className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Wardrobe</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 sm:mr-1 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/occasions")}>
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Change</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 bg-fashion-overlay min-h-[calc(100vh-65px)]">
        {/* Title section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Your <span className="text-gradient-pink">{occasionLabel}</span> Outfits
          </h1>
          <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            AI-generated from compatibility graph + color harmony
          </p>

          {/* Info badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {weather && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
                <CloudSun className="h-3.5 w-3.5 text-primary" />
                {weather.temperature}°C · {weather.description}
              </div>
            )}
            {quizData && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
                <Palette className="h-3.5 w-3.5 text-primary" />
                {quizData.body_type} · {quizData.preferred_fit}
              </div>
            )}
            {redditStatus && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
                {redditStatus}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating personalized outfits...</p>
            <p className="text-xs text-muted-foreground">Scoring body type · occasion · color harmony · weather · compatibility</p>
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No outfits generated</h3>
            <p className="text-muted-foreground mb-6">We couldn't find compatible combinations for this occasion.</p>
            <Button variant="hero" onClick={() => navigate("/occasions")}>
              Try Another Occasion
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.map((outfit, i) => (
                <DynamicOutfitCard key={`${outfit.top.id}-${outfit.bottom.id}-${i}`} outfit={outfit} occasion={occasion} />
              ))}
            </div>

            {/* Bundle CTA */}
            {outfits.length > 0 && (
              <div className="mt-12 glass-card rounded-xl p-6 text-center">
                <h3 className="font-display font-bold text-xl mb-2">
                  🛍️ Shop Complete Outfit Bundles
                </h3>
                <p className="text-muted-foreground mb-4">
                  Each outfit above has individual purchase links. Click any item's affiliate link to buy the exact piece.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {outfits.slice(0, 3).map((outfit, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-4 text-center min-w-[180px]">
                      <p className="text-sm font-medium mb-1">Outfit #{i + 1}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {outfit.top.name.split(" ").slice(0, 2).join(" ")} + {outfit.bottom.name.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <p className="text-primary font-bold">≈ ₹{getBundlePrice(outfit).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{outfit.total_score}% match</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
