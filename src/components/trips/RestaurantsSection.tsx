import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Restaurant } from "@/types/database";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Plus, Trash2, Pencil, X } from "lucide-react";

const emptyForm = {
  name: "",
  cuisine: "",
  address: "",
  reservation_time: "",
  price_range: "",
  rating: "",
  notes: "",
};

export function RestaurantsSection({ tripId }: { tripId: string }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("trip_id", tripId)
      .order("reservation_time", { ascending: true });
    setRestaurants((data as Restaurant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  function startEdit(r: Restaurant) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      cuisine: r.cuisine ?? "",
      address: r.address ?? "",
      reservation_time: r.reservation_time ? r.reservation_time.slice(0, 16) : "",
      price_range: r.price_range ?? "",
      rating: r.rating?.toString() ?? "",
      notes: r.notes ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);

    const payload = {
      trip_id: tripId,
      name: form.name,
      cuisine: form.cuisine || null,
      address: form.address || null,
      reservation_time: form.reservation_time ? new Date(form.reservation_time).toISOString() : null,
      price_range: form.price_range || null,
      rating: form.rating ? parseFloat(form.rating) : null,
      notes: form.notes || null,
    };

    if (editingId) {
      await supabase.from("restaurants").update(payload).eq("id", editingId);
    } else {
      await supabase.from("restaurants").insert(payload);
    }

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("restaurants").delete().eq("id", id);
    load();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Restaurants</CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add restaurant
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editingId ? "Edit restaurant" : "New restaurant"}</p>
              <button type="button" onClick={resetForm} aria-label="Cancel">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <Input
              placeholder="Restaurant name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Cuisine"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
              />
              <Input
                placeholder="Price range e.g. $$"
                value={form.price_range}
                onChange={(e) => setForm({ ...form, price_range: e.target.value })}
              />
            </div>
            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="datetime-local"
                value={form.reservation_time}
                onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
              />
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="Rating (0-5)"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </div>
            <Input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Button type="submit" variant="accent" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add restaurant"}
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No restaurants added yet.</p>
        ) : (
          <div className="space-y-3">
            {restaurants.map((r) => (
              <div key={r.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">
                    {r.name} {r.rating != null && <span className="text-xs text-muted-foreground">★ {r.rating}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[r.cuisine, r.price_range].filter(Boolean).join(" · ")}
                  </p>
                  {r.address && <p className="text-xs text-muted-foreground">{r.address}</p>}
                  {r.reservation_time && (
                    <p className="text-xs text-muted-foreground">
                      Reservation: {new Date(r.reservation_time).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <FavoriteButton type="restaurant" label={r.name} referenceId={r.id} />
                  <button onClick={() => startEdit(r)} aria-label="Edit restaurant">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} aria-label="Delete restaurant">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
