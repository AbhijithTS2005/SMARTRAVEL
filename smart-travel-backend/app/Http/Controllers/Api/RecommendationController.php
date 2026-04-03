<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\UserPreference;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecommendationController extends Controller
{
    public function __construct(
        private RecommendationEngine $engine
    ) {
    }

    /**
     * Get personalized destination recommendations for authenticated user.
     * Uses hybrid algorithm: content + collaborative + trending + diversity.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'Please set your travel preferences first.',
                'data' => []
            ], 400);
        }

        // Use hybrid engine for recommendations
        $recommendations = $this->engine->getHybridRecommendations($user->id, $preferences, 10);

        return response()->json([
            'success' => true,
            'data' => $recommendations,
        ]);
    }

    /**
     * Analyze a custom location for user compatibility.
     * POST /api/recommend/analyze
     */
    public function analyze(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'Please set your travel preferences first.'
            ], 400);
        }

        try {
            // Use the same unified engine as dashboard and location analysis
            $result = $this->engine->scoreLocation(
                $request->latitude,
                $request->longitude,
                $preferences,
                $user->id
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get "People Also Like" recommendations for a destination.
     * GET /api/recommendations/people-also-like/{destinationId}
     */
    public function peopleAlsoLike(Request $request, int $destinationId)
    {
        $destination = Destination::find($destinationId);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found',
            ], 404);
        }

        $results = $this->engine->getPeopleAlsoLike($destinationId, 6);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Get nearby recommendations for a destination.
     * Smart: shows matching destinations when place doesn't fit,
     * nearby attractions when it does.
     * GET /api/recommendations/nearby/{destinationId}
     */
    public function nearby(Request $request, int $destinationId)
    {
        $user = $request->user();
        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'Please set your travel preferences first.',
            ], 400);
        }

        $destination = Destination::find($destinationId);
        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found',
            ], 404);
        }

        try {
            $results = $this->engine->getNearbyRecommendations($destinationId, $preferences);

            return response()->json([
                'success' => true,
                'data' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch nearby recommendations: ' . $e->getMessage(),
            ], 500);
        }
    }
}
