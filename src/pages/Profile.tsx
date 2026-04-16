import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Camera, Save, Loader2, User, Shirt, Heart, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<Record<string, any> | null>(null);
  const [stats, setStats] = useState({ savedOutfits: 0, interactions: 0, wardrobeItems: 0 });

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url);
      } else {
        setDisplayName(user.user_metadata?.display_name || "");
      }

      // Load quiz data
      const { data: quiz } = await supabase
        .from("style_quizzes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setQuizData(quiz);

      // Load stats
      const [saved, interactions, wardrobe] = await Promise.all([
        supabase.from("saved_outfits").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_interactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_wardrobe").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setStats({
        savedOutfits: saved.count || 0,
        interactions: interactions.count || 0,
        wardrobeItems: wardrobe.count || 0,
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").upsert({
        user_id: user.id,
        avatar_url: url,
        display_name: displayName || null,
      }, { onConflict: "user_id" });

      setAvatarUrl(url);
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl,
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Profile saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  if (loading) {
    return (
      <div className="min-h-screen bg-fashion flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fashion">
      {/* Header */}
      <div className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">Drippy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/occasions">
              <Button variant="ghost" size="sm">Get Outfits</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* Avatar & Name Section */}
        <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-secondary/50 border-border" />
            </div>
            <Button variant="hero" className="w-full" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-6 text-center">
            <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.savedOutfits}</p>
            <p className="text-sm text-muted-foreground">Saved Outfits</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <Shirt className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.wardrobeItems}</p>
            <p className="text-sm text-muted-foreground">Wardrobe Items</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.interactions}</p>
            <p className="text-sm text-muted-foreground">Interactions</p>
          </div>
        </div>

        {/* Style Profile */}
        {quizData && (
          <div className="glass-card rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Your Style Profile</h2>
              <Link to="/quiz">
                <Button variant="outline" size="sm">Edit Style</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Gender", value: quizData.gender },
                { label: "Age Group", value: quizData.age_group },
                { label: "Height", value: quizData.height },
                { label: "Weight", value: quizData.weight },
                { label: "Body Type", value: quizData.body_type },
                { label: "Complexion", value: quizData.skin_tone },
                { label: "Preferred Fit", value: quizData.preferred_fit },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="font-medium text-sm">{item.value || "—"}</p>
                </div>
              ))}
            </div>
            {quizData.style_preferences?.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Style Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {quizData.style_preferences.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
