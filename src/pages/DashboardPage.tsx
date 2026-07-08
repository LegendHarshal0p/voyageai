import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/types/database";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { CurrencyConverter } from "@/components/dashboard/CurrencyConverter";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true })
      .limit(5)
      .then(({ data }) => {
        setTrips((data as Trip[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const upcoming = trips.filter((t) => t.status === "upcoming" || t.status === "planning");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <Link to="/trips/new">
          <Button variant="accent">
            <Plus className="mr-2 h-4 w-4" />
            New trip
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {trips.filter((t) => t.status === "completed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WeatherWidget destination={upcoming[0]?.destination ?? trips[0]?.destination ?? ""} />
        <CurrencyConverter />
      </div>

      <h2 className="font-display mt-10 text-xl font-semibold">Recent trips</h2>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      ) : trips.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No trips yet. Create your first one to get an AI-generated itinerary.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <Link key={trip.id} to={`/trips/${trip.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{trip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trip.start_date} → {trip.end_date}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
