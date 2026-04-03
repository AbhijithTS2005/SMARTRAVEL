<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Store a push subscription for the authenticated user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'content_encoding' => 'nullable|string',
        ]);

        $user = $request->user();

        // Upsert: update if same endpoint exists, create otherwise
        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint' => $validated['endpoint'],
            ],
            [
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => $validated['content_encoding'] ?? 'aesgcm',
                'user_agent' => $request->userAgent(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Push subscription saved successfully',
            'data' => ['id' => $subscription->id],
        ], 201);
    }

    /**
     * Remove a push subscription.
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = $request->user();

        $deleted = PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $validated['endpoint'])
            ->delete();

        return response()->json([
            'success' => true,
            'message' => $deleted ? 'Subscription removed' : 'Subscription not found',
        ]);
    }

    /**
     * Send a test push notification to the current user.
     */
    public function test(Request $request)
    {
        $user = $request->user();

        $webPush = new WebPushService();

        $payload = WebPushService::buildPayload(
            '🔔 Push Notifications Active!',
            'You will now receive real-time travel alerts, weather warnings, and smart recommendations on this device.',
            'general',
            '/icon.svg',
            '/notifications'
        );

        $sent = $webPush->sendToUser($user, $payload);

        return response()->json([
            'success' => true,
            'message' => "Test notification sent to {$sent} device(s)",
            'data' => ['devices_notified' => $sent],
        ]);
    }
}
