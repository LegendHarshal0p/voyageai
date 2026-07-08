import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/types/models";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Plus, Copy } from "lucide-react";

export default function TripsListPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTrips((data as Trip[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDuplicate(trip: Trip, e: React.MouseEvent) {
    e.preventDefault();
    if (!user) return;
    setDuplicatingId(trip.id);

    const { data: newTrip } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: `${trip.title} (copy)`,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: "planning",
        budget_total: trip.budget_total,
        notes: trip.notes,
      })
      .select()
      .single();

    if (newTrip) {
      const { data: days } = await supabase.from("trip_days").select("*").eq("trip_id", trip.id);
      for (const day of days ?? []) {
        const { data: newDay } = await supabase
          .from("trip_days")
          .insert({ trip_id: newTrip.id, day_number: day.day_number, date: day.date, summary: day.summary })
          .select()
          .single();

        if (newDay) {
          const { data: activities } = await supabase
            .from("activities")
            .select("*")
            .eq("trip_day_id", day.id);
          if (activities && activities.length > 0) {
            await supabase.from("activities").insert(
              activities.map((a) => ({
                trip_day_id: newDay.id,
                title: a.title,
                description: a.description,
                start_time: a.start_time,
                location: a.location,
                cost: a.cost,
                category: a.category,
              }))
            );
          }
        }
      }
    }

    setDuplicatingId(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Your trips</h1>
        <Link to="/trips/new">
          <Button variant="accent">
            <Plus className="mr-2 h-4 w-4" />
            New trip
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
      ) : trips.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">You haven't created any trips yet.</p>
            <Link to="/trips/new">
              <Button variant="accent" className="mt-4">
                Plan your first trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div key={trip.id} className="relative">
              <Link to={`/trips/${trip.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg pr-14">{trip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{trip.destination}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trip.start_date} → {trip.end_date}
                    </p>
                    <span className="mt-3 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                      {trip.status}
                    </span>
                  </CardContent>
                </Card>
              </Link>
              <div
                className="absolute right-4 top-5 flex items-center gap-2"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={(e) => handleDuplicate(trip, e)}
                  disabled={duplicatingId === trip.id}
                  aria-label="Duplicate trip"
                  className="disabled:opacity-50"
                >
                  <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
                <FavoriteButton type="destination" label={trip.destination} referenceId={trip.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
