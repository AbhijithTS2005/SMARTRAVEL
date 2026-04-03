<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Services\RecommendationEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InteractionController extends Controller
{
    public function __construct(
        private RecommendationEngine $engine
    ) {
    }

    /**
     * Record a user interaction with a destination.
     * POST /api/interactions
     *
     * Used by the frontend to track views, favorites, shares, etc.
     * This data feeds into the collaborative filtering algorithm.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_id' => 'required|integer|exists:destinations,id',
            'interaction_type' => 'required|in:view,search,lets_go,scroll,share,favorite',
            'duration_seconds' => 'nullable|integer|min:0',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid parameters',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $this->engine->recordInteraction(
            $user->id,
            $request->destination_id,
            $request->interaction_type,
            array_merge(
                $request->metadata ?? [],
                ['duration_seconds' => $request->duration_seconds ?? 0]
            )
        );

        return response()->json([
            'success' => true,
            'message' => 'Interaction recorded',
        ]);
    }
}
