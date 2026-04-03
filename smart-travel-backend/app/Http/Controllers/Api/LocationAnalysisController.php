<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LocationAnalysisController extends Controller
{
    public function __construct(
        private RecommendationEngine $engine
    ) {
    }

    /**
     * Analyze a location based on user preferences.
     * POST /api/locations/analyze
     *
     * Uses the same unified scoring formula as the dashboard.
     */
    public function analyze(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = Auth::user();

        if (!$user->preferences) {
            return response()->json([
                'error' => 'preferences_not_set',
                'message' => 'Please set your travel preferences first to get personalized recommendations.'
            ], 400);
        }

        try {
            // Use the same engine that powers the dashboard
            $analysis = $this->engine->scoreLocation(
                $validated['latitude'],
                $validated['longitude'],
                $user->preferences,
                $user->id
            );

            return response()->json($analysis);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'analysis_failed',
                'message' => 'Failed to analyze location. Please try again.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
