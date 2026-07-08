import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { FavoriteType } from "@/types/models";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database";

export function FavoriteButton({
  type,
  label,
  referenceId,
  metadata,
}: {
  type: FavoriteType;
  label: string;
  referenceId?: string;
  metadata?: Json;
}) {
  const { user } = useAuth();
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("label", label)
      .maybeSingle()
      .then(({ data }) => setFavoriteId(data?.id ?? null));
  }, [user, type, label]);

  async function toggle() {
    if (!user) return;
    setLoading(true);

    if (favoriteId) {
      await supabase.from("favorites").delete().eq("id", favoriteId);
      setFavoriteId(null);
    } else {
      const { data } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, type, label, reference_id: referenceId ?? null, metadata: metadata ?? null })
        .select()
        .single();
      setFavoriteId(data?.id ?? null);
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favoriteId ? "Remove from favorites" : "Add to favorites"}
      className="disabled:opacity-50"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favoriteId ? "fill-accent text-accent" : "text-muted-foreground hover:text-accent"
        )}
      />
    </button>
  );
}
