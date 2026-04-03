<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TravelPlan;
use App\Models\UserInteraction;
use App\Models\Wishlist;
use App\Models\Review;
use App\Models\Destination;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /**
     * Get aggregated travel stats for the authenticated user.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Travel Plans stats
        $plans = TravelPlan::where('user_id', $userId);
        $tripsCompleted = (clone $plans)->where('status', 'completed')->count();
        $tripsPlanned = (clone $plans)->where('status', 'planned')->count();
        $tripsActive = (clone $plans)->where('status', 'active')->count();
        $totalTrips = $plans->count();

        // Districts covered (from completed plans with destinations)
        $completedDestIds = TravelPlan::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereNotNull('destination_id')
            ->pluck('destination_id')
            ->unique()
            ->toArray();

        $districtsCovered = [];
        if (!empty($completedDestIds)) {
            $districtsCovered = Destination::whereIn('id', $completedDestIds)
                ->whereNotNull('district')
                ->pluck('district')
                ->unique()
                ->values()
                ->toArray();
        }

        // Interactions stats
        $destinationsViewed = UserInteraction::where('user_id', $userId)
            ->where('interaction_type', 'view')
            ->distinct('destination_id')
            ->count('destination_id');

        // Wishlist stats
        $destinationsWishlisted = Wishlist::where('user_id', $userId)->count();

        // Review stats
        $reviewsWritten = Review::where('user_id', $userId)->count();
        $avgRatingGiven = Review::where('user_id', $userId)->avg('rating');

        // Favorite type (most common primary_type from all planned/completed destinations)
        $allPlanDestIds = TravelPlan::where('user_id', $userId)
            ->whereNotNull('destination_id')
            ->pluck('destination_id')
            ->unique()
            ->toArray();

        $favoriteType = null;
        $favoriteDistrict = null;
        if (!empty($allPlanDestIds)) {
            $favoriteType = Destination::whereIn('id', $allPlanDestIds)
                ->selectRaw('primary_type, COUNT(*) as count')
                ->groupBy('primary_type')
                ->orderByDesc('count')
                ->value('primary_type');

            $favoriteDistrict = Destination::whereIn('id', $allPlanDestIds)
                ->whereNotNull('district')
                ->selectRaw('district, COUNT(*) as count')
                ->groupBy('district')
                ->orderByDesc('count')
                ->value('district');
        }

        // Interaction breakdown
        $interactionBreakdown = UserInteraction::where('user_id', $userId)
            ->selectRaw('interaction_type, COUNT(*) as count')
            ->groupBy('interaction_type')
            ->pluck('count', 'interaction_type')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_trips' => $totalTrips,
                    'trips_completed' => $tripsCompleted,
                    'trips_planned' => $tripsPlanned,
                    'trips_active' => $tripsActive,
                    'destinations_viewed' => $destinationsViewed,
                    'destinations_wishlisted' => $destinationsWishlisted,
                ],
                'reviews' => [
                    'reviews_written' => $reviewsWritten,
                    'avg_rating_given' => $avgRatingGiven ? round($avgRatingGiven, 1) : null,
                ],
                'preferences' => [
                    'favorite_type' => $favoriteType,
                    'favorite_district' => $favoriteDistrict,
                    'districts_covered' => $districtsCovered,
                    'districts_covered_count' => count($districtsCovered),
                ],
                'interactions' => $interactionBreakdown,
            ],
        ]);
    }
}
