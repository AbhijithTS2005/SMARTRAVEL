<?php

namespace App\Services;

use App\Models\Destination;
use App\Models\TravelPlan;
use App\Models\UserInteraction;
use App\Models\UserPreference;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Unified Recommendation Engine
 *
 * Single source of truth for ALL scoring across the application.
 * Replaces: SuitabilityService, LocationAnalysisService, RecommendationService
 *
 * Hybrid Scoring:
 *   Content Score (55%): temp, type, climate, AQI, budget, alerts, humidity, behavior
 *   Collaborative Score (25%): user similarity based recommendations
 *   Trending Score (10%): popularity-based boost
 *   Diversity Bonus (10%): penalizes clustering of same type
 */
class RecommendationEngine
{
    public function __construct(
        private OpenWeatherService $weatherService,
        private PexelsService $pexelsService,
        private CollaborativeFilteringService $collaborativeService,
        private DestinationDiscoveryService $discoveryService
    ) {
    }

    // ──────────────────────────────────────────────
    // PUBLIC API — Only 3 entry points
    // ──────────────────────────────────────────────

    /**
     * Score a known destination for a user (dashboard, destination detail).
     * Uses full scoring with all factors including live weather.
     *
     * @return array{match_score: float, live_aqi: string, temperature: ?float, has_alerts: bool, weather: ?array}
     */
    public function scoreDestination(Destination $destination, UserPreference $preferences): array
    {
        $liveData = $this->fetchLiveData(
            (float) $destination->latitude,
            (float) $destination->longitude
        );

        $score = $this->calculateUnifiedScore($destination, $preferences, $liveData);

        return [
            'match_score' => round($score, 2),
            'live_aqi' => $liveData['air_quality']['aqi_status'] ?? 'Unknown',
            'temperature' => $liveData['weather']['temperature'] ?? null,
            'humidity' => $liveData['weather']['humidity'] ?? null,
            'has_alerts' => !empty($liveData['alerts']),
            'weather' => $liveData['weather'] ?? null,
        ];
    }

    /**
     * Score an arbitrary location (map click, search).
     * Tries to find matching DB destination for full scoring; falls back to weather-only.
     * Always returns the same response shape as the LocationAnalysisService did.
     */
    public function scoreLocation(float $lat, float $lng, UserPreference $preference, ?int $userId = null): array
    {
        // 1. Reverse geocode
        $locationData = $this->reverseGeocode($lat, $lng);

        // 2. Get live weather
        $weather = $this->weatherService->getWeatherByCoordinates($lat, $lng);
        if (!$weather) {
            throw new \Exception('Unable to fetch weather data for this location.');
        }

        // 3. Try to find matching destination in DB
        $destination = $this->findDestinationByLocation($locationData['name'], $locationData['district'], $lat, $lng);

        // 3.5 Auto-discover: create destination if not found
        if (!$destination && $locationData['name'] !== 'Unknown Location' && $locationData['name'] !== 'Location') {
            $destination = $this->discoveryService->discoverFromLocation(
                $locationData,
                $lat,
                $lng,
                $weather
            );
        }

        // 4. Calculate score — use FULL scoring if destination found, weather-only otherwise
        $liveData = $this->weatherService->getCompleteData($lat, $lng);

        if ($destination) {
            $matchScore = (int) round($this->calculateUnifiedScore($destination, $preference, $liveData));
        } else {
            $matchScore = $this->calculateWeatherOnlyScore($weather, $preference);
        }

        // 5. Determine climate type
        $climateType = $this->determineClimateType($weather['temperature']);

        // 6. Build full analysis breakdown
        $aqi = $liveData['air_quality'] ?? null;
        $alerts = $liveData['alerts'] ?? [];

        $analysisBreakdown = [
            [
                'factor' => 'Temperature',
                'score' => $this->scoreTempRaw($weather['temperature'], $preference),
                'max' => 100,
                'weight' => 25,
                'detail' => "{$weather['temperature']}°C (preferred: " . ($preference->preferred_min_temp ?? 20) . "-" . ($preference->preferred_max_temp ?? 30) . "°C)"
            ],
            [
                'factor' => 'Climate',
                'score' => (int) round($this->scoreClimateRaw($climateType, $preference)),
                'max' => 100,
                'weight' => 15,
                'detail' => "{$climateType}" . ($preference->climate_preference ? " (preferred: {$preference->climate_preference})" : '')
            ],
            [
                'factor' => 'Humidity',
                'score' => (int) round($this->scoreHumidityRaw($weather['humidity'])),
                'max' => 100,
                'weight' => 5,
                'detail' => "{$weather['humidity']}% (ideal: 40-70%)"
            ],
        ];

        // Add destination-specific factors if DB match found
        if ($destination) {
            $travelTypes = $preference->travel_types ?? [];
            $typeMatch = in_array($destination->primary_type, $travelTypes);
            $analysisBreakdown[] = [
                'factor' => 'Travel Type',
                'score' => $typeMatch ? 100 : 0,
                'max' => 100,
                'weight' => 15,
                'detail' => ucfirst($destination->primary_type) . ($typeMatch ? ' ✓ matches' : ' (you prefer: ' . implode(', ', $travelTypes) . ')')
            ];

            $analysisBreakdown[] = [
                'factor' => 'Budget',
                'score' => (int) round($this->scoreBudget($destination, $preference) * 10),
                'max' => 100,
                'weight' => 10,
                'detail' => "₹{$destination->avg_budget_min}-{$destination->avg_budget_max}" . ($preference->max_budget ? " (your max: ₹{$preference->max_budget})" : '')
            ];
        }

        $analysisBreakdown[] = [
            'factor' => 'Air Quality',
            'score' => (int) round($this->scoreAQI($aqi, $preference) * 10),
            'max' => 100,
            'weight' => 10,
            'detail' => ($aqi['aqi_status'] ?? 'Unknown') . (isset($aqi['aqi_value']) ? " (AQI: {$aqi['aqi_value']})" : '')
        ];

        $analysisBreakdown[] = [
            'factor' => 'Weather Alerts',
            'score' => (int) round($this->scoreAlerts($alerts) * 10),
            'max' => 100,
            'weight' => 10,
            'detail' => empty($alerts) ? 'No active alerts ✓' : count($alerts) . ' alert(s) active'
        ];

        // 7. Build response
        $suitable = $matchScore >= 70;

        $result = [
            'suitable' => $suitable,
            'match_score' => $matchScore,
            'location' => $locationData,
            'destination' => $destination ? [
                'id' => $destination->id,
                'name' => $destination->name,
                'primary_type' => $destination->primary_type,
                'photo_url' => $this->ensureValidPhotoUrl($destination),
            ] : null,
            'weather' => [
                'temperature' => $weather['temperature'],
                'feels_like' => $weather['feels_like'],
                'humidity' => $weather['humidity'],
                'description' => $weather['description'] ?? $weather['weather_description'] ?? '',
                'climate_type' => $climateType,
                'aqi_status' => $aqi['aqi_status'] ?? 'Unknown',
                'aqi_value' => $aqi['aqi_value'] ?? null,
                'alerts_count' => count($alerts),
            ],
            'analysis' => $analysisBreakdown,
        ];

        // 8. Add estimated location info for non-DB locations
        if (!$destination) {
            $result['location_info'] = $this->getEstimatedLocationInfo(
                $locationData,
                $weather,
                $climateType,
                $aqi,
                $alerts
            );
        }

        if (!$suitable) {
            $result['reasons'] = $this->getUnsuitableReasons($weather, $preference, $climateType, $destination, $liveData);
            $excludeId = $destination ? $destination->id : null;
            $result['alternatives'] = $this->findCategorizedAlternatives(
                $preference,
                $userId,
                $excludeId,
                $locationData['name'],
                $lat,
                $lng,
                3,
                $matchScore + 10  // Only show alternatives that score at least 10% higher than the selected location
            );
        }

        return $result;
    }

    /**
     * Get top recommended destinations for a user (dashboard).
     * Fetches live data and scores each destination using the unified formula.
     */
    public function getTopRecommendations(UserPreference $preferences, int $limit = 5): array
    {
        // Get candidates matching user types + budget
        $destinations = Destination::where('is_active', true)
            ->whereIn('primary_type', $preferences->travel_types)
            ->where('avg_budget_max', '<=', $preferences->max_budget * 1.2)
            ->orderBy('popularity_score', 'desc')
            ->limit($limit * 3)
            ->get();

        $scored = $destinations->map(function (Destination $dest) use ($preferences) {
            $result = $this->scoreDestination($dest, $preferences);

            return [
                'id' => $dest->id,
                'name' => $dest->name,
                'slug' => $dest->slug,
                'district' => $dest->district,
                'primary_type' => $dest->primary_type,
                'photo_url' => $this->ensureValidPhotoUrl($dest),
                'images' => $dest->images,
                'avg_budget_min' => $dest->avg_budget_min,
                'avg_budget_max' => $dest->avg_budget_max,
                'popularity_score' => $dest->popularity_score,
                'match_score' => $result['match_score'],
                'live_aqi' => $result['live_aqi'],
                'temperature' => $result['temperature'],
                'has_alerts' => $result['has_alerts'],
            ];
        });

        return $scored->sortByDesc('match_score')->take($limit)->values()->toArray();
    }

    /**
     * Get HYBRID recommendations blending content + collaborative + trending + diversity.
     * This is the main recommendation method for the dashboard.
     *
     * Final Score = (0.55 × Content) + (0.25 × CF) + (0.10 × Trending) + (0.10 × Diversity)
     */
    public function getHybridRecommendations(int $userId, UserPreference $preferences, int $limit = 10): array
    {
        // 1. Content-based candidates (broader pool)
        $contentCandidates = $this->getTopRecommendations($preferences, $limit * 2);

        // 2. Collaborative filtering candidates
        $cfCandidates = $this->collaborativeService->getCollaborativeRecommendations($userId, $limit);
        $cfScoreMap = [];
        $cfReasonMap = [];
        foreach ($cfCandidates as $cf) {
            $cfScoreMap[$cf['destination_id']] = $cf['cf_score'];
            $cfReasonMap[$cf['destination_id']] = $cf['reason'];
        }

        // 3. Add CF-only candidates (destinations not in content list) with content scoring
        $contentDestIds = array_column($contentCandidates, 'id');
        foreach ($cfCandidates as $cf) {
            if (!in_array($cf['destination_id'], $contentDestIds)) {
                $dest = Destination::find($cf['destination_id']);
                if ($dest && $dest->is_active) {
                    try {
                        $result = $this->scoreDestination($dest, $preferences);
                        $contentCandidates[] = [
                            'id' => $dest->id,
                            'name' => $dest->name,
                            'slug' => $dest->slug,
                            'district' => $dest->district,
                            'primary_type' => $dest->primary_type,
                            'photo_url' => $this->ensureValidPhotoUrl($dest),
                            'images' => $dest->images,
                            'avg_budget_min' => $dest->avg_budget_min,
                            'avg_budget_max' => $dest->avg_budget_max,
                            'popularity_score' => $dest->popularity_score,
                            'match_score' => $result['match_score'],
                            'live_aqi' => $result['live_aqi'],
                            'temperature' => $result['temperature'],
                            'has_alerts' => $result['has_alerts'],
                        ];
                    } catch (\Exception $e) {
                        continue;
                    }
                }
            }
        }

        // 4. Compute hybrid score for each candidate
        $maxPopularity = 100;
        $typeCounts = [];

        $hybridResults = array_map(function ($candidate) use ($cfScoreMap, $cfReasonMap, $maxPopularity, &$typeCounts) {
            $contentScore = $candidate['match_score'];
            $cfScore = $cfScoreMap[$candidate['id']] ?? 0;
            $trendingScore = ($candidate['popularity_score'] / $maxPopularity) * 100;

            // Diversity: penalize same type clustering
            $type = $candidate['primary_type'];
            $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;
            $diversityPenalty = max(0, 100 - (($typeCounts[$type] - 1) * 30));

            $hybridScore = ($contentScore * 0.55)
                + ($cfScore * 0.25)
                + ($trendingScore * 0.10)
                + ($diversityPenalty * 0.10);

            // Determine recommendation reason
            if ($cfScore >= 50) {
                $reason = $cfReasonMap[$candidate['id']] ?? 'Similar travelers enjoyed this';
                $reason_type = 'collaborative';
            } elseif ($trendingScore >= 80 && $contentScore < 70) {
                $reason = 'Trending destination';
                $reason_type = 'trending';
            } else {
                $reason = 'Matches your preferences';
                $reason_type = 'content';
            }

            return array_merge($candidate, [
                'hybrid_score' => round($hybridScore, 2),
                'recommendation_reason' => $reason,
                'recommendation_type' => $reason_type,
            ]);
        }, $contentCandidates);

        // 5. Sort by hybrid score
        usort($hybridResults, fn($a, $b) => $b['hybrid_score'] <=> $a['hybrid_score']);

        return array_slice($hybridResults, 0, $limit);
    }

    /**
     * Get "People Also Like" recommendations for a destination.
     */
    public function getPeopleAlsoLike(int $destinationId, int $limit = 6): array
    {
        return $this->collaborativeService->getPeopleAlsoLike($destinationId, $limit);
    }

    /**
     * Get proximity-based nearby recommendations.
     * Smart: shows matching destinations if place doesn't fit, nearby attractions if it does.
     */
    public function getNearbyRecommendations(int $destinationId, UserPreference $preferences): array
    {
        $destination = Destination::findOrFail($destinationId);

        // Score this destination against user preferences
        $result = $this->scoreDestination($destination, $preferences);
        $matchScore = $result['match_score'];

        return $this->collaborativeService->getNearbyRecommendations(
            $destination,
            $preferences,
            $matchScore,
            6
        );
    }

    /**
     * Refresh the user's learned profile from their interaction history.
     * Call this on login or periodically.
     */
    public function refreshLearnedProfile(int $userId, UserPreference $preferences): void
    {
        $interactions = UserInteraction::where('user_id', $userId)
            ->with('destination')
            ->recent(90) // Last 90 days
            ->get();

        if ($interactions->isEmpty()) {
            return;
        }

        // Build learned profile from interactions
        $typeCounts = [];
        $districtCounts = [];
        $totalWeight = 0;

        foreach ($interactions as $interaction) {
            $dest = $interaction->destination;
            if (!$dest)
                continue;

            // Weight by interaction type
            $weight = match ($interaction->interaction_type) {
                'favorite' => 5,
                'lets_go' => 4,
                'share' => 3,
                'view' => 1,
                'search' => 1,
                default => 1,
            };

            $typeCounts[$dest->primary_type] = ($typeCounts[$dest->primary_type] ?? 0) + $weight;
            $districtCounts[$dest->district] = ($districtCounts[$dest->district] ?? 0) + $weight;
            $totalWeight += $weight;
        }

        // Normalize to percentages
        $learnedProfile = [
            'preferred_types' => [],
            'preferred_districts' => [],
            'interaction_count' => $interactions->count(),
            'last_updated' => now()->toDateTimeString(),
        ];

        if ($totalWeight > 0) {
            arsort($typeCounts);
            foreach ($typeCounts as $type => $count) {
                $learnedProfile['preferred_types'][$type] = round($count / $totalWeight * 100, 1);
            }

            arsort($districtCounts);
            foreach (array_slice($districtCounts, 0, 5, true) as $district => $count) {
                $learnedProfile['preferred_districts'][$district] = round($count / $totalWeight * 100, 1);
            }
        }

        $preferences->update(['learned_profile' => $learnedProfile]);
    }

    /**
     * Record a user interaction for behavior learning.
     */
    public function recordInteraction(int $userId, int $destinationId, string $type, array $metadata = []): void
    {
        UserInteraction::create([
            'user_id' => $userId,
            'destination_id' => $destinationId,
            'interaction_type' => $type,
            'metadata' => $metadata,
        ]);
    }

    // ──────────────────────────────────────────────
    // UNIFIED SCORING — One formula, used everywhere
    // ──────────────────────────────────────────────

    /**
     * THE unified score formula. Every endpoint uses this.
     *
     * Temperature: 25pts | Travel Type: 15pts | Climate: 15pts
     * AQI: 10pts | Budget: 10pts | Alerts: 10pts | Humidity: 5pts | Behavior: 10pts
     * Total: 100pts
     */
    private function calculateUnifiedScore(Destination $destination, UserPreference $preferences, array $liveData): float
    {
        $score = 0;

        // TEMPERATURE (25 points)
        $score += $this->scoreTemperature($liveData['weather'] ?? null, $preferences);

        // TRAVEL TYPE (15 points)
        if (in_array($destination->primary_type, $preferences->travel_types ?? [])) {
            $score += 15;
        }

        // CLIMATE MATCH (15 points)
        if ($liveData['weather'] ?? null) {
            $climateType = $this->determineClimateType($liveData['weather']['temperature']);
            $score += $this->scoreClimateRaw($climateType, $preferences) * 0.15;
        } else {
            $score += 8;
        }

        // AQI (10 points)
        $score += $this->scoreAQI($liveData['air_quality'] ?? null, $preferences);

        // BUDGET (10 points)
        $score += $this->scoreBudget($destination, $preferences);

        // WEATHER ALERTS (10 points)
        $score += $this->scoreAlerts($liveData['alerts'] ?? []);

        // HUMIDITY (5 points)
        if ($liveData['weather'] ?? null) {
            $humidity = $liveData['weather']['humidity'] ?? 50;
            $score += $this->scoreHumidityRaw($humidity) * 0.05;
        } else {
            $score += 3;
        }

        // BEHAVIOR BOOST (10 points) — learned from user interactions
        $score += $this->calculateBehaviorBoost($destination, $preferences);

        return min(100, max(0, $score));
    }

    /**
     * Weather-only score for unknown locations (map clicks without DB match).
     * Uses only temp, climate, humidity — scaled proportionally to 0-100.
     */
    private function calculateWeatherOnlyScore(array $weather, UserPreference $preference): int
    {
        $tempScore = $this->scoreTempRaw($weather['temperature'], $preference);
        $climateType = $this->determineClimateType($weather['temperature']);
        $climateScore = $this->scoreClimateRaw($climateType, $preference);
        $humidityScore = $this->scoreHumidityRaw($weather['humidity']);

        // Proportional to unified weights: temp 25, climate 15, humidity 5 → ratios 55:33:12
        $weatherScore = ($tempScore * 0.55) + ($climateScore * 0.33) + ($humidityScore * 0.12);

        return (int) round($weatherScore);
    }

    // ──────────────────────────────────────────────
    // INDIVIDUAL SCORING COMPONENTS
    // ──────────────────────────────────────────────

    /** Temperature score (0-25 points) */
    private function scoreTemperature(?array $weather, UserPreference $preferences): float
    {
        if (!$weather || !isset($weather['temperature']))
            return 10;

        $temp = $weather['temperature'];
        $min = $preferences->preferred_min_temp ?? 20;
        $max = $preferences->preferred_max_temp ?? 30;

        if ($temp >= $min && $temp <= $max)
            return 25;

        $diff = $temp < $min ? ($min - $temp) : ($temp - $max);
        return max(0, 25 - ($diff * 3)); // -3 per degree outside range
    }

    /** Temperature raw score (0-100 scale) for analysis breakdown */
    private function scoreTempRaw(float $temp, UserPreference $preferences): int
    {
        $min = $preferences->preferred_min_temp ?? 20;
        $max = $preferences->preferred_max_temp ?? 30;

        if ($temp >= $min && $temp <= $max)
            return 100;

        $diff = $temp < $min ? ($min - $temp) : ($temp - $max);
        return max(0, (int) round(100 - ($diff * 10)));
    }

    /** Climate match raw score (0-100 scale) */
    private function scoreClimateRaw(string $climateType, UserPreference $preferences): float
    {
        $preferred = $preferences->climate_preference;
        if (!$preferred)
            return 80;

        if (strtolower($climateType) === strtolower($preferred))
            return 100;

        // Adjacent climates — bidirectional
        $adjacent = [
            'cold' => ['moderate'],
            'moderate' => ['cold', 'warm'],
            'warm' => ['moderate', 'hot'],
            'hot' => ['warm'],
        ];

        $cl = strtolower($climateType);
        $pl = strtolower($preferred);

        if (isset($adjacent[$pl]) && in_array($cl, $adjacent[$pl]))
            return 55;

        return 15; // Opposite climates
    }

    /** Humidity raw score (0-100 scale) */
    private function scoreHumidityRaw(float $humidity): float
    {
        if ($humidity >= 40 && $humidity <= 70)
            return 100;
        $deviation = $humidity < 40 ? (40 - $humidity) : ($humidity - 70);
        return max(0, 100 - ($deviation * 5));
    }

    /** AQI score (0-10 points) */
    private function scoreAQI(?array $airQuality, UserPreference $preferences): float
    {
        if (!$airQuality || !isset($airQuality['aqi_value']))
            return 5;

        $aqi = $airQuality['aqi_value'];
        $sensitive = $preferences->air_quality_sensitive ?? false;

        if ($aqi <= 50)
            return 10;
        if ($aqi <= 100)
            return $sensitive ? 6 : 8;
        if ($aqi <= 150)
            return $sensitive ? 3 : 5;
        if ($aqi <= 200)
            return $sensitive ? 1 : 3;
        return 0;
    }

    /** Budget score (0-10 points) */
    private function scoreBudget(Destination $destination, UserPreference $preferences): float
    {
        $maxBudget = $preferences->max_budget;
        if (!$maxBudget)
            return 5;

        if ($destination->avg_budget_max <= $maxBudget)
            return 10;
        if ($destination->avg_budget_min <= $maxBudget)
            return 6;
        return 2;
    }

    /** Weather alerts score (0-10 points) */
    private function scoreAlerts(array $alerts): float
    {
        if (empty($alerts))
            return 10;

        $count = count($alerts);
        if ($count === 1)
            return 4;
        if ($count === 2)
            return 2;
        return 0;
    }

    /** Behavior boost (0-10 points) — learned from user interaction history with time-decay */
    private function calculateBehaviorBoost(Destination $destination, UserPreference $preferences): float
    {
        $profile = $preferences->learned_profile;
        if (!$profile || empty($profile['preferred_types']))
            return 5; // Default neutral

        $boost = 0;

        // Type affinity (up to 6 points)
        $typeAffinity = $profile['preferred_types'][$destination->primary_type] ?? 0;
        $boost += min(6, $typeAffinity * 0.06); // 100% affinity = 6 points

        // District affinity (up to 4 points)
        $districtAffinity = $profile['preferred_districts'][$destination->district] ?? 0;
        $boost += min(4, $districtAffinity * 0.04); // 100% affinity = 4 points

        // Time-decay factor: reduce boost if profile is stale
        $lastUpdated = $profile['last_updated'] ?? null;
        if ($lastUpdated) {
            $daysSinceUpdate = now()->diffInDays($lastUpdated);
            $decayFactor = max(0.5, exp(-0.01 * $daysSinceUpdate)); // Half-life ~70 days
            $boost *= $decayFactor;
        }

        return min(10, max(0, $boost));
    }

    // ──────────────────────────────────────────────
    // LOCATION HELPERS
    // ──────────────────────────────────────────────

    private function determineClimateType(float $temp): string
    {
        if ($temp < 15)
            return 'Cold';
        if ($temp < 25)
            return 'Moderate';
        if ($temp < 32)
            return 'Warm';
        return 'Hot';
    }

    /** Reverse geocode coordinates to get location name */
    private function reverseGeocode(float $lat, float $lng): array
    {
        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'User-Agent' => 'SmartTravelApp/1.0'
            ])->get('https://nominatim.openstreetmap.org/reverse', [
                        'lat' => $lat,
                        'lon' => $lng,
                        'format' => 'json',
                        'addressdetails' => 1,
                    ]);

            if ($response->successful()) {
                $data = $response->json();
                $address = $data['address'] ?? [];

                $name = $data['name'] ?? null;

                if (!$name || $name === ($address['county'] ?? '') || $name === ($address['state_district'] ?? '')) {
                    $name = $address['tourism']
                        ?? $address['leisure']
                        ?? $address['amenity']
                        ?? $address['building']
                        ?? $address['historic']
                        ?? $address['place']
                        ?? $address['village']
                        ?? $address['town']
                        ?? $address['city']
                        ?? $address['municipality']
                        ?? $data['name']
                        ?? 'Unknown Location';
                }

                return [
                    'name' => $name,
                    'district' => $address['county'] ?? $address['state_district'] ?? null,
                    'state' => $address['state'] ?? null,
                    'country' => $address['country'] ?? null,
                    'nominatim_class' => $data['class'] ?? null,
                    'nominatim_type' => $data['type'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Reverse geocoding failed', ['error' => $e->getMessage()]);
        }

        return [
            'name' => 'Location',
            'district' => null,
            'state' => 'Kerala',
            'country' => 'India',
            'nominatim_class' => null,
            'nominatim_type' => null,
        ];
    }

    /** Find matching destination in DB by name, district, or coordinates */
    private function findDestinationByLocation(?string $name, ?string $district, float $lat, float $lng): ?Destination
    {
        // 1. Try coordinate proximity match first (within ~1km)
        $destination = Destination::where('is_active', true)
            ->whereRaw('ABS(latitude - ?) < 0.01 AND ABS(longitude - ?) < 0.01', [$lat, $lng])
            ->orderByRaw('ABS(latitude - ?) + ABS(longitude - ?)', [$lat, $lng])
            ->first();

        if ($destination)
            return $destination;

        // 2. Try name match
        if ($name && $name !== 'Unknown Location' && $name !== 'Location') {
            $destination = Destination::where('is_active', true)
                ->where('name', 'LIKE', "%{$name}%")
                ->first();

            if ($destination)
                return $destination;
        }

        // 3. Try district match (less precise)
        if ($district) {
            $destination = Destination::where('is_active', true)
                ->where('district', 'LIKE', "%{$district}%")
                ->orderBy('popularity_score', 'desc')
                ->first();
        }

        return $destination;
    }

    /** Generate estimated info for locations not in our database */
    private function getEstimatedLocationInfo(array $locationData, array $weather, string $climateType, ?array $aqi, array $alerts): array
    {
        $state = $locationData['state'] ?? 'India';
        $temp = $weather['temperature'];
        $humidity = $weather['humidity'];

        // Estimated budget based on region
        $budgetRanges = [
            'Kerala' => ['min' => 1500, 'max' => 5000],
            'Tamil Nadu' => ['min' => 1000, 'max' => 4000],
            'Karnataka' => ['min' => 1200, 'max' => 4500],
            'Goa' => ['min' => 2000, 'max' => 7000],
            'Rajasthan' => ['min' => 1500, 'max' => 6000],
            'Himachal Pradesh' => ['min' => 1800, 'max' => 5500],
            'Uttarakhand' => ['min' => 1500, 'max' => 5000],
            'Maharashtra' => ['min' => 1500, 'max' => 5500],
        ];
        $budget = $budgetRanges[$state] ?? ['min' => 1500, 'max' => 5000];

        // Best season based on climate
        $bestSeason = match (true) {
            $temp < 15 => 'March to May (warmer months)',
            $temp >= 15 && $temp < 25 => 'October to February (pleasant weather)',
            $temp >= 25 && $temp < 32 => 'November to February (cooler months)',
            default => 'October to January (avoid peak heat)',
        };

        // Travel tips based on current conditions
        $tips = [];

        if ($temp > 35) {
            $tips[] = 'Extreme heat — carry plenty of water and sunscreen';
        } elseif ($temp > 30) {
            $tips[] = 'Warm weather — light clothing and hydration recommended';
        } elseif ($temp < 15) {
            $tips[] = 'Cold weather — pack warm layers and jackets';
        } else {
            $tips[] = 'Pleasant temperature — great for outdoor activities';
        }

        if ($humidity > 80) {
            $tips[] = 'Very humid — expect sweating; carry extra clothes';
        } elseif ($humidity > 70) {
            $tips[] = 'Humid conditions — lightweight breathable fabrics recommended';
        } elseif ($humidity < 30) {
            $tips[] = 'Dry conditions — use moisturizer and stay hydrated';
        }

        $aqiValue = $aqi['aqi_value'] ?? null;
        if ($aqiValue && $aqiValue > 150) {
            $tips[] = 'Poor air quality — consider wearing a mask outdoors';
        } elseif ($aqiValue && $aqiValue > 100) {
            $tips[] = 'Moderate air quality — sensitive groups should take precautions';
        }

        if (!empty($alerts)) {
            $tips[] = 'Weather alerts active — check local advisories before traveling';
        }

        if (empty($tips)) {
            $tips[] = 'Conditions look favorable for travel!';
        }

        // Fetch a photo for this location using Pexels
        $photoUrl = null;
        try {
            $searchQuery = trim(($locationData['name'] ?? '') . ' ' . ($locationData['state'] ?? '') . ' India travel');
            $photos = $this->pexelsService->searchPhotos($searchQuery, 1);
            if (!empty($photos)) {
                $photoUrl = $photos[0]['medium'] ?? $photos[0]['large'] ?? $photos[0]['small'] ?? null;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to fetch Pexels photo for location', ['error' => $e->getMessage()]);
        }

        return [
            'estimated_budget_min' => $budget['min'],
            'estimated_budget_max' => $budget['max'],
            'budget_label' => "₹{$budget['min']} - ₹{$budget['max']} per day (estimated)",
            'best_season' => $bestSeason,
            'tips' => $tips,
            'photo_url' => $photoUrl,
        ];
    }

    /** Get reasons why a location is not suitable */
    private function getUnsuitableReasons(array $weather, UserPreference $preference, string $climateType, ?Destination $destination = null, ?array $liveData = null): array
    {
        $reasons = [];
        $temp = $weather['temperature'];
        $humidity = $weather['humidity'];
        $minTemp = $preference->preferred_min_temp ?? 18;
        $maxTemp = $preference->preferred_max_temp ?? 28;

        if ($temp < $minTemp) {
            $reasons[] = "Temperature {$temp}°C is below your preferred range ({$minTemp}-{$maxTemp}°C)";
        } elseif ($temp > $maxTemp) {
            $reasons[] = "Temperature {$temp}°C exceeds your preferred range ({$minTemp}-{$maxTemp}°C)";
        }

        if ($preference->climate_preference && strtolower($climateType) !== strtolower($preference->climate_preference)) {
            $reasons[] = "Climate is {$climateType}, but you prefer {$preference->climate_preference}";
        }

        if ($humidity < 40) {
            $reasons[] = "Humidity {$humidity}% is quite low (dry conditions)";
        } elseif ($humidity > 70) {
            $reasons[] = "Humidity {$humidity}% is quite high (humid conditions)";
        }

        // AQI reasons
        if ($liveData) {
            $aqi = $liveData['air_quality']['aqi_value'] ?? null;
            if ($aqi && $aqi > 150) {
                $reasons[] = "Air quality is poor (AQI: {$aqi})";
            }

            // Weather alerts
            $alerts = $liveData['alerts'] ?? [];
            if (!empty($alerts)) {
                $reasons[] = count($alerts) . " weather alert(s) active in this area";
            }
        }

        // Destination-specific reasons
        if ($destination) {
            $travelTypes = $preference->travel_types ?? [];
            if (!empty($travelTypes) && !in_array($destination->primary_type, $travelTypes)) {
                $reasons[] = ucfirst($destination->primary_type) . " type doesn't match your preferred types (" . implode(', ', $travelTypes) . ")";
            }

            if ($preference->max_budget && $destination->avg_budget_min > $preference->max_budget) {
                $reasons[] = "Budget ₹{$destination->avg_budget_min}+ exceeds your max budget ₹{$preference->max_budget}";
            }
        }

        return $reasons;
    }

    /**
     * Find categorized alternative destinations: For You, Similar Travelers, From Travel Plans.
     * All categories sorted by distance to the selected location (closest first).
     */
    public function findCategorizedAlternatives(
        UserPreference $preference,
        ?int $userId,
        ?int $excludeId,
        ?string $excludeName,
        ?float $lat,
        ?float $lng,
        int $countPerCategory = 3,
        ?float $minimumScore = null
    ): array {
        $forYou = $this->findAlternatives($preference, $countPerCategory, $excludeId, $excludeName, $lat, $lng, $minimumScore);

        // Similar Travelers Pick — collaborative filtering
        $similarTravelers = [];
        if ($userId) {
            try {
                $cfRecs = $this->collaborativeService->getCollaborativeRecommendations($userId, 15);
                $excludeIds = array_merge(
                    [$excludeId],
                    array_column($forYou, 'id')
                );

                foreach ($cfRecs as $cf) {
                    if (in_array($cf['destination_id'], $excludeIds))
                        continue;
                    $dest = Destination::find($cf['destination_id']);
                    if (!$dest || !$dest->is_active)
                        continue;
                    if (
                        $excludeName && (
                            str_contains(strtolower($dest->name), strtolower($excludeName)) ||
                            str_contains(strtolower($excludeName), strtolower($dest->name))
                        )
                    )
                        continue;

                    $distanceKm = null;
                    if ($lat !== null && $lng !== null) {
                        $distanceKm = round($this->haversineDistance($lat, $lng, (float) $dest->latitude, (float) $dest->longitude), 1);
                    }

                    try {
                        $result = $this->scoreDestination($dest, $preference);
                        $climateType = $this->determineClimateType($result['temperature'] ?? 25);
                        // Skip alternatives with lower match score than the selected location
                        if ($minimumScore !== null && $result['match_score'] <= $minimumScore) {
                            continue;
                        }
                        $similarTravelers[] = [
                            'id' => $dest->id,
                            'name' => $dest->name,
                            'district' => $dest->district,
                            'primary_type' => $dest->primary_type,
                            'state' => 'Kerala',
                            'photo_url' => $this->ensureValidPhotoUrl($dest),
                            'match_score' => $result['match_score'],
                            'distance_km' => $distanceKm,
                            'temperature' => $result['temperature'],
                            'climate_type' => $climateType,
                            'why_better' => $cf['reason'] ?? 'Similar travelers enjoyed this',
                        ];
                    } catch (\Exception $e) {
                        continue;
                    }

                    if (count($similarTravelers) >= $countPerCategory)
                        break;
                }

                // Sort by distance (closest first)
                usort($similarTravelers, fn($a, $b) => ($a['distance_km'] ?? PHP_INT_MAX) <=> ($b['distance_km'] ?? PHP_INT_MAX));
            } catch (\Exception $e) {
                Log::warning('Failed to get similar travelers alternatives', ['error' => $e->getMessage()]);
            }
        }

        // From Your Travel Plans
        $fromTravelPlans = [];
        if ($userId) {
            try {
                $plans = TravelPlan::where('user_id', $userId)
                    ->whereNotNull('destination_id')
                    ->with('destination')
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get();

                $seenIds = array_merge(
                    [$excludeId],
                    array_column($forYou, 'id'),
                    array_column($similarTravelers, 'id')
                );

                foreach ($plans as $plan) {
                    $dest = $plan->destination;
                    if (!$dest || !$dest->is_active)
                        continue;
                    if (in_array($dest->id, $seenIds))
                        continue;
                    if (
                        $excludeName && (
                            str_contains(strtolower($dest->name), strtolower($excludeName)) ||
                            str_contains(strtolower($excludeName), strtolower($dest->name))
                        )
                    )
                        continue;

                    $seenIds[] = $dest->id;

                    $distanceKm = null;
                    if ($lat !== null && $lng !== null) {
                        $distanceKm = round($this->haversineDistance($lat, $lng, (float) $dest->latitude, (float) $dest->longitude), 1);
                    }

                    try {
                        $result = $this->scoreDestination($dest, $preference);
                        $climateType = $this->determineClimateType($result['temperature'] ?? 25);
                        // Skip alternatives with lower match score than the selected location
                        if ($minimumScore !== null && $result['match_score'] <= $minimumScore) {
                            continue;
                        }
                        $fromTravelPlans[] = [
                            'id' => $dest->id,
                            'name' => $dest->name,
                            'district' => $dest->district,
                            'primary_type' => $dest->primary_type,
                            'state' => 'Kerala',
                            'photo_url' => $this->ensureValidPhotoUrl($dest),
                            'match_score' => $result['match_score'],
                            'distance_km' => $distanceKm,
                            'temperature' => $result['temperature'],
                            'climate_type' => $climateType,
                            'why_better' => 'From your travel plans — ' . $plan->status,
                        ];
                    } catch (\Exception $e) {
                        continue;
                    }

                    if (count($fromTravelPlans) >= $countPerCategory)
                        break;
                }

                // Sort by distance (closest first)
                usort($fromTravelPlans, fn($a, $b) => ($a['distance_km'] ?? PHP_INT_MAX) <=> ($b['distance_km'] ?? PHP_INT_MAX));
            } catch (\Exception $e) {
                Log::warning('Failed to get travel plan alternatives', ['error' => $e->getMessage()]);
            }
        }

        return [
            'for_you' => $forYou,
            'similar_travelers' => $similarTravelers,
            'from_travel_plans' => $fromTravelPlans,
        ];
    }

    /**
     * Find best alternative destinations using unified scoring, sorted by distance.
     * When lat/lng is provided, results are sorted by proximity (closest first).
     */
    public function findAlternatives(
        UserPreference $preference,
        int $count = 3,
        ?int $excludeId = null,
        ?string $excludeName = null,
        ?float $lat = null,
        ?float $lng = null,
        ?float $minimumScore = null
    ): array {
        $query = Destination::where('is_active', true);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        // If coordinates provided, fetch nearby destinations first (within 100km)
        if ($lat !== null && $lng !== null) {
            $destinations = (clone $query)
                ->selectRaw('*, (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) * sin(radians(latitude))
                    )
                ) AS distance_km', [$lat, $lng, $lat])
                ->having('distance_km', '<=', 100)
                ->orderBy('distance_km', 'asc')
                ->limit(20)
                ->get();

            // Always also include top popular destinations as fallback pool
            $nearbyIds = $destinations->pluck('id')->toArray();
            $popular = (clone $query)
                ->whereNotIn('id', $nearbyIds)
                ->orderBy('popularity_score', 'desc')
                ->limit(15)
                ->get();
            $destinations = $destinations->merge($popular);
        } else {
            $destinations = $query->orderBy('popularity_score', 'desc')->limit(15)->get();
        }

        if ($destinations->isEmpty())
            return [];

        $scored = [];
        /** @var Destination $dest */
        foreach ($destinations as $dest) {
            // Skip same-name destinations
            if (
                $excludeName && (
                    str_contains(strtolower($dest->name), strtolower($excludeName)) ||
                    str_contains(strtolower($excludeName), strtolower($dest->name))
                )
            ) {
                continue;
            }

            try {
                $result = $this->scoreDestination($dest, $preference);

                $climateType = $this->determineClimateType($result['temperature'] ?? 25);

                // Calculate distance if we have coordinates
                $distanceKm = null;
                if ($lat !== null && $lng !== null) {
                    $distanceKm = round($this->haversineDistance(
                        $lat,
                        $lng,
                        (float) $dest->latitude,
                        (float) $dest->longitude
                    ), 1);
                }

                // Combined ranking: 60% preference match + 40% proximity
                // This ensures closer destinations rank higher when match scores are similar
                $proximityScore = 0;
                if ($distanceKm !== null) {
                    // Proximity score: 100 for 0km, 0 for 500km+
                    $proximityScore = max(0, 100 * (1 - min($distanceKm, 500) / 500));
                }

                // Skip alternatives with lower match score than the selected location
                if ($minimumScore !== null && $result['match_score'] <= $minimumScore) {
                    continue;
                }

                $scored[] = [
                    'id' => $dest->id,
                    'name' => $dest->name,
                    'district' => $dest->district,
                    'primary_type' => $dest->primary_type,
                    'state' => 'Kerala',
                    'photo_url' => $this->ensureValidPhotoUrl($dest),
                    'match_score' => $result['match_score'],
                    'distance_km' => $distanceKm,
                    'temperature' => $result['temperature'],
                    'climate_type' => $climateType,
                    'why_better' => $this->explainWhyBetter($result, $climateType, $preference),
                    '_combined' => ($result['match_score'] * 0.6) + ($proximityScore * 0.4),
                ];
            } catch (\Exception $e) {
                Log::warning('Failed to score alternative', [
                    'destination' => $dest->name,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // Sort by distance (closest first)
        usort($scored, fn($a, $b) => ($a['distance_km'] ?? PHP_INT_MAX) <=> ($b['distance_km'] ?? PHP_INT_MAX));

        $results = array_slice($scored, 0, $count);
        foreach ($results as &$r) {
            unset($r['_combined']);
        }
        return $results;
    }

    /** Calculate the Haversine distance between two lat/lng points in km. */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function explainWhyBetter(array $result, string $climateType, UserPreference $preference): string
    {
        $reasons = [];
        $temp = $result['temperature'] ?? 25;
        $min = $preference->preferred_min_temp ?? 18;
        $max = $preference->preferred_max_temp ?? 28;

        if ($temp >= $min && $temp <= $max) {
            $reasons[] = "Temperature ({$temp}°C) matches your preference";
        }

        if ($preference->climate_preference && strtolower($climateType) === strtolower($preference->climate_preference)) {
            $reasons[] = "{$climateType} climate as preferred";
        }

        return empty($reasons) ? "Better match for your preferences" : implode(', ', $reasons);
    }

    /** Fetch live environmental data with caching */
    private function fetchLiveData(float $lat, float $lon): array
    {
        $cacheKey = "live_data_" . round($lat, 2) . "_" . round($lon, 2);

        return Cache::remember($cacheKey, 600, function () use ($lat, $lon) {
            return $this->weatherService->getCompleteData($lat, $lon);
        });
    }

    /**
     * Ensure we always get a valid photo URL for a destination.
     * Uses the model accessor with high-quality category placeholders as fallback.
     */
    private function ensureValidPhotoUrl(Destination $destination): string
    {
        // 1. Try to get real URL from model
        $url = $destination->photo_url;
        if ($url) {
            return $url;
        }

        // 2. Fallback to category-based curated placeholder
        $placeholders = [
            'beach' => 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg',
            'hill_station' => 'https://images.pexels.com/photos/2733337/pexels-photo-2733337.jpeg',
            'adventure' => 'https://images.pexels.com/photos/1365428/pexels-photo-1365428.jpeg',
            'nature' => 'https://images.pexels.com/photos/15286/pexels-photo.jpg',
            'cultural' => 'https://images.pexels.com/photos/2361717/pexels-photo-2361717.jpeg',
            'wildlife' => 'https://images.pexels.com/photos/70083/pexels-photo-70083.jpeg',
        ];

        return $placeholders[$destination->primary_type] ?? $placeholders['nature'];
    }
}
