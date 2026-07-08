import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Hotel } from "@/types/database";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Plus, Trash2, Pencil, X } from "lucide-react";

const emptyForm = {
  name: "",
  address: "",
  check_in: "",
  check_out: "",
  price_per_night: "",
  confirmation_number: "",
  notes: "",
};

export function HotelsSection({ tripId }: { tripId: string }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("hotels")
      .select("*")
      .eq("trip_id", tripId)
      .order("check_in", { ascending: true });
    setHotels((data as Hotel[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  function startEdit(hotel: Hotel) {
    setEditingId(hotel.id);
    setForm({
      name: hotel.name,
      address: hotel.address ?? "",
      check_in: hotel.check_in ?? "",
      check_out: hotel.check_out ?? "",
      price_per_night: hotel.price_per_night?.toString() ?? "",
      confirmation_number: hotel.confirmation_number ?? "",
      notes: hotel.notes ?? "",
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
      address: form.address || null,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      confirmation_number: form.confirmation_number || null,
      notes: form.notes || null,
    };

    if (editingId) {
      await supabase.from("hotels").update(payload).eq("id", editingId);
    } else {
      await supabase.from("hotels").insert(payload);
    }

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("hotels").delete().eq("id", id);
    load();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Hotels</CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add hotel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editingId ? "Edit hotel" : "New hotel"}</p>
              <button type="button" onClick={resetForm} aria-label="Cancel">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <Input
              placeholder="Hotel name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                placeholder="Check in"
                value={form.check_in}
                onChange={(e) => setForm({ ...form, check_in: e.target.value })}
              />
              <Input
                type="date"
                placeholder="Check out"
                value={form.check_out}
                onChange={(e) => setForm({ ...form, check_out: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Price per night"
                value={form.price_per_night}
                onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
              />
              <Input
                placeholder="Confirmation #"
                value={form.confirmation_number}
                onChange={(e) => setForm({ ...form, confirmation_number: e.target.value })}
              />
            </div>
            <Input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Button type="submit" variant="accent" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add hotel"}
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : hotels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hotels added yet.</p>
        ) : (
          <div className="space-y-3">
            {hotels.map((h) => (
              <div key={h.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{h.name}</p>
                  {h.address && <p className="text-sm text-muted-foreground">{h.address}</p>}
                  <p className="text-xs text-muted-foreground">
                    {h.check_in ?? "?"} → {h.check_out ?? "?"}
                    {h.price_per_night != null && ` · $${h.price_per_night}/night`}
                  </p>
                  {h.confirmation_number && (
                    <p className="text-xs text-muted-foreground">Conf# {h.confirmation_number}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FavoriteButton type="hotel" label={h.name} referenceId={h.id} />
                  <button onClick={() => startEdit(h)} aria-label="Edit hotel">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => handleDelete(h.id)} aria-label="Delete hotel">
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
