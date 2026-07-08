import type { Database } from "./database";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export type Trip =
  Database["public"]["Tables"]["trips"]["Row"];

export type TripDay =
  Database["public"]["Tables"]["trip_days"]["Row"];

export type Activity =
  Database["public"]["Tables"]["activities"]["Row"];

export type Expense =
  Database["public"]["Tables"]["expenses"]["Row"];

export type Hotel =
  Database["public"]["Tables"]["hotels"]["Row"];

export type Restaurant =
  Database["public"]["Tables"]["restaurants"]["Row"];

export type PackingListItem =
  Database["public"]["Tables"]["packing_list_items"]["Row"];

export type TravelDocument =
  Database["public"]["Tables"]["documents"]["Row"];

export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];

export type Favorite =
  Database["public"]["Tables"]["favorites"]["Row"];

export type Destination =
  Database["public"]["Tables"]["destinations"]["Row"];

export type AiHistoryEntry =
  Database["public"]["Tables"]["ai_history"]["Row"];

export type FavoriteType =
  | "destination"
  | "hotel"
  | "restaurant";

export type DocumentCategory =
  | "passport"
  | "visa"
  | "ticket"
  | "hotel_booking"
  | "receipt"
  | "map"
  | "photo"
  | "other";

export type DestinationPriority =
  | "someday"
  | "this_year"
  | "next_trip";

export type TripStatus =
  | "planning"
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled";

export type NotificationType =
  | "trip_reminder"
  | "packing_reminder"
  | "trip_shared"
  | "ai_ready"
  | "budget_alert"
  | "system";