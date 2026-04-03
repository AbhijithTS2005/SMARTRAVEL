<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TravelPlan;
use App\Models\Destination;
use App\Services\OpenWeatherService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TravelPlanController extends Controller
{
    private OpenWeatherService $weatherService;

    public function __construct(OpenWeatherService $weatherService)
    {
        $this->weatherService = $weatherService;
    }

    /**
     * Get all travel plans for authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $plans = TravelPlan::with(['destination'])
            ->where('user_id', $user->id)
            ->orderBy('start_date', 'desc')
            ->get();

        // Auto-transition plan statuses based on dates
        $today = now()->toDateString();
        /** @var TravelPlan $plan */
        foreach ($plans as $plan) {
            // Planned → Active: start date has arrived
            if ($plan->status === 'planned' && $plan->start_date->toDateString() <= $today) {
                $plan->update(['status' => 'active']);
            }
            // Active → Completed: end date has passed
            if (in_array($plan->status, ['planned', 'active']) && $plan->end_date->toDateString() < $today) {
                $plan->complete();
            }
        }

        // Re-fetch with updated statuses
        $plans = TravelPlan::with(['destination'])
            ->where('user_id', $user->id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Travel plans retrieved successfully',
            'data' => $plans
        ]);
    }

    /**
     * Create a new travel plan ("Let's Go" action).
     * Supports both database destinations and custom locations.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_id' => 'nullable|exists:destinations,id',
            'location_name' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Must provide either destination_id or coordinates
        if (!$request->destination_id && (!$request->latitude || !$request->longitude)) {
            return response()->json([
                'success' => false,
                'message' => 'Either destination_id or latitude/longitude must be provided',
            ], 422);
        }

        $user = $request->user();

        // Determine coordinates for weather check
        if ($request->destination_id) {
            $destination = Destination::find($request->destination_id);
            $lat = (float) $destination->latitude;
            $lng = (float) $destination->longitude;
        } else {
            $lat = (float) $request->latitude;
            $lng = (float) $request->longitude;
        }

        // Create travel plan — set to 'active' if trip starts today
        $startsToday = $request->start_date <= now()->toDateString();
        $planData = [
            'user_id' => $user->id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => $startsToday ? 'active' : 'planned',
            'monitoring_active' => true,
        ];

        if ($request->destination_id) {
            $planData['destination_id'] = $request->destination_id;
        } else {
            $planData['custom_location_name'] = $request->location_name ?? 'Custom Location';
            $planData['custom_latitude'] = $lat;
            $planData['custom_longitude'] = $lng;
        }

        $travelPlan = TravelPlan::create($planData);

        // Get current conditions
        $currentConditions = $this->weatherService->getCompleteData($lat, $lng);

        return response()->json([
            'success' => true,
            'message' => 'Travel plan created successfully! Monitoring is now active.',
            'data' => [
                'travel_plan' => $travelPlan->load('destination'),
                'monitoring_active' => true,
                'current_conditions' => [
                    'aqi' => $currentConditions['air_quality']['aqi_status'] ?? 'Unknown',
                    'temperature' => $currentConditions['weather']['temperature'] ?? null,
                    'weather' => $currentConditions['weather']['description'] ?? 'Unknown',
                    'alerts' => $currentConditions['alerts'],
                ]
            ]
        ], 201);
    }

    /**
     * Cancel a travel plan.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $travelPlan = TravelPlan::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$travelPlan) {
            return response()->json([
                'success' => false,
                'message' => 'Travel plan not found',
            ], 404);
        }

        $travelPlan->cancel();

        return response()->json([
            'success' => true,
            'message' => 'Travel plan cancelled and monitoring stopped',
            'data' => $travelPlan
        ]);
    }

    /**
     * Mark travel plan as completed.
     */
    public function complete(Request $request, $id)
    {
        $user = $request->user();

        $travelPlan = TravelPlan::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$travelPlan) {
            return response()->json([
                'success' => false,
                'message' => 'Travel plan not found',
            ], 404);
        }

        $travelPlan->complete();

        return response()->json([
            'success' => true,
            'message' => 'Travel plan marked as completed',
            'data' => $travelPlan
        ]);
    }

    /**
     * Toggle monitoring for a travel plan.
     */
    public function toggleMonitoring(Request $request, $id)
    {
        $user = $request->user();

        $travelPlan = TravelPlan::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$travelPlan) {
            return response()->json([
                'success' => false,
                'message' => 'Travel plan not found',
            ], 404);
        }

        $travelPlan->update([
            'monitoring_active' => !$travelPlan->monitoring_active
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Monitoring ' . ($travelPlan->monitoring_active ? 'enabled' : 'disabled'),
            'data' => $travelPlan
        ]);
    }
}
