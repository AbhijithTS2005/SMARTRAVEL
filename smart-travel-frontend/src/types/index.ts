export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Destination {
  id: number;
  name: string;
  slug: string;
  district: string;
  primary_type: string;
  images: string[];
  avg_budget_min: number;
  avg_budget_max: number;
  popularity_score: number;
  latitude: number;
  longitude: number;
  description?: string;
  match_score?: number; // Optional - populated by recommendation system
  crowd_level?: string;
  climateData?: ClimateData[];
  activities?: DestinationActivity[];
}

export interface ClimateData {
  id: number;
  destination_id: number;
  season: string;
  avg_temp_min: number;
  avg_temp_max: number;
  rainfall_mm: number;
  weather_condition: string;
  avg_aqi: number;
}

export interface DestinationActivity {
  id: number;
  destination_id: number;
  activity_name: string;
  activity_type: string;
  description: string;
}

export interface Recommendation extends Destination {
  match_score: number;
  live_aqi: string;
  temperature?: number;
  has_alerts: boolean;
  hybrid_score?: number;
  recommendation_reason?: string;
  recommendation_type?: 'content' | 'collaborative' | 'trending' | 'recent';
}

export interface NearbyRecommendation {
  id: number;
  name: string;
  slug: string;
  district: string;
  primary_type: string;
  images: string[];
  popularity_score: number;
  distance_km: number;
}

export interface NearbyResponse {
  type: 'nearby_matching' | 'nearby_attractions';
  label: string;
  is_match: boolean;
  match_score: number;
  destinations: NearbyRecommendation[];
}

export interface PeopleAlsoLikeItem {
  id: number;
  name: string;
  slug: string;
  district: string;
  primary_type: string;
  images: string[];
  popularity_score: number;
  co_occurrence_score: number;
  reason: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  travel_types: string[];
  preferred_climate: string;
  min_budget: number;
  max_budget: number;
  preferred_min_temp: number;
  preferred_max_temp: number;
  crowd_preference: string;
  air_quality_sensitive: boolean;
}

export interface TravelPlan {
  id: number;
  user_id: number;
  destination_id: number;
  start_date: string;
  end_date: string;
  status: 'planned' | 'ongoing' | 'completed';
  monitoring_active: boolean;
  destination?: Destination;
}

export interface Notification {
  id: string;
  type: string;
  data: {
    severity: string;
    destination: string;
    message: string;
    detailed_conditions: unknown;
    safer_alternatives?: unknown[];
  };
  read_at: string | null;
  created_at: string;
}
