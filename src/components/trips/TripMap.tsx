import { useEffect, useRef, useState } from "react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlaceKind = "lodging" | "restaurant" | "tourist_attraction";

interface NearbyPlace {
  name: string;
  rating?: number;
  vicinity?: string;
  location: google.maps.LatLng;
}

const PLACE_TABS: { key: PlaceKind; label: string }[] = [
  { key: "tourist_attraction", label: "Attractions" },
  { key: "lodging", label: "Hotels" },
  { key: "restaurant", label: "Restaurants" },
];

export function TripMap({ destination }: { destination: string }) {
  const { loaded, error: scriptError } = useGoogleMapsScript();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [activeKind, setActiveKind] = useState<PlaceKind>("tourist_attraction");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<google.maps.LatLng | null>(null);

  // Geocode destination + init map
  useEffect(() => {
    if (!loaded || !mapContainerRef.current) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destination }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) {
        setError(`Could not locate "${destination}" on the map.`);
        return;
      }
      const location = results[0].geometry.location;
      setCenter(location);

      const map = new google.maps.Map(mapContainerRef.current!, {
        center: location,
        zoom: 13,
      });
      mapRef.current = map;

      new google.maps.Marker({
        map,
        position: location,
        title: destination,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#d97b4f",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, destination]);

  // Nearby search whenever tab or center changes
  useEffect(() => {
    if (!loaded || !center || !mapRef.current) return;

    const service = new google.maps.places.PlacesService(mapRef.current);
    service.nearbySearch(
      { location: center, radius: 3000, type: activeKind },
      (results, status) => {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setPlaces([]);
          return;
        }

        const nearby: NearbyPlace[] = [];
        results.slice(0, 10).forEach((place) => {
          if (!place.geometry?.location) return;
          nearby.push({
            name: place.name ?? "Unknown",
            rating: place.rating,
            vicinity: place.vicinity,
            location: place.geometry.location,
          });
          const marker = new google.maps.Marker({
            map: mapRef.current!,
            position: place.geometry.location,
            title: place.name,
          });
          markersRef.current.push(marker);
        });
        setPlaces(nearby);
      }
    );
  }, [loaded, center, activeKind]);

  if (scriptError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-500">{scriptError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Map & nearby places</CardTitle>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardHeader>
      <CardContent>
        <div ref={mapContainerRef} className="h-80 w-full rounded-md bg-muted" />
        {!loaded && <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>}

        <div className="mt-4 flex gap-2">
          {PLACE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveKind(tab.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                activeKind === tab.key
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {places.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results yet.</p>
          ) : (
            places.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.vicinity && <p className="text-xs text-muted-foreground">{p.vicinity}</p>}
                </div>
                {p.rating != null && <span className="text-xs text-muted-foreground">★ {p.rating}</span>}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
