'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Thermometer, Droplets, Cloud, CheckCircle2, XCircle, Wind, AlertTriangle, Tag, Wallet, Leaf, BarChart3, Calendar, Lightbulb, Plane, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { travelPlansService, type CreateTravelPlanData } from '@/services/travelPlans';
import { destinationsService } from '@/services/destinations';

interface AnalysisFactor {
  factor: string;
  score: number;
  max: number;
  weight: number;
  detail: string;
}

interface LocationAnalysis {
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
  analysis?: AnalysisFactor[];
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
    for_you: Array<{
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
    }>;
    similar_travelers: Array<{
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
    }>;
    from_travel_plans: Array<{
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
    }>;
  };
}

interface LocationAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: LocationAnalysis | null;
  isLoading: boolean;
  error: string | null;
  locationCoords?: { lat: number; lng: number } | null;
}

function getFactorIcon(factor: string) {
  switch (factor) {
    case 'Temperature': return <Thermometer className="w-4 h-4" />;
    case 'Climate': return <Cloud className="w-4 h-4" />;
    case 'Humidity': return <Droplets className="w-4 h-4" />;
    case 'Travel Type': return <Tag className="w-4 h-4" />;
    case 'Budget': return <Wallet className="w-4 h-4" />;
    case 'Air Quality': return <Leaf className="w-4 h-4" />;
    case 'Weather Alerts': return <AlertTriangle className="w-4 h-4" />;
    default: return <BarChart3 className="w-4 h-4" />;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-yellow-700';
  if (score >= 40) return 'text-orange-700';
  return 'text-red-700';
}

export default function LocationAnalysisDrawer({
  isOpen,
  onClose,
  analysis,
  isLoading,
  error,
  locationCoords,
}: LocationAnalysisDrawerProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planCreated, setPlanCreated] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [altPhotos, setAltPhotos] = useState<Record<number, any>>({});
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const today = new Date().toISOString().split('T')[0];

  // Fetch Pexels photos for alternatives (all categories)
  useEffect(() => {
    if (!analysis?.alternatives) return;
    const allAlts = [
      ...(analysis.alternatives.for_you || []),
      ...(analysis.alternatives.similar_travelers || []),
      ...(analysis.alternatives.from_travel_plans || []),
    ];
    if (allAlts.length === 0) return;
    const fetchPhotos = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photosMap: Record<number, any> = {};
      await Promise.all(
        allAlts.map(async (alt) => {
          try {
            const data = await destinationsService.getDestinationPhotos(alt.id);
            if (data?.photos?.length > 0) {
              photosMap[alt.id] = data.photos[0];
            }
          } catch { /* no photo */ }
        })
      );
      setAltPhotos(photosMap);
    };
    fetchPhotos();
  }, [analysis?.alternatives]);

  const handleCreatePlan = async () => {
    if (!startDate || !endDate) return;
    setIsCreatingPlan(true);
    setPlanError(null);
    try {
      const data: CreateTravelPlanData = {
        start_date: startDate,
        end_date: endDate,
      };
      if (analysis?.destination?.id) {
        data.destination_id = analysis.destination.id;
      } else if (locationCoords) {
        data.latitude = locationCoords.lat;
        data.longitude = locationCoords.lng;
        data.location_name = analysis?.location?.name || 'Custom Location';
      }
      await travelPlansService.create(data);
      setPlanCreated(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPlanError(e.response?.data?.message || 'Failed to create travel plan');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setPlanCreated(false);
    setPlanError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl transform transition-transform">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-2xl font-bold text-gray-900">Location Analysis</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-700">Analyzing location...</p>
                  <p className="text-sm text-gray-500 mt-2">Checking weather, air quality & suitability</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full p-6">
                <div className="bg-red-50 rounded-xl p-6 max-w-md text-center">
                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && analysis && (
              <div className="p-6 space-y-6">
                {/* Location Header */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <MapPin className="w-5 h-5" />
                        <span className="text-sm font-medium">Selected Location</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {analysis.location.name}
                      </h3>
                      <p className="text-gray-600">
                        {[analysis.location.district, analysis.location.state, analysis.location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-lg ${
                        analysis.match_score >= 70
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {analysis.match_score}%
                    </div>
                  </div>
                </div>

                {/* Suitable / Not Suitable Banner */}
                {analysis.suitable ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <h3 className="text-xl font-bold text-green-900">Great Choice!</h3>
                    </div>
                    <p className="text-green-800 mb-4">
                      This location is <span className="font-semibold">{analysis.match_score}% suitable</span> for
                      your preferences.
                    </p>
                    {analysis.destination?.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          router.push(`/destinations/${analysis.destination!.id}`);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        View Details & Budget
                      </button>
                    ) : analysis.location_info ? (
                      <div className="mt-4 space-y-3">
                        {analysis.location_info.photo_url && (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden">
                            <Image
                              src={analysis.location_info.photo_url}
                              alt={analysis.location.name}
                              fill
                              unoptimized
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <p className="text-white text-sm font-semibold">{analysis.location.name}</p>
                              <p className="text-white/70 text-xs">
                                {[analysis.location.district, analysis.location.state].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 bg-green-100/60 rounded-lg p-3">
                          <Wallet className="w-5 h-5 text-green-700 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-green-600 font-medium">Estimated Budget</p>
                            <p className="text-sm font-bold text-green-900">{analysis.location_info.budget_label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-green-100/60 rounded-lg p-3">
                          <Calendar className="w-5 h-5 text-green-700 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-green-600 font-medium">Best Season to Visit</p>
                            <p className="text-sm font-bold text-green-900">{analysis.location_info.best_season}</p>
                          </div>
                        </div>
                        {analysis.location_info.tips.length > 0 && (
                          <div className="bg-green-100/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-green-700" />
                              <p className="text-xs text-green-600 font-medium">Travel Tips</p>
                            </div>
                            <ul className="space-y-1">
                              {analysis.location_info.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-green-700 italic">
                        ℹ️ This location is not yet in our database.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <h3 className="text-xl font-bold text-red-900">Not Ideal for Your Preferences</h3>
                    </div>
                    <p className="text-red-800 mb-4">
                      This location is only <span className="font-semibold">{analysis.match_score}% suitable</span>.
                    </p>

                    {analysis.reasons && analysis.reasons.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="font-semibold text-red-900">Why not suitable:</p>
                        <ul className="space-y-1">
                          {analysis.reasons.map((reason, index) => (
                            <li key={index} className="text-red-700 flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Breakdown */}
                {analysis.analysis && analysis.analysis.length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Score Breakdown
                    </h4>
                    <div className="space-y-4">
                      {analysis.analysis.map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="text-gray-500">{getFactorIcon(item.factor)}</span>
                              <span className="font-medium text-sm">{item.factor}</span>

                            </div>
                            <span className={`text-sm font-bold ${getScoreTextColor(item.score)}`}>
                              {item.score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                            <div
                              className={`h-2.5 rounded-full transition-all ${getScoreColor(item.score)}`}
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Weather & Environment */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Current Conditions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Thermometer className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Temperature</p>
                        <p className="text-xl font-bold text-gray-900">{analysis.weather.temperature}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Droplets className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Humidity</p>
                        <p className="text-xl font-bold text-gray-900">{analysis.weather.humidity}%</p>
                      </div>
                    </div>
                    {analysis.weather.aqi_status && (
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Wind className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Air Quality</p>
                          <p className="text-lg font-bold text-gray-900">{analysis.weather.aqi_status}</p>
                        </div>
                      </div>
                    )}
                    {analysis.weather.alerts_count !== undefined && (
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${analysis.weather.alerts_count > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                          <AlertTriangle className={`w-6 h-6 ${analysis.weather.alerts_count > 0 ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Alerts</p>
                          <p className="text-lg font-bold text-gray-900">
                            {analysis.weather.alerts_count > 0 ? `${analysis.weather.alerts_count} Active` : 'None ✓'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Climate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysis.weather.climate_type} - {analysis.weather.description}
                    </p>
                  </div>
                </div>

                {/* Destination Preview — only for suitable locations with DB match */}
                {analysis.suitable && analysis.destination && (
                  <div className="bg-white border-2 border-indigo-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Destination Preview</h4>
                    <div className="flex gap-4">
                      <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        {analysis.destination?.photo_url ? (
                          <Image
                            src={analysis.destination.photo_url}
                            alt={analysis.location.name}
                            fill
                            unoptimized
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <MapPin className="w-12 h-12 text-indigo-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        {(() => {
                          const displayName = analysis.destination?.name || analysis.location.name || analysis.location.district || analysis.location.state || 'Unknown Location';
                          
                          return (
                            <>
                              <h5 className="font-bold text-gray-900 text-lg mb-1">{displayName}</h5>
                              {analysis.destination?.primary_type && (
                                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-2">
                                  {analysis.destination.primary_type}
                                </span>
                              )}
                              <p className="text-sm text-gray-600 mb-3">
                                {analysis.location.district && analysis.location.district !== displayName && `${analysis.location.district}, `}
                                {analysis.location.state}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const url = analysis.destination?.id
                                    ? `/destinations/${analysis.destination.id}`
                                    : `/destinations?search=${encodeURIComponent(displayName)}`;
                                  router.push(url);
                                }}
                                className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                              >
                                View Details
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Categorized Alternatives */}
                {!analysis.suitable && analysis.alternatives && (() => {
                  const { for_you = [], similar_travelers = [], from_travel_plans = [] } = analysis.alternatives;
                  const hasAny = for_you.length > 0 || similar_travelers.length > 0 || from_travel_plans.length > 0;
                  if (!hasAny) return null;

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const renderAltCard = (alt: any) => {
                    const pexelsPhoto = altPhotos[alt.id];
                    const imageUrl = pexelsPhoto?.medium || pexelsPhoto?.small || alt.photo_url || null;
                    return (
                      <div
                        key={alt.id}
                        className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                            {imageUrl && !failedImages.has(alt.id) ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={imageUrl}
                                alt={alt.name}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setFailedImages(prev => new Set(prev).add(alt.id));
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-indigo-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{alt.name}</h4>
                                <p className="text-sm text-gray-600">{alt.district}</p>
                              </div>
                              <div className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full">
                                {alt.match_score}%
                              </div>
                            </div>
                            <p className="text-sm text-indigo-600 mb-2">{alt.why_better}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                {alt.primary_type?.replace('_', ' ')}
                              </span>
                              {alt.distance_km != null && (
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                  📍 {alt.distance_km} km away
                                </span>
                              )}
                              <span className="text-xs text-gray-500">🌡️ {alt.temperature}°C</span>
                              <span className="text-xs text-gray-500">☁️ {alt.climate_type}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(`/destinations/${alt.id}`);
                              }}
                              className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      {/* For You */}
                      {for_you.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🎯</span>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">For You</h3>
                              <p className="text-sm text-gray-600">Best matches based on your preferences, closest first</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {for_you.map(renderAltCard)}
                          </div>
                        </div>
                      )}

                      {/* Similar Travelers Pick */}
                      {similar_travelers.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">👥</span>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Similar Travelers Pick</h3>
                              <p className="text-sm text-gray-600">Loved by travelers with similar taste, closest first</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {similar_travelers.map(renderAltCard)}
                          </div>
                        </div>
                      )}

                      {/* From Your Travel Plans */}
                      {from_travel_plans.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">📋</span>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">From Your Travel Plans</h3>
                              <p className="text-sm text-gray-600">Destinations from your planned trips, closest first</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {from_travel_plans.map(renderAltCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* ======== Let's Go Section (only for suitable locations) ======== */}
                {analysis.suitable && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Plane className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Plan Your Trip</h4>
                      <p className="text-sm text-gray-600">Create a travel plan & get real-time alerts</p>
                    </div>
                  </div>

                  {planCreated ? (
                    <div className="bg-emerald-100 rounded-lg p-4 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-900">Travel plan created!</p>
                      <p className="text-sm text-emerald-700 mt-1">Monitoring is active. You&apos;ll receive notifications about conditions at this location.</p>
                      <button
                        onClick={() => router.push('/travel-plans')}
                        className="mt-3 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
                      >
                        View My Plans
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            min={today}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            min={startDate || today}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-emerald-400 focus:outline-none text-sm bg-white"
                          />
                        </div>
                      </div>

                      {planError && (
                        <p className="text-sm text-red-600 mb-3">{planError}</p>
                      )}

                      <button
                        onClick={handleCreatePlan}
                        disabled={!startDate || !endDate || isCreatingPlan}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                      >
                        {isCreatingPlan ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Plan...
                          </>
                        ) : (
                          <>
                            <Plane className="w-5 h-5" />
                            Let&apos;s Go!
                          </>
                        )}
                      </button>

                      <p className="text-xs text-gray-500 mt-2 text-center">
                        🔔 You&apos;ll receive weather & safety alerts for this destination
                      </p>
                    </>
                  )}
                </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

