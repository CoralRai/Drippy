import { useState } from "react";
import { ExternalLink, Shirt, Footprints, Watch, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Palette, CloudSun, Heart, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrackInteraction } from "@/hooks/useTrackInteraction";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

interface ScoreBreakdown {
  top_score?: Record<string, number>;
  bottom_score?: Record<string, number>;
  footwear_score?: Record<string, number>;
  compatibility: number;
  color_harmony?: number;
  weather_fit?: number;
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
  score_breakdown: ScoreBreakdown;
  styling_tip?: string;
}


const DynamicOutfitCard = ({ outfit, occasion }: { outfit: DynamicOutfit; occasion?: string }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const { track } = useTrackInteraction();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user) return;
    if (saved) {
      toast({ title: "Already saved!" });
      return;
    }
    const { error } = await supabase.from("saved_outfits").insert({
      user_id: user.id,
      top_item_id: outfit.top.id,
      bottom_item_id: outfit.bottom.id,
      footwear_item_id: outfit.footwear.id,
      outerwear_item_id: outfit.outerwear?.id || null,
      accessory_item_id: outfit.accessory?.id || null,
      total_score: outfit.total_score,
      occasion: occasion || null,
    });
    if (!error) {
      setSaved(true);
      toast({ title: "Saved!", description: "Outfit added to your collection." });
      track({ interaction_type: "save", clothing_item_id: outfit.top.id, style_tags: [...new Set([...outfit.top.style_tags, ...outfit.bottom.style_tags])] });
    }
  };

  const allTags = [
    ...outfit.top.style_tags,
    ...outfit.bottom.style_tags,
    ...outfit.footwear.style_tags,
  ];
  const uniqueTags = [...new Set(allTags)];

  const handleLike = () => {
    setLiked(true);
    track({
      interaction_type: "like",
      clothing_item_id: outfit.top.id,
      style_tags: uniqueTags,
      metadata: { top: outfit.top.id, bottom: outfit.bottom.id, footwear: outfit.footwear.id },
    });
  };

  const handleDislike = () => {
    setLiked(false);
    track({
      interaction_type: "dislike",
      clothing_item_id: outfit.top.id,
      style_tags: uniqueTags,
      metadata: { top: outfit.top.id, bottom: outfit.bottom.id, footwear: outfit.footwear.id },
    });
  };

  const handleItemClick = (item: ClothingItem) => {
    track({
      interaction_type: "click",
      clothing_item_id: item.id,
      style_tags: item.style_tags,
    });
  };

  const renderAffiliateLinks = (item: ClothingItem) => (
    <div className="flex gap-1 mt-1">
      {item.amazon_link && (
        <a href={item.amazon_link} target="_blank" rel="noopener noreferrer" onClick={() => handleItemClick(item)}>
          <Button size="sm" variant="outline-pink" className="text-[10px] h-6 px-2">
            Amazon <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </Button>
        </a>
      )}
      {item.myntra_link && (
        <a href={item.myntra_link} target="_blank" rel="noopener noreferrer" onClick={() => handleItemClick(item)}>
          <Button size="sm" variant="outline-pink" className="text-[10px] h-6 px-2">
            Myntra <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </Button>
        </a>
      )}
      {item.flipkart_link && (
        <a href={item.flipkart_link} target="_blank" rel="noopener noreferrer" onClick={() => handleItemClick(item)}>
          <Button size="sm" variant="outline-pink" className="text-[10px] h-6 px-2">
            Flipkart <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </Button>
        </a>
      )}
    </div>
  );

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-card hover:shadow-pink transition-all duration-300 group">
      {/* Score header */}
      <div className="gradient-pink p-3 flex items-center justify-between">
        <span className="text-primary-foreground font-bold text-sm">
          {outfit.total_score}% match
        </span>
        <div className="flex items-center gap-3 text-primary-foreground/80 text-xs">
          {outfit.color_harmony != null && (
            <span className="flex items-center gap-1"><Palette className="h-3 w-3" />{outfit.color_harmony}%</span>
          )}
          {outfit.weather_score != null && (
            <span className="flex items-center gap-1"><CloudSun className="h-3 w-3" />{outfit.weather_score}</span>
          )}
          <span>Compat: {outfit.compatibility_avg}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Outfit name */}
        <h3 className="font-display font-bold text-lg">
          {outfit.top.name} + {outfit.bottom.name}
        </h3>

        {/* Items with affiliate links */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Shirt className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Top:</span>
              <span className="font-medium">{outfit.top.name}</span>
            </div>
            {renderAffiliateLinks(outfit.top)}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-4 w-4 text-primary text-center shrink-0">👖</span>
              <span className="text-muted-foreground">Bottom:</span>
              <span className="font-medium">{outfit.bottom.name}</span>
            </div>
            {renderAffiliateLinks(outfit.bottom)}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm">
              <Footprints className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Shoes:</span>
              <span className="font-medium">{outfit.footwear.name}</span>
            </div>
            {renderAffiliateLinks(outfit.footwear)}
          </div>

          {outfit.outerwear && (
            <div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-4 w-4 text-primary text-center shrink-0">🧥</span>
                <span className="text-muted-foreground">Layer:</span>
                <span className="font-medium">{outfit.outerwear.name}</span>
              </div>
              {renderAffiliateLinks(outfit.outerwear)}
            </div>
          )}

          {outfit.accessory && (
            <div>
              <div className="flex items-center gap-2 text-sm">
                <Watch className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Accessory:</span>
                <span className="font-medium">{outfit.accessory.name}</span>
              </div>
              {renderAffiliateLinks(outfit.accessory)}
            </div>
          )}
        </div>

        {/* Styling tip */}
        {outfit.styling_tip && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
            <span className="font-semibold text-primary">💡 AI Tip:</span>{" "}
            <span className="text-muted-foreground">{outfit.styling_tip}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {uniqueTags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Score breakdown toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
        >
          {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Score breakdown
        </button>

        {showBreakdown && (
          <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
            {outfit.score_breakdown.top_score && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Body type match</span>
                <span>{outfit.score_breakdown.top_score.body_type || 0}/20</span>
              </div>
            )}
            {outfit.score_breakdown.top_score && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occasion fit</span>
                <span>{outfit.score_breakdown.top_score.occasion || 0}/25</span>
              </div>
            )}
            {outfit.score_breakdown.top_score && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Style preference</span>
                <span>{outfit.score_breakdown.top_score.style_preference || 0}/20</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item compatibility</span>
              <span>{outfit.score_breakdown.compatibility}/100</span>
            </div>
            {outfit.score_breakdown.top_score?.personalization ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Personalization</span>
                <span>+{outfit.score_breakdown.top_score.personalization}</span>
              </div>
            ) : null}
            {outfit.score_breakdown.top_score?.reddit_boost ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reddit trending</span>
                <span>+{outfit.score_breakdown.top_score.reddit_boost}</span>
              </div>
            ) : null}
            {outfit.score_breakdown.color_harmony != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color harmony</span>
                <span>{outfit.score_breakdown.color_harmony}/100</span>
              </div>
            )}
            {outfit.score_breakdown.weather_fit != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weather fit</span>
                <span>{outfit.score_breakdown.weather_fit}/15</span>
              </div>
            )}
          </div>
        )}

        {/* Like/Dislike/Save */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant={liked === true ? "hero" : "outline"}
            className="flex-1 text-xs"
            onClick={handleLike}
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            {liked === true ? "Liked!" : "Like"}
          </Button>
          <Button
            size="sm"
            variant={liked === false ? "destructive" : "outline"}
            className="flex-1 text-xs"
            onClick={handleDislike}
          >
            <ThumbsDown className="h-3.5 w-3.5 mr-1" />
            {liked === false ? "Nope" : "Dislike"}
          </Button>
          <Button
            size="sm"
            variant={saved ? "hero" : "outline-pink"}
            className="text-xs px-3"
            onClick={handleSave}
          >
            <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DynamicOutfitCard;
