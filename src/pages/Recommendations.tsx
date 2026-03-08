import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Loader2, RefreshCw, Zap, TrendingUp } from "lucide-react";
import DynamicOutfitCard from "@/components/DynamicOutfitCard";
import { useTrackInteraction } from "@/hooks/useTrackInteraction";
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
}

interface DynamicOutfit {
  top: ClothingItem;
  bottom: ClothingItem;
  footwear: ClothingItem;
  outerwear: ClothingItem | null;
  accessory: ClothingItem | null;
  total_score: number;
  compatibility_avg: number;
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
  const [outfits, setOutfits] = useState<DynamicOutfit[]>([]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redditStatus, setRedditStatus] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("generate-outfits", {
        body: { occasion, user_id: user.id },
      });

      if (error) throw error;

      setOutfits(data.outfits || []);
      setQuizData(data.quiz_data || null);

      // Track view interaction
      track({ interaction_type: "view", style_tags: [occasion] });
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      toast({ title: "Error", description: "Failed to generate recommendations", variant: "destructive" });
    }
  }, [user, occasion, track, toast]);

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
    toast({ title: "Refreshed!", description: "Recommendations regenerated with latest data." });
  };

  const handleScrapeReddit = async () => {
    setRedditStatus("Analyzing fashion communities...");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-reddit-fashion");
      if (error) throw error;
      setRedditStatus(`Analyzed ${data.posts_analyzed} posts, found ${data.combinations_found} combos`);
      toast({ title: "Reddit analysis complete!", description: `Found ${data.combinations_found} new fashion combinations.` });
      // Refresh recommendations with new data
      await fetchRecommendations();
    } catch (error: any) {
      console.error("Reddit scrape error:", error);
      setRedditStatus("Failed to analyze Reddit data");
      toast({ title: "Error", description: "Failed to scrape Reddit fashion data", variant: "destructive" });
    }
  };

  const occasionLabel = occasion.charAt(0).toUpperCase() + occasion.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">StyleMatch AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleScrapeReddit} disabled={!!redditStatus && redditStatus.includes("Analyzing")}>
              <TrendingUp className="h-4 w-4 mr-1" /> Reddit Insights
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/occasions")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Change
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Your <span className="text-gradient-pink">{occasionLabel}</span> Outfits
          </h1>
          <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            AI-generated combinations from our compatibility engine
          </p>
          {quizData && (
            <p className="text-sm text-muted-foreground mt-2">
              Body: {quizData.body_type} · Fit: {quizData.preferred_fit} · Styles: {quizData.style_preferences.join(", ")}
            </p>
          )}
          {redditStatus && (
            <p className="text-xs text-primary mt-2">{redditStatus}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating personalized outfits...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit, i) => (
              <DynamicOutfitCard key={`${outfit.top.id}-${outfit.bottom.id}-${i}`} outfit={outfit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
