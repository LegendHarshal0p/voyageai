export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type TripStatus = "planning" | "upcoming" | "active" | "completed" | "cancelled";

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image_url: string | null;
  budget_total: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  summary: string | null;
}

export interface Activity {
  id: string;
  trip_day_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  location: string | null;
  cost: number | null;
  category: string;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string | null;
  spent_at: string;
}

export interface AiHistoryEntry {
  id: string;
  user_id: string;
  trip_id: string | null;
  prompt: string;
  response: string;
  feature: string;
  created_at: string;
}

export interface Hotel {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  price_per_night: number | null;
  confirmation_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  trip_id: string;
  name: string;
  cuisine: string | null;
  address: string | null;
  reservation_time: string | null;
  price_range: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface PackingListItem {
  id: string;
  trip_id: string;
  item: string;
  category: string;
  is_packed: boolean;
  created_at: string;
}

export type DocumentCategory =
  | "passport"
  | "visa"
  | "ticket"
  | "hotel_booking"
  | "receipt"
  | "map"
  | "photo"
  | "other";

export interface TravelDocument {
  id: string;
  trip_id: string | null;
  user_id: string;
  file_path: string;
  file_name: string;
  category: DocumentCategory;
  extracted_text: string | null;
  ai_summary: string | null;
  created_at: string;
}

export type NotificationType =
  | "trip_reminder"
  | "packing_reminder"
  | "trip_shared"
  | "ai_ready"
  | "budget_alert"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  trip_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export type FavoriteType = "destination" | "hotel" | "restaurant";

export interface Favorite {
  id: string;
  user_id: string;
  type: FavoriteType;
  reference_id: string | null;
  label: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type DestinationPriority = "someday" | "this_year" | "next_trip";

export interface Destination {
  id: string;
  user_id: string;
  name: string;
  country: string | null;
  notes: string | null;
  priority: DestinationPriority;
  target_month: string | null;
  created_at: string;
}

// Minimal Supabase generated-types shape used by the typed client.
// Extend this as you add tables (hotels, restaurants, packing_lists, documents, etc.)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> };
      trip_days: { Row: TripDay; Insert: Partial<TripDay>; Update: Partial<TripDay> };
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      hotels: { Row: Hotel; Insert: Partial<Hotel>; Update: Partial<Hotel> };
      restaurants: { Row: Restaurant; Insert: Partial<Restaurant>; Update: Partial<Restaurant> };
      packing_list_items: {
        Row: PackingListItem;
        Insert: Partial<PackingListItem>;
        Update: Partial<PackingListItem>;
      };
      documents: {
        Row: TravelDocument;
        Insert: Partial<TravelDocument>;
        Update: Partial<TravelDocument>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
      };
      favorites: { Row: Favorite; Insert: Partial<Favorite>; Update: Partial<Favorite> };
      destinations: { Row: Destination; Insert: Partial<Destination>; Update: Partial<Destination> };
      ai_history: {
        Row: AiHistoryEntry;
        Insert: Partial<AiHistoryEntry>;
        Update: Partial<AiHistoryEntry>;
      };
    };
  };
}
