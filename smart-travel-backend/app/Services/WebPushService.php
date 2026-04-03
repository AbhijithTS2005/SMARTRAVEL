<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    private WebPush $webPush;

    public function __construct()
    {
        $opensslConf = 'C:\\xampp\\apache\\conf\\openssl.cnf';
        if (file_exists($opensslConf)) {
            putenv("OPENSSL_CONF=$opensslConf");
        }

        $auth = [
            'VAPID' => [
                'subject' => config('services.webpush.subject', 'mailto:alerts@smartravel.com'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setAutomaticPadding(false);
    }

    /**
     * Send a push notification to a specific user (all their devices).
     */
    public function sendToUser(User $user, array $payload): int
    {
        $subscriptions = $user->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            return 0;
        }

        $sent = 0;

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding ?? 'aesgcm',
                ]);

                $this->webPush->queueNotification(
                    $subscription,
                    json_encode($payload)
                );

                $sent++;
            } catch (\Exception $e) {
                Log::warning('Failed to queue push notification', [
                    'user_id' => $user->id,
                    'subscription_id' => $sub->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Flush all queued notifications
        $results = $this->webPush->flush();

        // Handle expired/invalid subscriptions
        if ($results) {
            foreach ($results as $result) {
                if ($result->isSubscriptionExpired()) {
                    // Remove expired subscription
                    $endpoint = $result->getRequest()->getUri()->__toString();
                    PushSubscription::where('endpoint', $endpoint)->delete();
                    Log::info('Removed expired push subscription', ['endpoint' => $endpoint]);
                }
            }
        }

        return $sent;
    }

    /**
     * Send a notification to all users with push subscriptions.
     */
    public function sendToAll(array $payload): int
    {
        $subscriptions = PushSubscription::with('user')->get();
        $sent = 0;

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding ?? 'aesgcm',
                ]);

                $this->webPush->queueNotification(
                    $subscription,
                    json_encode($payload)
                );

                $sent++;
            } catch (\Exception $e) {
                Log::warning('Failed to queue push notification', [
                    'subscription_id' => $sub->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $results = $this->webPush->flush();

        if ($results) {
            foreach ($results as $result) {
                if ($result->isSubscriptionExpired()) {
                    $endpoint = $result->getRequest()->getUri()->__toString();
                    PushSubscription::where('endpoint', $endpoint)->delete();
                }
            }
        }

        return $sent;
    }

    /**
     * Build a notification payload for the service worker.
     */
    public static function buildPayload(
        string $title,
        string $body,
        string $type = 'general',
        string $icon = '/icon.svg',
        ?string $url = null,
        array  $extra = []
    ): array {
        return array_merge([
            'title' => $title,
            'body' => $body,
            'type' => $type,
            'icon' => $icon,
            'badge' => '/icon.svg',
            'url' => $url ?? '/notifications',
            'timestamp' => now()->toIso8601String(),
        ], $extra);
    }
}
