import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export function useTrackInteraction() {
  const { user } = useAuth();

  const track = useCallback(
    async (params: {
      interaction_type: "view" | "click" | "like" | "dislike" | "purchase";
      outfit_id?: string;
      clothing_item_id?: string;
      style_tags?: string[];
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;
      try {
        await supabase.functions.invoke("track-interaction", {
          body: {
            user_id: user.id,
            ...params,
          },
        });
      } catch (e) {
        console.error("Track interaction error:", e);
      }
    },
    [user]
  );

  return { track };
}
