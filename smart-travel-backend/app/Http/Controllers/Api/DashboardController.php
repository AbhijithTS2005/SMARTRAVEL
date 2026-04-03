<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\UserInteraction;
use App\Models\UserPreference;
use App\Models\TravelPlan;
use App\Services\CollaborativeFilteringService;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private RecommendationEngine $engine,
        private CollaborativeFilteringService $cfService
    ) {
    }

    /**
     * Get dashboard data with 3 recommendation sections.
     *
     * 1. For You — content-based, matching user preferences
     * 2. Similar Travelers Picks — collaborative filtering from similar users
     * 3. Your Recent Plans — re-scored past interactions matching current conditions
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get user preferences
        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'Please set your preferences first to get personalized recommendations',
                'data' => [
                    'has_preferences' => false,
                    'for_you' => [],
                    'travelers_like_you' => [],
                    'recent_plans' => [],
                ]
            ]);
        }

        // Refresh learned profile from user behavior
        $this->engine->refreshLearnedProfile($user->id, $preferences);

        // ── SECTION 1: For You (content-based) ──────────────────
        $forYou = $this->engine->getTopRecommendations($preferences, 6);
        foreach ($forYou as &$item) {
            $item['recommendation_type'] = 'content';
            $item['recommendation_reason'] = 'Matches your preferences';
        }

        // ── SECTION 2: Similar Travelers Picks (collaborative filtering) ──
        $cfRaw = $this->cfService->getCollaborativeRecommendations($user->id, 6);
        $travelersLikeYou = [];

        foreach ($cfRaw as $cf) {
            $dest = Destination::find($cf['destination_id']);
            if (!$dest || !$dest->is_active)
                continue;

            try {
                $result = $this->engine->scoreDestination($dest, $preferences);
                $travelersLikeYou[] = [
                    'id' => $dest->id,
                    'name' => $dest->name,
                    'slug' => $dest->slug,
                    'district' => $dest->district,
                    'primary_type' => $dest->primary_type,
                    'images' => $dest->images,
                    'avg_budget_min' => $dest->avg_budget_min,
                    'avg_budget_max' => $dest->avg_budget_max,
                    'popularity_score' => $dest->popularity_score,
                    'match_score' => $result['match_score'],
                    'live_aqi' => $result['live_aqi'],
                    'temperature' => $result['temperature'],
                    'has_alerts' => $result['has_alerts'],
                    'cf_score' => $cf['cf_score'],
                    'similar_user_count' => $cf['similar_user_count'],
                    'recommendation_type' => 'collaborative',
                    'recommendation_reason' => $cf['reason'],
                ];
            } catch (\Exception $e) {
                continue;
            }
        }

        // ── SECTION 3: Your Recent Plans (re-scored past interactions) ──
        $recentPlans = $this->getRecentPlansRecommendations($user->id, $preferences);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data retrieved successfully',
            'data' => [
                'has_preferences' => true,
                'for_you' => $forYou,
                'travelers_like_you' => $travelersLikeYou,
                'recent_plans' => $recentPlans,
            ]
        ]);
    }

    /**
     * Get destinations the user has interacted with or planned,
     * re-scored with current live weather & preference match.
     */
    private function getRecentPlansRecommendations(int $userId, UserPreference $preferences): array
    {
        // Get destination IDs from travel plans
        $planDestIds = TravelPlan::where('user_id', $userId)
            ->pluck('destination_id')
            ->unique()
            ->toArray();

        // Get destination IDs from interactions (view, favorite, lets_go)
        $interactionDestIds = UserInteraction::where('user_id', $userId)
            ->whereIn('interaction_type', ['view', 'favorite', 'lets_go', 'share'])
            ->pluck('destination_id')
            ->unique()
            ->toArray();

        $allDestIds = array_unique(array_merge($planDestIds, $interactionDestIds));

        if (empty($allDestIds)) {
            return [];
        }

        // Fetch and re-score these destinations with current conditions
        $destinations = Destination::where('is_active', true)
            ->whereIn('id', $allDestIds)
            ->get();

        $scored = [];
        foreach ($destinations as $dest) {
            /** @var Destination $dest */
            try {
                $result = $this->engine->scoreDestination($dest, $preferences);

                $isPlan = in_array($dest->id, $planDestIds);
                $scored[] = [
                    'id' => $dest->id,
                    'name' => $dest->name,
                    'slug' => $dest->slug,
                    'district' => $dest->district,
                    'primary_type' => $dest->primary_type,
                    'images' => $dest->images,
                    'avg_budget_min' => $dest->avg_budget_min,
                    'avg_budget_max' => $dest->avg_budget_max,
                    'popularity_score' => $dest->popularity_score,
                    'match_score' => $result['match_score'],
                    'live_aqi' => $result['live_aqi'],
                    'temperature' => $result['temperature'],
                    'has_alerts' => $result['has_alerts'],
                    'recommendation_type' => 'recent',
                    'recommendation_reason' => $isPlan
                        ? 'From your travel plans'
                        : 'You showed interest in this',
                ];
            } catch (\Exception $e) {
                continue;
            }
        }

        // Sort by match score (current conditions)
        usort($scored, fn($a, $b) => $b['match_score'] <=> $a['match_score']);

        return array_slice($scored, 0, 6);
    }
}
