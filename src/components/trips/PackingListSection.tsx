import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generatePackingList } from "@/services/groq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackingListItem } from "@/types/database";
import { Plus, Trash2, Sparkles } from "lucide-react";

export function PackingListSection({
  tripId,
  destination,
  durationDays,
}: {
  tripId: string;
  destination: string;
  durationDays: number;
}) {
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("packing_list_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });
    setItems((data as PackingListItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await supabase.from("packing_list_items").insert({ trip_id: tripId, item: newItem.trim() });
    setNewItem("");
    load();
  }

  async function handleToggle(item: PackingListItem) {
    await supabase
      .from("packing_list_items")
      .update({ is_packed: !item.is_packed })
      .eq("id", item.id);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("packing_list_items").delete().eq("id", id);
    load();
  }

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const activitiesSummary = "general sightseeing and local experiences";
      const suggestions = await generatePackingList(destination, durationDays, activitiesSummary);
      const rows = suggestions.map((item) => ({ trip_id: tripId, item }));
      if (rows.length > 0) {
        await supabase.from("packing_list_items").insert(rows);
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate packing list.");
    } finally {
      setGenerating(false);
    }
  }

  const packedCount = items.filter((i) => i.is_packed).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Packing list</CardTitle>
          {items.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {packedCount} of {items.length} packed
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
          <Sparkles className="mr-1 h-4 w-4" />
          {generating ? "Generating..." : "Generate with AI"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <Input
            placeholder="Add an item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button type="submit" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items yet. Add some manually or generate a list with AI.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary">
                <label className="flex flex-1 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.is_packed}
                    onChange={() => handleToggle(item)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <span className={item.is_packed ? "text-muted-foreground line-through" : ""}>
                    {item.item}
                  </span>
                </label>
                <button onClick={() => handleDelete(item.id)} aria-label="Delete item">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
