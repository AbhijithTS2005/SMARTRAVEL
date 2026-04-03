import api from './api';

export interface RecommendationAnalysisRequest {
  location: string;
  lat: number;
  lng: number;
}

export interface CompatibilityLevel {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  emoji: string;
  color: string;
}

export interface Breakdown {
  temperature: {
    score: number;
    actual: number;
    user_range: [number, number];
    status: string;
    message: string;
  };
  humidity: {
    score: number;
    actual: number;
    user_range: [number, number];
    status: string;
    message: string;
  };
  climate: {
    score: number;
    actual: string;
    user_pref: string;
    status: string;
    message: string;
  };
}

export interface Alternative {
  id: number;
  name: string;
  district: string;
  primary_type: string;
  slug: string;
  match_score: number;
  temperature: number;
  humidity: number;
  climate_type: string;
  reason: string;
  distance_km: number;
  images: string[];
  live_data: boolean;
}

export interface RecommendationAnalysis {
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  weather: {
    temperature: number;
    feels_like: number;
    humidity: number;
    weather_main: string;
    weather_description: string;
    climate_type: string;
    live_data: boolean;
  };
  is_recommended: boolean;
  match_percentage: number;
  compatibility_level: CompatibilityLevel;
  breakdown: Breakdown;
  recommendation_message: string;
  contextual_message: string;
  alternatives: {
    for_you: Alternative[];
    similar_travelers: Alternative[];
    from_travel_plans: Alternative[];
  };
}

const recommendationService = {
  async analyzeDestination(
    data: RecommendationAnalysisRequest
  ): Promise<RecommendationAnalysis> {
    const response = await api.post('/recommend/analyze', data);
    return response.data.data;
  },
};

export default recommendationService;
