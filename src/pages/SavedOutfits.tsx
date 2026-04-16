import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Loader2, Heart, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedOutfitRow {
  id: string;
  total_score: number;
  occasion: string | null;
  created_at: string;
  top_item: any;
  bottom_item: any;
  footwear_item: any;
  outerwear_item: any;
  accessory_item: any;
}

const SavedOutfits = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<SavedOutfitRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_outfits")
      .select(`
        id, total_score, occasion, created_at,
        top_item:clothing_items!saved_outfits_top_item_id_fkey(id, name, category, subcategory, style_tags, image_url, primary_color),
        bottom_item:clothing_items!saved_outfits_bottom_item_id_fkey(id, name, category, subcategory, style_tags, image_url, primary_color),
        footwear_item:clothing_items!saved_outfits_footwear_item_id_fkey(id, name, category, subcategory, style_tags, image_url),
        outerwear_item:clothing_items!saved_outfits_outerwear_item_id_fkey(id, name, category, subcategory, style_tags, image_url),
        accessory_item:clothing_items!saved_outfits_accessory_item_id_fkey(id, name, category, subcategory, style_tags, image_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setOutfits(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchSaved(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("saved_outfits").delete().eq("id", id);
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    toast({ title: "Removed", description: "Outfit removed from saved." });
  };

  return (
    <div className="min-h-screen bg-fashion">
      <div className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">Saved Outfits</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/occasions")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 bg-fashion-overlay min-h-[calc(100vh-65px)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Your <span className="text-gradient-pink">Saved</span> Outfits
          </h1>
          <p className="text-muted-foreground">Outfits you've bookmarked for later</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading saved outfits...</p>
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved outfits yet</h3>
            <p className="text-muted-foreground mb-6">Browse recommendations and tap the heart to save outfits.</p>
            <Button variant="hero" onClick={() => navigate("/occasions")}>
              Browse Outfits
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="glass-card rounded-xl overflow-hidden shadow-card">
                <div className="gradient-pink p-3 flex items-center justify-between">
                  <span className="text-primary-foreground font-bold text-sm">
                    {outfit.total_score}% match
                  </span>
                  {outfit.occasion && (
                    <span className="text-primary-foreground/80 text-xs capitalize">{outfit.occasion}</span>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-lg">
                    {outfit.top_item?.name} + {outfit.bottom_item?.name}
                  </h3>
                  {outfit.footwear_item && (
                    <p className="text-sm text-muted-foreground">👟 {outfit.footwear_item.name}</p>
                  )}
                  {outfit.outerwear_item && (
                    <p className="text-sm text-muted-foreground">🧥 {outfit.outerwear_item.name}</p>
                  )}
                  {outfit.accessory_item && (
                    <p className="text-sm text-muted-foreground">⌚ {outfit.accessory_item.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(outfit.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(outfit.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedOutfits;
