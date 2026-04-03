<?php

namespace App\Services;

use App\Models\Destination;
use App\Models\UserInteraction;
use App\Models\UserPreference;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Collaborative Filtering Service
 *
 * Implements:
 * 1. User-User similarity (cosine similarity on interaction vectors)
 * 2. Item-Item co-occurrence ("People Also Like")
 * 3. Proximity-based recommendations (Haversine distance)
 */
class CollaborativeFilteringService
{
    // Interaction weights for building user vectors
    private const INTERACTION_WEIGHTS = [
        'favorite' => 5,
        'lets_go' => 4,
        'share' => 3,
        'view' => 1,
        'search' => 1,
        'scroll' => 0.5,
    ];

    // ──────────────────────────────────────────────
    // 1. USER-USER COLLABORATIVE FILTERING
    // ──────────────────────────────────────────────

    /**
     * Get collaborative filtering recommendations for a user.
     * Finds similar users and recommends destinations they liked but this user hasn't seen.
     *
     * @return array Array of ['destination_id' => int, 'cf_score' => float, 'reason' => string]
     */
    public function getCollaborativeRecommendations(int $userId, int $limit = 15): array
    {
        $cacheKey = "cf_recs_{$userId}";

        return Cache::remember($cacheKey, 1800, function () use ($userId, $limit) {
            // 1. Build the current user's interaction vector
            $userVector = $this->buildUserVector($userId);

            if (empty($userVector)) {
                return []; // No interactions yet — can't do CF
            }

            // 2. Find similar users
            $similarUsers = $this->findSimilarUsers($userId, $userVector, 20);

            if (empty($similarUsers)) {
                return [];
            }

            // 3. Get destinations this user has NOT interacted with,
            //    but similar users have interacted with strongly
            $userDestinations = array_keys($userVector);
            $recommendations = [];

            foreach ($similarUsers as $similarUser) {
                $simUserId = $similarUser['user_id'];
                $similarity = $similarUser['similarity'];

                // Get this similar user's strong interactions (favorites, lets_go, shares)
                $strongInteractions = UserInteraction::where('user_id', $simUserId)
                    ->whereIn('interaction_type', ['favorite', 'lets_go', 'share'])
                    ->select('destination_id', 'interaction_type')
                    ->get();

                foreach ($strongInteractions as $interaction) {
                    $destId = $interaction->destination_id;

                    // Skip if current user already interacted with this destination
                    if (in_array($destId, $userDestinations)) {
                        continue;
                    }

                    $weight = self::INTERACTION_WEIGHTS[$interaction->interaction_type] ?? 1;
                    $score = $similarity * $weight;

                    if (!isset($recommendations[$destId])) {
                        $recommendations[$destId] = [
                            'destination_id' => $destId,
                            'cf_score' => 0,
                            'similar_user_count' => 0,
                        ];
                    }

                    $recommendations[$destId]['cf_score'] += $score;
                    $recommendations[$destId]['similar_user_count']++;
                }
            }

            // Normalize scores to 0-100
            if (!empty($recommendations)) {
                $maxScore = max(array_column($recommendations, 'cf_score'));
                if ($maxScore > 0) {
                    foreach ($recommendations as &$rec) {
                        $rec['cf_score'] = round(($rec['cf_score'] / $maxScore) * 100, 2);
                        $rec['reason'] = $rec['similar_user_count'] > 1
                            ? "Similar travelers enjoyed this"
                            : "A traveler with similar taste loved this";
                    }
                }
            }

            // Sort by score descending
            usort($recommendations, fn($a, $b) => $b['cf_score'] <=> $a['cf_score']);

            return array_slice($recommendations, 0, $limit);
        });
    }

    /**
     * Build weighted interaction vector for a user.
     *
     * @return array<int, float> [destination_id => weighted_score]
     */
    private function buildUserVector(int $userId): array
    {
        $interactions = UserInteraction::where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(180)) // Last 6 months
            ->select('destination_id', 'interaction_type', 'created_at')
            ->get();

        $vector = [];
        foreach ($interactions as $interaction) {
            $destId = $interaction->destination_id;
            $weight = self::INTERACTION_WEIGHTS[$interaction->interaction_type] ?? 1;

            // Time decay: recent interactions weighted more (half-life of 30 days)
            $daysAgo = now()->diffInDays($interaction->created_at);
            $timeDecay = exp(-0.023 * $daysAgo); // ~0.5 after 30 days

            $vector[$destId] = ($vector[$destId] ?? 0) + ($weight * $timeDecay);
        }

        return $vector;
    }

    /**
     * Find the most similar users using cosine similarity.
     *
     * @return array Array of ['user_id' => int, 'similarity' => float]
     */
    private function findSimilarUsers(int $userId, array $userVector, int $topK = 20): array
    {
        // Get all other users who have interactions with the same destinations
        $destIds = array_keys($userVector);

        $otherUserIds = UserInteraction::whereIn('destination_id', $destIds)
            ->where('user_id', '!=', $userId)
            ->where('created_at', '>=', now()->subDays(180))
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        if (empty($otherUserIds)) {
            return [];
        }

        $similarities = [];

        foreach ($otherUserIds as $otherUserId) {
            $otherVector = $this->buildUserVector($otherUserId);

            $similarity = $this->cosineSimilarity($userVector, $otherVector);

            if ($similarity > 0.1) { // Minimum similarity threshold
                $similarities[] = [
                    'user_id' => $otherUserId,
                    'similarity' => round($similarity, 4),
                ];
            }
        }

        // Sort by similarity descending
        usort($similarities, fn($a, $b) => $b['similarity'] <=> $a['similarity']);

        return array_slice($similarities, 0, $topK);
    }

    /**
     * Calculate cosine similarity between two vectors.
     */
    private function cosineSimilarity(array $vectorA, array $vectorB): float
    {
        $allKeys = array_unique(array_merge(array_keys($vectorA), array_keys($vectorB)));

        $dotProduct = 0;
        $magnitudeA = 0;
        $magnitudeB = 0;

        foreach ($allKeys as $key) {
            $a = $vectorA[$key] ?? 0;
            $b = $vectorB[$key] ?? 0;

            $dotProduct += $a * $b;
            $magnitudeA += $a * $a;
            $magnitudeB += $b * $b;
        }

        $magnitudeA = sqrt($magnitudeA);
        $magnitudeB = sqrt($magnitudeB);

        if ($magnitudeA == 0 || $magnitudeB == 0) {
            return 0;
        }

        return $dotProduct / ($magnitudeA * $magnitudeB);
    }

    // ──────────────────────────────────────────────
    // 2. ITEM-ITEM CO-OCCURRENCE ("People Also Like")
    // ──────────────────────────────────────────────

    /**
     * Get "People Also Like" recommendations for a destination.
     * Finds destinations that users who liked this one also liked.
     *
     * @return array Array of destination data with co-occurrence scores
     */
    public function getPeopleAlsoLike(int $destinationId, int $limit = 6): array
    {
        $cacheKey = "people_also_like_{$destinationId}";

        return Cache::remember($cacheKey, 3600, function () use ($destinationId, $limit) {
            // 1. Find users who meaningfully interacted with this destination
            $engagedUserIds = UserInteraction::where('destination_id', $destinationId)
                ->whereIn('interaction_type', ['favorite', 'lets_go', 'share', 'view'])
                ->distinct()
                ->pluck('user_id')
                ->toArray();

            if (empty($engagedUserIds)) {
                return [];
            }

            // 2. Find other destinations those users also interacted with
            $coOccurrences = UserInteraction::whereIn('user_id', $engagedUserIds)
                ->where('destination_id', '!=', $destinationId)
                ->whereIn('interaction_type', ['favorite', 'lets_go', 'share', 'view'])
                ->select('destination_id', 'interaction_type', DB::raw('COUNT(*) as occurrence_count'))
                ->groupBy('destination_id', 'interaction_type')
                ->get();

            // 3. Aggregate scores with interaction weighting
            $scores = [];
            foreach ($coOccurrences as $item) {
                $destId = $item->destination_id;
                $weight = self::INTERACTION_WEIGHTS[$item->interaction_type] ?? 1;

                $scores[$destId] = ($scores[$destId] ?? 0) + ($weight * $item->occurrence_count);
            }

            // 4. Normalize and sort
            if (empty($scores)) {
                return [];
            }

            arsort($scores);
            $topDestIds = array_slice(array_keys($scores), 0, $limit);
            $maxScore = max($scores);

            // 5. Fetch destination details
            $destinations = Destination::whereIn('id', $topDestIds)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            $results = [];
            foreach ($topDestIds as $destId) {
                if (!isset($destinations[$destId]))
                    continue;

                $dest = $destinations[$destId];
                $normalizedScore = round(($scores[$destId] / $maxScore) * 100, 1);

                $results[] = [
                    'id' => $dest->id,
                    'name' => $dest->name,
                    'slug' => $dest->slug,
                    'district' => $dest->district,
                    'primary_type' => $dest->primary_type,
                    'images' => $dest->images,
                    'popularity_score' => $dest->popularity_score,
                    'co_occurrence_score' => $normalizedScore,
                    'reason' => "Travelers who visited the selected destination also enjoyed this",
                ];
            }

            return $results;
        });
    }

    // ──────────────────────────────────────────────
    // 3. PROXIMITY-BASED RECOMMENDATIONS
    // ──────────────────────────────────────────────

    /**
     * Get nearby destination recommendations.
     *
     * Smart behavior:
     * - If the selected destination DOESN'T match user preferences:
     *   → Find nearby destinations that DO match (within 50km)
     * - If it DOES match:
     *   → Find nearby attractions to explore (within 30km)
     *
     * @return array{type: string, label: string, destinations: array}
     */
    public function getNearbyRecommendations(
        Destination $selectedDestination,
        UserPreference $preferences,
        float $matchScore,
        int $limit = 6
    ): array {
        $lat = (float) $selectedDestination->latitude;
        $lng = (float) $selectedDestination->longitude;
        $isMatch = $matchScore >= 70;

        if ($isMatch) {
            // Destination matches — show nearby attractions to explore
            $radiusKm = 30;
            $label = "Nearby attractions to explore";
            $type = "nearby_attractions";

            $nearbyDestinations = $this->findDestinationsWithinRadius($lat, $lng, $radiusKm, $selectedDestination->id);
        } else {
            // Destination doesn't match — show nearby places that DO match preferences
            $radiusKm = 50;
            $label = "Better matches near " . $selectedDestination->name;
            $type = "nearby_matching";

            $nearbyDestinations = $this->findDestinationsWithinRadius($lat, $lng, $radiusKm, $selectedDestination->id);

            // Filter to only destinations matching user's preferred types
            $preferredTypes = $preferences->travel_types ?? [];
            if (!empty($preferredTypes)) {
                $nearbyDestinations = array_filter($nearbyDestinations, function ($dest) use ($preferredTypes) {
                    return in_array($dest['primary_type'], $preferredTypes);
                });
            }
        }

        // Sort by distance
        usort($nearbyDestinations, fn($a, $b) => $a['distance_km'] <=> $b['distance_km']);

        return [
            'type' => $type,
            'label' => $label,
            'is_match' => $isMatch,
            'match_score' => $matchScore,
            'destinations' => array_slice(array_values($nearbyDestinations), 0, $limit),
        ];
    }

    /**
     * Find all active destinations within a given radius (km) using Haversine.
     */
    private function findDestinationsWithinRadius(float $lat, float $lng, float $radiusKm, ?int $excludeId = null): array
    {
        // Haversine formula in SQL for MySQL
        $query = Destination::where('is_active', true)
            ->selectRaw("
                *,
                (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                )) AS distance_km
            ", [$lat, $lng, $lat])
            ->havingRaw('distance_km <= ? AND distance_km >= 0.5', [$radiusKm])
            ->orderBy('distance_km');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $destinations = $query->get();

        return $destinations->map(function (Destination $dest) {
            return [
                'id' => $dest->id,
                'name' => $dest->name,
                'slug' => $dest->slug,
                'district' => $dest->district,
                'primary_type' => $dest->primary_type,
                'images' => $dest->images,
                'popularity_score' => $dest->popularity_score,
                'latitude' => (float) $dest->latitude,
                'longitude' => (float) $dest->longitude,
                'distance_km' => round($dest->distance_km, 1),
            ];
        })->toArray();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula (in km).
     */
    public static function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
