import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Destination, DestinationPriority } from "@/types/models";
import { Plus, Trash2, Pencil, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", country: "", notes: "", priority: "someday" as DestinationPriority, target_month: "" };

const PRIORITY_LABELS: Record<DestinationPriority, string> = {
  someday: "Someday",
  this_year: "This year",
  next_trip: "Next trip",
};

export default function DestinationsPage() {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<DestinationPriority | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("destinations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDestinations((data as Destination[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function startEdit(d: Destination) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      country: d.country ?? "",
      notes: d.notes ?? "",
      priority: d.priority,
      target_month: d.target_month ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name) return;
    setSaving(true);
    setError(null);

    const payload = {
      user_id: user.id,
      name: form.name,
      country: form.country || null,
      notes: form.notes || null,
      priority: form.priority,
      target_month: form.target_month || null,
    };

    const { error } = editingId
      ? await supabase.from("destinations").update(payload).eq("id", editingId)
      : await supabase.from("destinations").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("destinations").delete().eq("id", id);
    load();
  }

  const filtered = destinations
    .filter((d) => filterPriority === "all" || d.priority === filterPriority)
    .filter(
      (d) =>
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.country?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Destination wishlist</h1>
        {!showForm && (
          <Button variant="accent" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add destination
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Places you want to visit — separate from your booked trips.
      </p>

      {showForm && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{editingId ? "Edit destination" : "New destination"}</p>
                <button type="button" onClick={resetForm} aria-label="Cancel">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Destination name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as DestinationPriority })}
                  className="flex h-10 rounded-md border border-border bg-card px-3 text-sm"
                >
                  {(Object.keys(PRIORITY_LABELS) as DestinationPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Target month e.g. June 2027"
                  value={form.target_month}
                  onChange={(e) => setForm({ ...form, target_month: e.target.value })}
                />
              </div>
              <Input
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Add destination"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          {(["all", "someday", "this_year", "next_trip"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                filterPriority === p
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-transparent"
              )}
            >
              {p === "all" ? "All" : PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              {destinations.length === 0
                ? "No destinations saved yet."
                : "No destinations match your search/filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{d.name}</CardTitle>
                  {d.country && <p className="text-sm text-muted-foreground">{d.country}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(d)} aria-label="Edit destination">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => handleDelete(d.id)} aria-label="Delete destination">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {PRIORITY_LABELS[d.priority]}
                </span>
                {d.target_month && (
                  <p className="mt-2 text-xs text-muted-foreground">Target: {d.target_month}</p>
                )}
                {d.notes && <p className="mt-2 text-sm text-muted-foreground">{d.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
