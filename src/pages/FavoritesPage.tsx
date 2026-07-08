import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Favorite, FavoriteType } from "@/types/models";
import { Trash2, Heart } from "lucide-react";

const TYPE_LABELS: Record<FavoriteType, string> = {
  destination: "Destinations",
  hotel: "Hotels",
  restaurant: "Restaurants",
};

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites((data as Favorite[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleRemove(id: string) {
    await supabase.from("favorites").delete().eq("id", id);
    load();
  }

  const grouped = favorites.reduce<Record<string, Favorite[]>>((acc, f) => {
    acc[f.type] = acc[f.type] ?? [];
    acc[f.type].push(f);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Favorites</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Destinations, hotels, and restaurants you've saved.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
      ) : favorites.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Heart className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              Nothing saved yet. Tap the heart icon on a hotel, restaurant, or destination to save it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {(Object.keys(grouped) as FavoriteType[]).map((type) => (
            <div key={type}>
              <h2 className="font-display text-xl font-semibold">{TYPE_LABELS[type]}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {grouped[type].map((f) => (
                  <Card key={f.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">{f.label}</CardTitle>
                      <button onClick={() => handleRemove(f.id)} aria-label="Remove favorite">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
