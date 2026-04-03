<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DestinationController extends Controller
{
    /**
     * Get all destinations with optional filters.
     */
    public function index(Request $request)
    {
        // Validation for query parameters
        $validator = Validator::make($request->all(), [
            'primary_type' => 'sometimes|in:adventure,hill_station,beach,nature,cultural,wildlife',
            'district' => 'sometimes|string|max:100',
            'min_budget' => 'sometimes|numeric|min:0',
            'max_budget' => 'sometimes|numeric|min:0',
            'crowd_level' => 'sometimes|in:low,medium,high',
            'search' => 'sometimes|string|max:255',
            'per_page' => 'sometimes|integer|min:1|max:500',
            'page' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid query parameters',
                'errors' => $validator->errors()
            ], 422);
        }

        // Start query
        $query = Destination::with(['climateData', 'activities'])
            ->where('is_active', true);

        // Apply filters
        if ($request->has('primary_type')) {
            $query->where('primary_type', $request->primary_type);
        }

        if ($request->has('district')) {
            $query->where('district', 'LIKE', '%' . $request->district . '%');
        }

        if ($request->has('min_budget')) {
            $query->where('avg_budget_max', '>=', $request->min_budget);
        }

        if ($request->has('max_budget')) {
            $query->where('avg_budget_min', '<=', $request->max_budget);
        }

        if ($request->has('crowd_level')) {
            $query->where('crowd_level', $request->crowd_level);
        }

        // Search by name or district
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('district', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'popularity_score');
        $sortOrder = $request->input('sort_order', 'desc');

        if (in_array($sortBy, ['name', 'popularity_score', 'avg_budget_min', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('popularity_score', 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $destinations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Destinations retrieved successfully',
            'data' => [
                'destinations' => $destinations->items(),
                'pagination' => [
                    'current_page' => $destinations->currentPage(),
                    'per_page' => $destinations->perPage(),
                    'total' => $destinations->total(),
                    'last_page' => $destinations->lastPage(),
                    'from' => $destinations->firstItem(),
                    'to' => $destinations->lastItem(),
                ]
            ],
            'filters_applied' => $request->only([
                'primary_type',
                'district',
                'min_budget',
                'max_budget',
                'crowd_level',
                'search'
            ])
        ]);
    }

    /**
     * Get a single destination by ID.
     */
    public function show(Request $request, $id)
    {
        $destination = Destination::with([
            'climateData',
            'activities',
            'disasterAlerts' => function ($q) {
                $q->where('is_active', true)->latest()->limit(5);
            }
        ])
            ->where('is_active', true)
            ->find($id);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found',
            ], 404);
        }

        // Record view interaction for behavior learning
        if ($user = $request->user()) {
            try {
                app(\App\Services\RecommendationEngine::class)
                    ->recordInteraction($user->id, $destination->id, 'view');
            } catch (\Exception $e) {
                // Don't fail the request if tracking fails
            }
        }

        // Fetch live weather data
        $liveWeather = null;
        $travelTips = [];
        $bestTimeToVisit = null;

        try {
            $weatherService = app(\App\Services\OpenWeatherService::class);
            $weather = $weatherService->getCurrentWeather(
                (float) $destination->latitude,
                (float) $destination->longitude
            );

            if ($weather) {
                $temp = $weather['temperature'] ?? null;
                $humidity = $weather['humidity'] ?? null;

                $liveWeather = [
                    'temperature' => $temp,
                    'feels_like' => $weather['feels_like'] ?? null,
                    'humidity' => $humidity,
                    'description' => $weather['description'] ?? $weather['weather_description'] ?? '',
                    'wind_speed' => $weather['wind_speed'] ?? null,
                ];

                // AQI data
                $aqi = $weatherService->getAirQuality(
                    (float) $destination->latitude,
                    (float) $destination->longitude
                );
                if ($aqi) {
                    $liveWeather['aqi_value'] = $aqi['aqi_value'] ?? null;
                    $liveWeather['aqi_status'] = $aqi['aqi_status'] ?? 'Unknown';
                }

                // Generate travel tips based on live conditions
                if ($temp !== null) {
                    if ($temp > 35) {
                        $travelTips[] = 'Extreme heat — carry plenty of water and sunscreen';
                    } elseif ($temp > 30) {
                        $travelTips[] = 'Warm weather — light clothing and hydration recommended';
                    } elseif ($temp < 15) {
                        $travelTips[] = 'Cold weather — pack warm layers and jackets';
                    } else {
                        $travelTips[] = 'Pleasant temperature — great for outdoor activities';
                    }
                }

                if ($humidity !== null) {
                    if ($humidity > 80) {
                        $travelTips[] = 'Very humid — carry breathable fabrics and extra clothes';
                    } elseif ($humidity < 30) {
                        $travelTips[] = 'Dry conditions — use moisturizer and stay hydrated';
                    }
                }

                $aqiVal = $liveWeather['aqi_value'] ?? null;
                if ($aqiVal && $aqiVal > 150) {
                    $travelTips[] = 'Poor air quality — consider wearing a mask outdoors';
                } elseif ($aqiVal && $aqiVal > 100) {
                    $travelTips[] = 'Moderate air quality — sensitive groups should take precautions';
                }

                // Best time to visit based on current temp
                if ($temp !== null) {
                    $bestTimeToVisit = match (true) {
                        $temp < 15 => 'March to May (warmer months)',
                        $temp >= 15 && $temp < 25 => 'October to February (pleasant weather)',
                        $temp >= 25 && $temp < 32 => 'November to February (cooler months)',
                        default => 'October to January (avoid peak heat)',
                    };
                }
            }
        } catch (\Exception $e) {
            Log::debug("Weather fetch failed for destination {$id}: " . $e->getMessage());
        }

        if (empty($travelTips)) {
            $travelTips[] = 'Conditions look favorable for travel!';
        }

        // Add budget-based tip
        if ($destination->avg_budget_max > 5000) {
            $travelTips[] = 'Premium destination — consider booking accommodations in advance';
        } elseif ($destination->avg_budget_min < 1500) {
            $travelTips[] = 'Budget-friendly — great value for backpackers and solo travelers';
        }

        // Type-based tips
        $typeTips = [
            'beach' => 'Pack sunscreen, swimwear, and water-resistant gear',
            'hill_station' => 'Mountain roads may be winding — carry motion sickness remedy',
            'adventure' => 'Wear sturdy footwear and carry a basic first-aid kit',
            'wildlife' => 'Maintain distance from wildlife and carry binoculars',
            'cultural' => 'Dress modestly when visiting temples and heritage sites',
            'nature' => 'Stay on marked trails and carry insect repellent',
        ];
        if (isset($typeTips[$destination->primary_type])) {
            $travelTips[] = $typeTips[$destination->primary_type];
        }

        return response()->json([
            'success' => true,
            'message' => 'Destination retrieved successfully',
            'data' => $destination,
            'live_weather' => $liveWeather,
            'best_time_to_visit' => $bestTimeToVisit,
            'travel_tips' => $travelTips,
        ]);
    }

    /**
     * Get photos for a destination.
     * Combines Wikimedia (accurate hero) + Pexels (gallery fill) for best results.
     */
    public function getPhotos($id)
    {
        $destination = Destination::where('is_active', true)->find($id);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found',
            ], 404);
        }

        $desiredCount = 5; // 1 hero + 4 gallery
        $photos = [];
        $sources = [];

        // 1. Try Wikimedia/Wikipedia (actual real photos of the place)
        try {
            $wikimediaService = app(\App\Services\WikimediaService::class);
            $wikiPhotos = $wikimediaService->getDestinationPhotos($destination, $desiredCount);
            if (!empty($wikiPhotos)) {
                $photos = array_merge($photos, $wikiPhotos);
                $sources[] = 'wikimedia';
            }
        } catch (\Exception $e) {
            Log::debug("WikimediaService error for dest {$id}: " . $e->getMessage());
        }

        // 2. Try Mapillary (street-level imagery) if we need more photos
        if (count($photos) < $desiredCount) {
            try {
                $mapillaryService = app(\App\Services\MapillaryService::class);
                if ($mapillaryService->isConfigured()) {
                    $mapPhotos = $mapillaryService->getDestinationPhotos($destination, $desiredCount - count($photos));
                    if (!empty($mapPhotos)) {
                        $photos = array_merge($photos, $mapPhotos);
                        $sources[] = 'mapillary';
                    }
                }
            } catch (\Exception $e) {
                Log::debug("MapillaryService error for dest {$id}: " . $e->getMessage());
            }
        }

        // 3. Fill remaining slots with Pexels (stock photos for gallery)
        if (count($photos) < $desiredCount) {
            try {
                $pexelsService = app(\App\Services\PexelsService::class);
                $pexelsPhotos = $pexelsService->getDestinationPhotos($destination);
                if (!empty($pexelsPhotos)) {
                    // Only add enough to reach desired count
                    $needed = $desiredCount - count($photos);
                    $photos = array_merge($photos, array_slice($pexelsPhotos, 0, $needed));
                    $sources[] = 'pexels';
                }
            } catch (\Exception $e) {
                Log::debug("PexelsService error for dest {$id}: " . $e->getMessage());
            }
        }

        // 4. Fallback: Use database-stored images
        if (empty($photos) && !empty($destination->images)) {
            foreach ($destination->images as $imageUrl) {
                $photos[] = [
                    'original' => $imageUrl,
                    'large' => $imageUrl,
                    'medium' => $imageUrl,
                    'small' => $imageUrl,
                ];
            }
            $sources[] = 'database';
        }

        return response()->json([
            'success' => true,
            'message' => 'Photos retrieved successfully',
            'data' => [
                'destination_id' => $destination->id,
                'destination_name' => $destination->name,
                'photos' => array_slice($photos, 0, $desiredCount),
                'source' => implode('+', $sources) ?: 'none',
            ]
        ]);
    }

    /**
     * Get all unique districts.
     */
    public function districts()
    {
        $districts = Destination::where('is_active', true)
            ->distinct()
            ->pluck('district')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Districts retrieved successfully',
            'data' => $districts
        ]);
    }

    /**
     * Get destination statistics.
     */
    public function stats()
    {
        $stats = [
            'total_destinations' => Destination::where('is_active', true)->count(),
            'by_type' => Destination::where('is_active', true)
                ->selectRaw('primary_type, COUNT(*) as count')
                ->groupBy('primary_type')
                ->pluck('count', 'primary_type'),
            'by_district' => Destination::where('is_active', true)
                ->selectRaw('district, COUNT(*) as count')
                ->groupBy('district')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'district'),
            'budget_range' => [
                'min' => Destination::where('is_active', true)->min('avg_budget_min'),
                'max' => Destination::where('is_active', true)->max('avg_budget_max'),
            ],
        ];

        return response()->json([
            'success' => true,
            'message' => 'Statistics retrieved successfully',
            'data' => $stats
        ]);
    }
}
