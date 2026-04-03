<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PreferenceController extends Controller
{
    /**
     * Get authenticated user's preferences.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'No preferences found. Please set your preferences first.',
                'data' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Preferences retrieved successfully',
            'data' => $preferences
        ]);
    }

    /**
     * Create or update user preferences.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Validation rules
        $validator = Validator::make($request->all(), [
            'climate_preference' => 'required|in:cold,moderate,hot',
            'min_budget' => 'required|numeric|min:0',
            'max_budget' => 'required|numeric|gt:min_budget',
            'travel_types' => 'required|array|min:1',
            'travel_types.*' => 'in:adventure,hill_station,beach,nature,cultural,wildlife',
            'crowd_preference' => 'nullable|in:crowded,less_crowded,any',
            'air_quality_sensitive' => 'nullable|boolean',
            'season_preferences' => 'nullable|array',
            'season_preferences.*' => 'in:summer,monsoon,winter',
            'activities_interest' => 'nullable|array',
            'activities_interest.*' => 'string|max:50',
            'preferred_min_temp' => 'nullable|numeric|min:0|max:50',
            'preferred_max_temp' => 'nullable|numeric|min:0|max:50|gte:preferred_min_temp',
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        // Update or create preferences
        $preferences = UserPreference::updateOrCreate(
            ['user_id' => $user->id],
            [
                'climate_preference' => $request->climate_preference,
                'min_budget' => $request->min_budget,
                'max_budget' => $request->max_budget,
                'travel_types' => $request->travel_types,
                'crowd_preference' => $request->crowd_preference ?? 'any',
                'air_quality_sensitive' => $request->air_quality_sensitive ?? false,
                'season_preferences' => $request->season_preferences ?? [],
                'activities_interest' => $request->activities_interest ?? [],
                'preferred_min_temp' => $request->preferred_min_temp ?? 15.0,
                'preferred_max_temp' => $request->preferred_max_temp ?? 35.0,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Preferences saved successfully',
            'data' => $preferences
        ], 200);
    }

    /**
     * Update specific preference fields.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'No preferences found. Please create preferences first using POST.',
            ], 404);
        }

        // Partial update validation
        $validator = Validator::make($request->all(), [
            'climate_preference' => 'sometimes|in:cold,moderate,hot',
            'min_budget' => 'sometimes|numeric|min:0',
            'max_budget' => 'sometimes|numeric|gt:min_budget',
            'travel_types' => 'sometimes|array|min:1',
            'travel_types.*' => 'in:adventure,hill_station,beach,nature,cultural,wildlife',
            'crowd_preference' => 'sometimes|in:crowded,less_crowded,any',
            'air_quality_sensitive' => 'sometimes|boolean',
            'season_preferences' => 'sometimes|array',
            'season_preferences.*' => 'in:summer,monsoon,winter',
            'activities_interest' => 'sometimes|array',
            'activities_interest.*' => 'string|max:50',
            'preferred_min_temp' => 'sometimes|numeric|min:0|max:50',
            'preferred_max_temp' => 'sometimes|numeric|min:0|max:50',
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        // Update only provided fields
        $preferences->update($request->only([
            'climate_preference',
            'min_budget',
            'max_budget',
            'travel_types',
            'crowd_preference',
            'air_quality_sensitive',
            'season_preferences',
            'activities_interest',
            'preferred_min_temp',
            'preferred_max_temp',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'data' => $preferences->fresh()
        ]);
    }

    /**
     * Delete user preferences.
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        $preferences = UserPreference::where('user_id', $user->id)->first();

        if (!$preferences) {
            return response()->json([
                'success' => false,
                'message' => 'No preferences found to delete.',
            ], 404);
        }

        $preferences->delete();

        return response()->json([
            'success' => true,
            'message' => 'Preferences deleted successfully',
        ]);
    }
}
