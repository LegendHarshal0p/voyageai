import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Trip, Expense } from "@/types/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3d6b8a", "#d97b4f", "#8aa39b", "#c9a26d", "#6b7a8f", "#a35d5d"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data: tripData } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user!.id);
      const tripsList = (tripData as Trip[]) ?? [];
      setTrips(tripsList);

      if (tripsList.length > 0) {
        const { data: expenseData } = await supabase
          .from("expenses")
          .select("*")
          .in(
            "trip_id",
            tripsList.map((t) => t.id)
          );
        setExpenses((expenseData as Expense[]) ?? []);
      }

      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  // Trips per month
  const tripsByMonth: Record<string, number> = {};
  trips.forEach((t) => {
    const month = new Date(t.start_date).toLocaleString("default", { month: "short", year: "2-digit" });
    tripsByMonth[month] = (tripsByMonth[month] ?? 0) + 1;
  });
  const tripsPerMonthData = Object.entries(tripsByMonth).map(([month, count]) => ({ month, count }));

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + Number(e.amount);
  });
  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const uniqueDestinations = new Set(trips.map((t) => t.destination)).size;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Analytics</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An overview of your travel habits and spending.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{trips.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destinations visited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{uniqueDestinations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trips per month</CardTitle>
          </CardHeader>
          <CardContent>
            {tripsPerMonthData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trip data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tripsPerMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="#d97b4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                  >
                    {expenseData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
