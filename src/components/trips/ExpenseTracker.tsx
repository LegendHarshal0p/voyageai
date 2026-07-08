import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/types/database";
import { Trash2, Plus } from "lucide-react";

const CATEGORIES = ["flights", "lodging", "food", "activities", "transport", "shopping", "other"];

export function ExpenseTracker({ tripId, budgetTotal }: { tripId: string; budgetTotal: number | null }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("spent_at", { ascending: false });
    setExpenses((data as Expense[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !amount) return;
    setSaving(true);
    await supabase.from("expenses").insert({
      trip_id: tripId,
      user_id: user.id,
      category,
      amount: parseFloat(amount),
      description: description || null,
      spent_at: spentAt,
    });
    setAmount("");
    setDescription("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    load();
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = budgetTotal != null ? budgetTotal - total : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expenses</CardTitle>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            Spent: <strong className="text-foreground">${total.toFixed(2)}</strong>
          </span>
          {budgetTotal != null && (
            <span>
              Budget: <strong className="text-foreground">${budgetTotal.toFixed(2)}</strong>
            </span>
          )}
          {remaining != null && (
            <span className={remaining < 0 ? "text-red-500" : ""}>
              Remaining: <strong>${remaining.toFixed(2)}</strong>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 flex h-10 w-36 rounded-md border border-border bg-card px-2 text-sm capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-28"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Date</label>
            <Input
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="mt-1 w-36"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="optional"
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="accent" disabled={saving}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-2">{e.spent_at}</td>
                  <td className="py-2 capitalize">{e.category}</td>
                  <td className="py-2 text-muted-foreground">{e.description ?? "—"}</td>
                  <td className="py-2 text-right">${Number(e.amount).toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDelete(e.id)} aria-label="Delete expense">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
