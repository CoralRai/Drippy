import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import OutfitCard from "@/components/OutfitCard";
import type { Database } from "@/integrations/supabase/types";

type Outfit = Database["public"]["Tables"]["outfits"]["Row"];
type StyleQuiz = Database["public"]["Tables"]["style_quizzes"]["Row"];

const Recommendations = () => {
  const [searchParams] = useSearchParams();
  const occasion = searchParams.get("occasion") || "casual";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [quizData, setQuizData] = useState<StyleQuiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch quiz data
      const { data: quiz } = await supabase
        .from("style_quizzes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setQuizData(quiz);

      // Fetch outfits matching occasion and gender
      let query = supabase
        .from("outfits")
        .select("*")
        .contains("occasions", [occasion]);

      if (quiz?.gender) {
        query = query.or(`gender.eq.${quiz.gender.toLowerCase()},gender.eq.unisex`);
      }

      const { data: outfitData } = await query.order("compatibility_score", { ascending: false });

      // Client-side scoring based on body type and style preferences
      const scored = (outfitData || []).map((outfit) => {
        let score = outfit.compatibility_score || 50;

        // Boost if body type matches
        if (quiz?.body_type) {
          const bodyKey = quiz.body_type.toLowerCase().split(" ")[0]; // "ectomorph", "mesomorph", "endomorph"
          if (outfit.body_types.some((bt) => bt.toLowerCase().includes(bodyKey))) {
            score += 20;
          }
        }

        // Boost if style tags match preferences
        if (quiz?.style_preferences) {
          const matchingStyles = outfit.style_tags.filter((tag) =>
            quiz.style_preferences.some((pref) => pref.toLowerCase() === tag.toLowerCase())
          );
          score += matchingStyles.length * 10;
        }

        // Boost if fit type matches
        if (quiz?.preferred_fit && outfit.fit_type) {
          if (outfit.fit_type.toLowerCase().includes(quiz.preferred_fit.toLowerCase().split(" ")[0])) {
            score += 15;
          }
        }

        return { ...outfit, compatibility_score: Math.min(score, 100) };
      });

      scored.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
      setOutfits(scored);
      setLoading(false);
    };

    fetchData();
  }, [user, occasion]);

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
          <Button variant="ghost" onClick={() => navigate("/occasions")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Change Occasion
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Your <span className="text-gradient-pink">{occasionLabel}</span> Outfits
          </h1>
          <p className="text-muted-foreground text-lg">
            Curated looks based on your style profile
          </p>
          {quizData && (
            <p className="text-sm text-muted-foreground mt-2">
              Body type: {quizData.body_type} · Fit: {quizData.preferred_fit} · Styles: {quizData.style_preferences.join(", ")}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No outfits found</h3>
            <p className="text-muted-foreground mb-6">We're still building our collection for this occasion.</p>
            <Button variant="hero" onClick={() => navigate("/occasions")}>
              Try Another Occasion
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
