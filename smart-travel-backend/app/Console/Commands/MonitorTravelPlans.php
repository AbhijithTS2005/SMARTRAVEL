<?php

namespace App\Console\Commands;

use App\Models\TravelPlan;
use App\Models\User;
use App\Models\UserPreference;
use App\Services\OpenWeatherService;
use App\Services\RecommendationEngine;
use App\Models\Notification;
use App\Notifications\TravelAlertNotification;
use App\Mail\TravelAlertMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MonitorTravelPlans extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'travel:monitor-plans';

    /**
     * The console command description.
     */
    protected $description = 'Monitor active travel plans for severe weather and environmental alerts';

    private OpenWeatherService $weatherService;
    private RecommendationEngine $recommendationEngine;

    public function __construct(OpenWeatherService $weatherService, RecommendationEngine $recommendationEngine)
    {
        parent::__construct();
        $this->weatherService = $weatherService;
        $this->recommendationEngine = $recommendationEngine;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(): int
    {
        $this->info('🔍 Starting travel plan monitoring...');

        // Get all active travel plans
        /** @var \Illuminate\Database\Eloquent\Collection<int, TravelPlan> $activePlans */
        $activePlans = TravelPlan::with(['destination', 'user'])
            ->active()
            ->get();

        if ($activePlans->isEmpty()) {
            $this->info('✅ No active travel plans to monitor.');
            return self::SUCCESS;
        }

        $this->info("📊 Monitoring {$activePlans->count()} active travel plans...");

        $alertsCreated = 0;

        /** @var TravelPlan $plan */
        foreach ($activePlans as $plan) {
            $locationName = $plan->getLocationName();
            $lat = $plan->getLatitude();
            $lng = $plan->getLongitude();

            if (!$lat || !$lng) {
                $this->warn("   ⚠️  Skipping plan #{$plan->id}: no coordinates available");
                continue;
            }

            $this->line("   Checking: {$locationName} for {$plan->user->name}");

            // Check if plan end date has passed
            if ($plan->end_date < now()->toDateString()) {
                $this->line("   ⏰ Plan expired, marking as completed...");
                $plan->complete();
                continue;
            }

            // Auto-transition: planned → active when start_date has arrived
            if ($plan->status === 'planned' && $plan->start_date <= now()->toDateString()) {
                $this->info("   🚀 Start date reached, activating plan...");
                $plan->activate();
            }

            // Get live environmental data
            $environmentalData = $this->weatherService->getCompleteData($lat, $lng);

            // Check for severe conditions
            if ($this->weatherService->isSevereCondition($environmentalData)) {
                $this->warn("   ⚠️  SEVERE CONDITIONS DETECTED!");

                // Get user preferences for alternatives
                $preferences = UserPreference::where('user_id', $plan->user_id)->first();

                // Generate safer alternatives
                $alternatives = [];
                if ($preferences) {
                    $alternatives = $this->recommendationEngine->findAlternatives(
                        $preferences,
                        3,
                        $plan->destination_id,
                        $locationName
                    );
                }

                // Build alert message
                $alertHelper = new TravelAlertNotification([
                    'plan_id' => $plan->id,
                    'destination' => $locationName,
                    'alerts' => $environmentalData['alerts'],
                    'aqi' => $environmentalData['air_quality'],
                    'weather' => $environmentalData['weather'],
                    'safer_alternatives' => $alternatives,
                ]);
                $alertData = $alertHelper->toArray($plan->user);

                // Create notification using custom Notification model
                Notification::create([
                    'user_id' => $plan->user_id,
                    'destination_id' => $plan->destination_id,
                    'notification_type' => 'weather_alert',
                    'title' => "⚠️ Travel Alert: {$locationName}",
                    'message' => $alertData['message'],
                    'data' => $alertData,
                    'is_read' => false,
                    'sent_at' => now(),
                ]);

                // Send email alert to the user
                try {
                    Mail::to($plan->user->email)->send(
                        new TravelAlertMail($alertData, $locationName)
                    );
                    $this->warn("   📧 Email alert sent to {$plan->user->email}");
                } catch (\Exception $e) {
                    $this->error("   ❌ Failed to send email to {$plan->user->email}: {$e->getMessage()}");
                    Log::error('Failed to send travel alert email', [
                        'user_id' => $plan->user_id,
                        'email' => $plan->user->email,
                        'error' => $e->getMessage(),
                    ]);
                }

                $alertsCreated++;
                $this->warn("   📧 Alert notification saved for {$plan->user->email}");

                // Send web push notification
                try {
                    $webPush = new \App\Services\WebPushService();
                    $pushPayload = \App\Services\WebPushService::buildPayload(
                        "⚠️ Travel Alert: {$locationName}",
                        $alertData['message'],
                        'weather_alert',
                        '/icon.svg',
                        "/destinations/{$plan->destination_id}"
                    );
                    $pushSent = $webPush->sendToUser($plan->user, $pushPayload);
                    if ($pushSent > 0) {
                        $this->warn("   📱 Push notification sent to {$pushSent} device(s)");
                    }
                } catch (\Exception $e) {
                    $this->error("   ❌ Push notification failed: {$e->getMessage()}");
                }

                // Log the alert
                Log::warning('Travel Alert Created', [
                    'plan_id' => $plan->id,
                    'user_id' => $plan->user_id,
                    'destination' => $plan->destination->name,
                    'severity' => 'high',
                    'conditions' => $environmentalData,
                ]);
            } else {
                $this->info("   ✅ Conditions normal");
            }
        }

        $this->info("\n✅ Monitoring complete!");
        $this->info("   Checked: {$activePlans->count()} plans");
        $this->info("   Alerts created: {$alertsCreated}");

        return self::SUCCESS;
    }
}
