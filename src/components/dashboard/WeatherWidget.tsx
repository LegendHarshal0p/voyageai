import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning } from "lucide-react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  locationLabel: string;
}

const WEATHER_ICON: Record<number, typeof Sun> = {
  0: Sun,
  1: Sun,
  2: Cloud,
  3: Cloud,
  61: CloudRain,
  63: CloudRain,
  65: CloudRain,
  71: CloudSnow,
  73: CloudSnow,
  75: CloudSnow,
  95: CloudLightning,
};

function iconFor(code: number) {
  return WEATHER_ICON[code] ?? Cloud;
}

export function WeatherWidget({ destination }: { destination: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
        );
        const geoData = await geoRes.json();
        const place = geoData.results?.[0];
        if (!place) {
          if (!cancelled) setError("Couldn't find weather for this destination.");
          return;
        }

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`
        );
        const weatherData = await weatherRes.json();

        if (!cancelled) {
          setWeather({
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weather_code,
            locationLabel: `${place.name}${place.country ? `, ${place.country}` : ""}`,
          });
        }
      } catch {
        if (!cancelled) setError("Weather data unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (!destination) return null;

  const Icon = weather ? iconFor(weather.weatherCode) : Cloud;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weather</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : weather ? (
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-accent" />
            <div>
              <p className="text-2xl font-semibold">{Math.round(weather.temperature)}°C</p>
              <p className="text-xs text-muted-foreground">{weather.locationLabel}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
