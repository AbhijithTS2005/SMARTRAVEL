'use client';

import { X, MapPin, ThermometerSun, Droplets, Cloud, AlertTriangle } from 'lucide-react';
import { type Alternative, type RecommendationAnalysis } from '@/services/recommendation';
import type { Destination } from '@/types';

interface DestinationAnalysisDrawerProps {
  isOpen: boolean;
  destination: Destination | null;
  analysis: RecommendationAnalysis | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSelectAlternative: (destinationId: number) => void;
  onRetry: () => void;
}

export default function DestinationAnalysisDrawer({
  isOpen,
  destination,
  analysis,
  loading,
  error,
  onClose,
  onSelectAlternative,
  onRetry,
}: DestinationAnalysisDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity lg:backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {destination?.name || 'Analyzing...'}
              </h2>
              {destination && (
                <p className="text-indigo-100 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {destination.district}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Instant Match Score Display */}
          {destination && (
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold">
                  {loading ? destination.match_score || '...' : analysis?.match_percentage || destination.match_score || '...'}%
                </div>
                <div className="text-sm text-indigo-100 mt-1">
                  {loading ? 'Match Score' : (analysis?.compatibility_level.emoji || '') + ' ' + (analysis?.compatibility_level.label || 'Match Score')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-4">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold text-lg mb-1">Analysis Failed</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !analysis && !error && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 h-24"></div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !loading && !error && (
            <>
              {/* Recommendation Message */}
              <div className={`p-4 rounded-lg border-l-4 ${
                analysis.is_recommended 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <p className="font-semibold text-gray-900 mb-2">
                  {analysis.recommendation_message}
                </p>
                {analysis.contextual_message && (
                  <p className="text-sm text-gray-700">
                    {analysis.contextual_message}
                  </p>
                )}
              </div>

              {/* Weather Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-indigo-600" />
                  Current Weather
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ThermometerSun className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysis.weather.temperature}°C
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ThermometerSun className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-600">Feels Like</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysis.weather.feels_like}°C
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Humidity</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysis.weather.humidity}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Conditions</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysis.weather.weather_main}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 text-center capitalize">
                  {analysis.weather.climate_type} Climate
                </div>
              </div>

              {/* Categorized Alternative Suggestions */}
              {(() => {
                const alts = analysis.alternatives;
                const forYou = alts?.for_you || [];
                const similarTravelers = alts?.similar_travelers || [];
                const fromTravelPlans = alts?.from_travel_plans || [];
                const hasAny = forYou.length > 0 || similarTravelers.length > 0 || fromTravelPlans.length > 0;
                if (!hasAny) return null;

                const renderAltCard = (alt: Alternative) => (
                  <button
                    key={alt.id}
                    onClick={() => onSelectAlternative(alt.id)}
                    className="w-full border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                          {alt.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{alt.reason}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {alt.primary_type && (
                            <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                              {alt.primary_type.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">🌡️ {alt.temperature}°C</span>
                          {alt.humidity !== undefined && (
                            <span className="text-xs text-gray-500">💧 {alt.humidity}%</span>
                          )}
                          <span className="text-xs text-gray-500">📍 ~{alt.distance_km} km</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {alt.match_score}%
                        </div>
                        <div className="text-xs text-gray-500">match</div>
                      </div>
                    </div>
                  </button>
                );

                return (
                  <div className="space-y-6">
                    {/* For You */}
                    {forYou.length > 0 && (
                      <div className="bg-white rounded-xl border border-green-200 p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                          <span className="text-xl">🎯</span>
                          For You
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">Best matches based on your preferences, closest first</p>
                        <div className="space-y-3">
                          {forYou.map(renderAltCard)}
                        </div>
                      </div>
                    )}

                    {/* Similar Travelers Pick */}
                    {similarTravelers.length > 0 && (
                      <div className="bg-white rounded-xl border border-purple-200 p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                          <span className="text-xl">👥</span>
                          Similar Travelers Pick
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">Loved by travelers with similar taste, closest first</p>
                        <div className="space-y-3">
                          {similarTravelers.map(renderAltCard)}
                        </div>
                      </div>
                    )}

                    {/* From Your Travel Plans */}
                    {fromTravelPlans.length > 0 && (
                      <div className="bg-white rounded-xl border border-blue-200 p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                          <span className="text-xl">📋</span>
                          From Your Travel Plans
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">Destinations from your planned trips, closest first</p>
                        <div className="space-y-3">
                          {fromTravelPlans.map(renderAltCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
