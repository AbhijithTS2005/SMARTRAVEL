import api from './api';

export interface LocationAnalysisRequest {
  latitude: number;
  longitude: number;
}

export interface LocationAnalysis {
  suitable: boolean;
  match_score: number;
  location: {
    name: string;
    district: string | null;
    state: string | null;
    country: string | null;
  };
  destination?: {
    id: number;
    name?: string;
    primary_type?: string;
    photo_url: string | null;
  } | null;
  weather: {
    temperature: number;
    feels_like: number;
    humidity: number;
    description: string;
    climate_type: string;
    aqi_status?: string;
    aqi_value?: number;
    alerts_count?: number;
  };
  analysis?: Array<{
    factor: string;
    score: number;
    max: number;
    weight: number;
    detail: string;
  }>;
  reasons?: string[];
  location_info?: {
    estimated_budget_min: number;
    estimated_budget_max: number;
    budget_label: string;
    best_season: string;
    tips: string[];
    photo_url: string | null;
  };
  alternatives?: {
    for_you: AlternativeDestination[];
    similar_travelers: AlternativeDestination[];
    from_travel_plans: AlternativeDestination[];
  };
}

export interface AlternativeDestination {
  id: number;
  name: string;
  district: string;
  primary_type: string;
  state: string;
  photo_url: string;
  match_score: number;
  distance_km: number | null;
  temperature: number;
  climate_type: string;
  why_better: string;
}

class LocationAnalysisService {
  async analyzeLocation(data: LocationAnalysisRequest): Promise<LocationAnalysis> {
    const response = await api.post('/locations/analyze', data);
    return response.data;
  }
}

const locationAnalysisService = new LocationAnalysisService();
export default locationAnalysisService;
