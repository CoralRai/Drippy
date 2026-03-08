import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Plus, Trash2, ArrowLeft, Shirt, Footprints, Watch,
  LayoutGrid,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  style_tags: string[];
  notes: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "top", label: "Top", icon: "👕" },
  { value: "bottom", label: "Bottom", icon: "👖" },
  { value: "footwear", label: "Footwear", icon: "👟" },
  { value: "outerwear", label: "Outerwear", icon: "🧥" },
  { value: "accessory", label: "Accessory", icon: "⌚" },
];

const STYLE_OPTIONS = ["Streetwear", "Casual", "Formal", "Minimal", "Sporty", "Bohemian", "Vintage", "Preppy"];

const COLOR_OPTIONS = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#001F3F" },
  { name: "Gray", hex: "#808080" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Red", hex: "#DC143C" },
  { name: "Blue", hex: "#4A90D9" },
  { name: "Green", hex: "#228B22" },
  { name: "Pink", hex: "#FFB6C1" },
  { name: "Yellow", hex: "#FFD700" },
  { name: "Purple", hex: "#800080" },
  { name: "Olive", hex: "#808000" },
  { name: "Cream", hex: "#FFFDD0" },
];

const Wardrobe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("top");
  const [color, setColor] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_wardrobe")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as WardrobeItem[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("user_wardrobe").insert({
      user_id: user.id,
      name: name.trim(),
      category,
      color: color || null,
      style_tags: selectedTags,
      notes: notes.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added!", description: `${name} added to your wardrobe.` });
      setName("");
      setColor("");
      setSelectedTags([]);
      setNotes("");
      setShowAdd(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_wardrobe").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
    toast({ title: "Removed", description: "Item removed from wardrobe." });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getCategoryIcon = (cat: string) => {
    const c = CATEGORIES.find((c) => c.value === cat);
    return c?.icon || "👕";
  };

  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.value),
  }));

  return (
    <div className="min-h-screen bg-fashion">
      {/* Header */}
      <div className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">My Wardrobe</span>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/occasions")}>
              Get Outfits
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-fashion-overlay min-h-[calc(100vh-65px)]">
        {/* Add form */}
        {showAdd && (
          <div className="glass-card rounded-xl p-6 mb-8">
            <h3 className="font-display font-bold text-lg mb-4">Add Clothing Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Item name (e.g. Blue Denim Jacket)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color picker */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c.name ? "border-primary scale-110 shadow-pink" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Style tags */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Style tags</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs transition-all border ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-4"
            />

            <div className="flex gap-2">
              <Button variant="hero" onClick={handleAdd} disabled={!name.trim() || saving}>
                {saving ? "Adding..." : "Add to Wardrobe"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Wardrobe display */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading wardrobe...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <LayoutGrid className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wardrobe is empty</h3>
            <p className="text-muted-foreground mb-6">Add clothes you own to get personalized outfit combos.</p>
            <Button variant="hero" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.value}>
                  <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                    <span>{group.icon}</span> {group.label}s
                    <span className="text-sm text-muted-foreground font-normal">({group.items.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="glass-card rounded-lg p-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.color && (
                              <div
                                className="w-4 h-4 rounded-full border border-border"
                                style={{
                                  backgroundColor: COLOR_OPTIONS.find((c) => c.name === item.color)?.hex || "#808080",
                                }}
                              />
                            )}
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                          {item.style_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.style_tags.map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            <div className="text-center pt-4">
              <Button variant="hero" onClick={() => navigate("/occasions")}>
                Generate Outfits with My Wardrobe <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wardrobe;
