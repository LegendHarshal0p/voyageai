import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { generateItinerary, type GeneratedDay } from "@/services/groq";
import { sendEmail } from "@/services/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function NewTripPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interests, setInterests] = useState("");
  const [budgetLevel, setBudgetLevel] = useState<"budget" | "moderate" | "luxury">("moderate");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDays, setGeneratedDays] = useState<GeneratedDay[] | null>(null);

  async function handleGenerate() {
    setError(null);
    if (!destination || !startDate || !endDate) {
      setError("Fill in destination and dates first.");
      return;
    }
    setGenerating(true);
    try {
      const days = await generateItinerary({ destination, startDate, endDate, interests, budgetLevel });
      setGeneratedDays(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate itinerary.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveTrip() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: title || `Trip to ${destination}`,
          destination,
          start_date: startDate,
          end_date: endDate,
          status: "planning",
        })
        .select()
        .single();

      if (tripError) throw tripError;

      if (generatedDays && trip) {
        for (const day of generatedDays) {
          const { data: tripDay, error: dayError } = await supabase
            .from("trip_days")
            .insert({
              trip_id: trip.id,
              day_number: day.day,
              date: day.date,
              summary: day.summary,
            })
            .select()
            .single();
          if (dayError) throw dayError;

          if (tripDay) {
            const activityRows = day.activities.map((a) => ({
              trip_day_id: tripDay.id,
              title: a.title,
              description: a.description,
              start_time: a.time,
              cost: a.estimatedCost,
              category: "general",
            }));
            const { error: actError } = await supabase.from("activities").insert(activityRows);
            if (actError) throw actError;
          }
        }
      }

      if (user.email) {
        sendEmail("trip_confirmation", user.email, {
          fullName: user.user_metadata?.full_name ?? "there",
          tripTitle: trip.title,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
        }).catch(() => {});
      }

      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Plan a new trip</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell VoyageAI the basics and get a full itinerary in seconds.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="text-sm font-medium">Trip title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer in Lisbon"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Destination</label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Lisbon, Portugal"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Interests</label>
            <Input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="food, history, hiking, nightlife"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Budget level</label>
            <div className="mt-1 flex gap-2">
              {(["budget", "moderate", "luxury"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setBudgetLevel(level)}
                  className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                    budgetLevel === level
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-transparent"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button variant="accent" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Generating itinerary..." : "Generate itinerary with AI"}
          </Button>
        </CardContent>
      </Card>

      {generatedDays && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold">Generated itinerary</h2>
          <div className="mt-4 space-y-4">
            {generatedDays.map((day) => (
              <Card key={day.day}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Day {day.day} — {day.date}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{day.summary}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {day.activities.map((a, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{a.time}</span> — {a.title}
                        <span className="text-muted-foreground"> (${a.estimatedCost})</span>
                        <p className="text-muted-foreground">{a.description}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="accent" size="lg" className="mt-6" onClick={handleSaveTrip} disabled={saving}>
            {saving ? "Saving trip..." : "Save this trip"}
          </Button>
        </div>
      )}
    </div>
  );
}
