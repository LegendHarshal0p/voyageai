import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseTracker } from "@/components/trips/ExpenseTracker";
import { HotelsSection } from "@/components/trips/HotelsSection";
import { RestaurantsSection } from "@/components/trips/RestaurantsSection";
import { PackingListSection } from "@/components/trips/PackingListSection";
import { DocumentsSection } from "@/components/trips/DocumentsSection";
import { TripMap } from "@/components/trips/TripMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { Trip, TripDay, Activity } from "@/types/models";
import { cn } from "@/lib/utils";

const TABS = ["Itinerary", "Hotels", "Restaurants", "Packing", "Documents", "Map", "Assistant", "Expenses"] as const;
type Tab = (typeof TABS)[number];

export default function TripDetailPage() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<(TripDay & { activities: Activity[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Itinerary");

  useEffect(() => {
    if (!tripId) return;

    async function load() {
      const { data: tripData } = await supabase.from("trips").select("*").eq("id", tripId!).single();
      setTrip(tripData as Trip);

      const { data: dayData } = await supabase
        .from("trip_days")
        .select("*")
        .eq("trip_id", tripId!)
        .order("day_number", { ascending: true });

      const daysWithActivities = await Promise.all(
        ((dayData as TripDay[]) ?? []).map(async (day) => {
          const { data: activities } = await supabase
            .from("activities")
            .select("*")
            .eq("trip_day_id", day.id)
            .order("start_time", { ascending: true });
          return { ...day, activities: (activities as Activity[]) ?? [] };
        })
      );

      setDays(daysWithActivities);
      setLoading(false);
    }

    load();
  }, [tripId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading trip...</p>;
  if (!trip) return <p className="text-sm text-muted-foreground">Trip not found.</p>;

  const durationDays =
    Math.round(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">{trip.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {trip.destination} · {trip.start_date} → {trip.end_date}
      </p>

      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "Itinerary" && (
          <div className="space-y-4">
            {days.map((day) => (
              <Card key={day.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Day {day.day_number} — {day.date}
                  </CardTitle>
                  {day.summary && <p className="text-sm text-muted-foreground">{day.summary}</p>}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {day.activities.map((a) => (
                      <li key={a.id} className="text-sm">
                        <span className="font-medium">{a.start_time}</span> — {a.title}
                        {a.cost != null && <span className="text-muted-foreground"> (${a.cost})</span>}
                        {a.description && <p className="text-muted-foreground">{a.description}</p>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            {days.length === 0 && (
              <p className="text-sm text-muted-foreground">No itinerary days yet for this trip.</p>
            )}
          </div>
        )}

        {activeTab === "Hotels" && <HotelsSection tripId={trip.id} />}
        {activeTab === "Restaurants" && <RestaurantsSection tripId={trip.id} />}
        {activeTab === "Packing" && (
          <PackingListSection tripId={trip.id} destination={trip.destination} durationDays={durationDays} />
        )}
        {activeTab === "Documents" && <DocumentsSection tripId={trip.id} />}
        {activeTab === "Map" && <TripMap destination={trip.destination} />}
        {activeTab === "Assistant" && (
          <div className="overflow-hidden rounded-lg border border-border">
            <ChatPanel
              tripContext={`Trip: ${trip.title}. Destination: ${trip.destination}. Dates: ${trip.start_date} to ${trip.end_date}.${trip.notes ? ` Notes: ${trip.notes}` : ""}`}
              placeholder={`Ask me anything about your trip to ${trip.destination} — restaurants, safety tips, visa info, what to pack.`}
              heightClassName="h-96"
            />
          </div>
        )}
        {activeTab === "Expenses" && <ExpenseTracker tripId={trip.id} budgetTotal={trip.budget_total} />}
      </div>
    </div>
  );
}
