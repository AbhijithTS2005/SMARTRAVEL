<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\UserPreference;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;

class DestinationAnalysisController extends Controller
{
    public function __construct(
        private RecommendationEngine $engine
    ) {
    }

    /**
     * Analyze destination suitability with live environmental data.
     * GET /api/destinations/{id}/analyze
     */
    public function analyze(Request $request, $id)
    {
        $user = $request->user();

        $destination = Destination::findOrFail($id);

        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'Please set your preferences first'
            ], 400);
        }

        try {
            // Use unified engine — same scoring as dashboard
            $result = $this->engine->scoreDestination($destination, $preferences);

            $status = $this->getRecommendationStatus($result['match_score']);

            return response()->json([
                'success' => true,
                'data' => [
                    'destination' => [
                        'id' => $destination->id,
                        'name' => $destination->name,
                        'district' => $destination->district,
                        'primary_type' => $destination->primary_type,
                    ],
                    'suitability_score' => $result['match_score'],
                    'recommendation_status' => $status,
                    'live_aqi' => $result['live_aqi'],
                    'temperature' => $result['temperature'],
                    'humidity' => $result['humidity'],
                    'has_alerts' => $result['has_alerts'],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getRecommendationStatus(float $score): array
    {
        if ($score >= 80)
            return ['status' => 'highly_recommended', 'message' => 'Excellent match for you!'];
        if ($score >= 60)
            return ['status' => 'recommended', 'message' => 'Good match for your preferences'];
        if ($score >= 40)
            return ['status' => 'moderate', 'message' => 'Fair match — consider alternatives'];
        return ['status' => 'not_recommended', 'message' => 'Not ideal for your current preferences'];
    }
}
