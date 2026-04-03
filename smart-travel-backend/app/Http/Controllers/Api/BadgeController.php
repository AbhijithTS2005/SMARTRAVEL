<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserBadge;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BadgeController extends Controller
{
    /**
     * All badge definitions with requirements.
     */
    private const BADGES = [
        [
            'slug' => 'first_steps',
            'name' => 'First Steps',
            'description' => 'Complete your first trip',
            'emoji' => '🗺️',
            'category' => 'travel',
            'requirement' => 'completed_trips',
            'threshold' => 1,
        ],
        [
            'slug' => 'explorer',
            'name' => 'Explorer',
            'description' => 'Complete 5 trips',
            'emoji' => '🌍',
            'category' => 'travel',
            'requirement' => 'completed_trips',
            'threshold' => 5,
        ],
        [
            'slug' => 'adventurer',
            'name' => 'Adventurer',
            'description' => 'Complete 10 trips',
            'emoji' => '🏔️',
            'category' => 'travel',
            'requirement' => 'completed_trips',
            'threshold' => 10,
        ],
        [
            'slug' => 'reviewer',
            'name' => 'Reviewer',
            'description' => 'Write your first review',
            'emoji' => '⭐',
            'category' => 'social',
            'requirement' => 'reviews_written',
            'threshold' => 1,
        ],
        [
            'slug' => 'critic',
            'name' => 'Critic',
            'description' => 'Write 5 reviews',
            'emoji' => '📝',
            'category' => 'social',
            'requirement' => 'reviews_written',
            'threshold' => 5,
        ],
        [
            'slug' => 'collector',
            'name' => 'Collector',
            'description' => 'Add 5 destinations to your wishlist',
            'emoji' => '❤️',
            'category' => 'engagement',
            'requirement' => 'wishlist_count',
            'threshold' => 5,
        ],
        [
            'slug' => 'district_hopper',
            'name' => 'District Hopper',
            'description' => 'Visit 5 different districts',
            'emoji' => '📍',
            'category' => 'travel',
            'requirement' => 'districts_visited',
            'threshold' => 5,
        ],
        [
            'slug' => 'kerala_expert',
            'name' => 'Kerala Expert',
            'description' => 'Visit 10 different districts',
            'emoji' => '🏆',
            'category' => 'travel',
            'requirement' => 'districts_visited',
            'threshold' => 10,
        ],
        [
            'slug' => 'planner',
            'name' => 'Planner',
            'description' => 'Create 3 travel plans',
            'emoji' => '📋',
            'category' => 'engagement',
            'requirement' => 'plans_created',
            'threshold' => 3,
        ],
        [
            'slug' => 'safety_first',
            'name' => 'Safety First',
            'description' => 'Add an emergency contact',
            'emoji' => '🆘',
            'category' => 'safety',
            'requirement' => 'emergency_contacts',
            'threshold' => 1,
        ],
    ];

    /**
     * Get all badges with user progress and unlock status.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Gather all user stats
        $stats = $this->getUserStats($user);

        // Get already unlocked badges
        $unlockedBadges = UserBadge::where('user_id', $user->id)
            ->pluck('unlocked_at', 'badge_slug')
            ->toArray();

        $newlyUnlocked = [];

        // Build response with progress
        $badges = array_map(function ($badge) use ($stats, $unlockedBadges, $user, &$newlyUnlocked) {
            $current = $stats[$badge['requirement']] ?? 0;
            $isUnlocked = isset($unlockedBadges[$badge['slug']]);

            // Check if badge should be newly unlocked
            if (!$isUnlocked && $current >= $badge['threshold']) {
                try {
                    UserBadge::create([
                        'user_id' => $user->id,
                        'badge_slug' => $badge['slug'],
                        'unlocked_at' => now(),
                    ]);
                    $isUnlocked = true;
                    $newlyUnlocked[] = $badge['slug'];
                } catch (\Exception $e) {
                    // Already unlocked (race condition)
                    $isUnlocked = true;
                }
            }

            return [
                'slug' => $badge['slug'],
                'name' => $badge['name'],
                'description' => $badge['description'],
                'emoji' => $badge['emoji'],
                'category' => $badge['category'],
                'threshold' => $badge['threshold'],
                'current' => min($current, $badge['threshold']),
                'progress' => $badge['threshold'] > 0
                    ? min(round(($current / $badge['threshold']) * 100), 100)
                    : 0,
                'unlocked' => $isUnlocked,
                'unlocked_at' => $unlockedBadges[$badge['slug']] ?? null,
            ];
        }, self::BADGES);

        $totalUnlocked = count(array_filter($badges, fn($b) => $b['unlocked']));

        return response()->json([
            'badges' => $badges,
            'total' => count(self::BADGES),
            'unlocked' => $totalUnlocked,
            'newly_unlocked' => $newlyUnlocked,
        ]);
    }

    /**
     * Gather all relevant user statistics.
     */
    private function getUserStats($user): array
    {
        $userId = $user->id;

        // Completed trips
        $completedTrips = DB::table('travel_plans')
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        // Reviews written
        $reviewsWritten = DB::table('reviews')
            ->where('user_id', $userId)
            ->count();

        // Wishlist count
        $wishlistCount = DB::table('wishlists')
            ->where('user_id', $userId)
            ->count();

        // Districts visited (unique districts from completed trips)
        $districtsVisited = DB::table('travel_plans')
            ->join('destinations', 'travel_plans.destination_id', '=', 'destinations.id')
            ->where('travel_plans.user_id', $userId)
            ->where('travel_plans.status', 'completed')
            ->distinct()
            ->count('destinations.district');

        // Plans created
        $plansCreated = DB::table('travel_plans')
            ->where('user_id', $userId)
            ->count();

        // Emergency contacts
        $emergencyContacts = DB::table('emergency_contacts')
            ->where('user_id', $userId)
            ->count();

        return [
            'completed_trips' => $completedTrips,
            'reviews_written' => $reviewsWritten,
            'wishlist_count' => $wishlistCount,
            'districts_visited' => $districtsVisited,
            'plans_created' => $plansCreated,
            'emergency_contacts' => $emergencyContacts,
        ];
    }
}
