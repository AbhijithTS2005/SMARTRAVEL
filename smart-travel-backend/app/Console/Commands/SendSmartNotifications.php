<?php

namespace App\Console\Commands;

use App\Models\Destination;
use App\Models\Notification;
use App\Models\TravelPlan;
use App\Models\User;
use App\Models\UserPreference;
use App\Services\OpenWeatherService;
use App\Services\WebPushService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendSmartNotifications extends Command
{
    protected $signature = 'travel:send-notifications {--type=all : Type of notification to send (all, weather, aqi, disaster, season, recommendation, match, general)}';

    protected $description = 'Generate and send smart push notifications for all types: weather, AQI, disasters, travel seasons, recommendations, new matches, and general tips';

    private OpenWeatherService $weatherService;

    public function __construct(OpenWeatherService $weatherService)
    {
        parent::__construct();
        $this->weatherService = $weatherService;
    }

    public function handle(): int
    {
        $type = $this->option('type');
        $this->info("🔔 Starting smart notification engine (type: {$type})...");

        $totalSent = 0;

        if (in_array($type, ['all', 'weather'])) {
            $totalSent += $this->sendWeatherAlerts();
        }
        if (in_array($type, ['all', 'aqi'])) {
            $totalSent += $this->sendAqiWarnings();
        }
        if (in_array($type, ['all', 'disaster'])) {
            $totalSent += $this->sendDisasterAlerts();
        }
        if (in_array($type, ['all', 'season'])) {
            $totalSent += $this->sendTravelSeasonNotifications();
        }
        if (in_array($type, ['all', 'recommendation'])) {
            $totalSent += $this->sendRecommendationUpdates();
        }
        if (in_array($type, ['all', 'match'])) {
            $totalSent += $this->sendNewMatchNotifications();
        }
        if (in_array($type, ['all', 'general'])) {
            $totalSent += $this->sendGeneralNotifications();
        }

        $this->info("✅ Done! Total notifications created: {$totalSent}");
        return self::SUCCESS;
    }

    /**
     * ⛈️ WEATHER ALERTS — Heavy rain, storms, high winds at planned destinations
     */
    private function sendWeatherAlerts(): int
    {
        $this->info('  ⛈️  Checking weather alerts...');
        $count = 0;

        $activePlans = TravelPlan::with(['destination', 'user'])
            ->where('status', 'active')
            ->orWhere(function ($q) {
                $q->where('status', 'planned')
                  ->where('start_date', '<=', now()->addDays(3)->toDateString());
            })
            ->get();

        /** @var TravelPlan $plan */
        foreach ($activePlans as $plan) {
            $lat = $plan->getLatitude();
            $lng = $plan->getLongitude();
            if (!$lat || !$lng) continue;

            $weather = $this->weatherService->getCurrentWeather($lat, $lng);
            if (!$weather) continue;

            $alerts = [];

            // Heavy rain
            if ($weather['rain'] > 20) {
                $alerts[] = "Heavy rainfall ({$weather['rain']}mm/hr)";
            }

            // Storm
            if (in_array($weather['weather'], ['Thunderstorm', 'Squall', 'Tornado'])) {
                $alerts[] = "Storm: {$weather['description']}";
            }

            // High wind
            if ($weather['wind_speed'] > 12) {
                $alerts[] = "Strong winds ({$weather['wind_speed']} m/s)";
            }

            // Extreme temperature
            if ($weather['temperature'] > 42) {
                $alerts[] = "Extreme heat ({$weather['temperature']}°C)";
            } elseif ($weather['temperature'] < 2) {
                $alerts[] = "Extreme cold ({$weather['temperature']}°C)";
            }

            if (!empty($alerts)) {
                $locationName = $plan->getLocationName();
                $message = implode(', ', $alerts);

                if ($this->createAndPush($plan->user, [
                    'type' => 'weather_alert',
                    'destination_id' => $plan->destination_id,
                    'title' => "⛈️ Weather Alert: {$locationName}",
                    'message' => "Severe weather at your destination: {$message}. Consider adjusting your plans.",
                    'alert_type' => 'weather_alert',
                    'destination_name' => $locationName,
                    'conditions' => $alerts,
                    'temperature' => $weather['temperature'],
                ])) {
                    $count++;
                }
            }
        }

        $this->info("    → {$count} weather alerts sent");
        return $count;
    }

    /**
     * 🌫️ AQI WARNINGS — Poor air quality at destinations
     */
    private function sendAqiWarnings(): int
    {
        $this->info('  🌫️  Checking AQI warnings...');
        $count = 0;

        $activePlans = TravelPlan::with(['destination', 'user'])
            ->where('status', 'active')
            ->get();

        /** @var TravelPlan $plan */
        foreach ($activePlans as $plan) {
            $lat = $plan->getLatitude();
            $lng = $plan->getLongitude();
            if (!$lat || !$lng) continue;

            $aqi = $this->weatherService->getAirQuality($lat, $lng);
            if (!$aqi || $aqi['aqi_value'] <= 150) continue;

            $locationName = $plan->getLocationName();
            $severity = $aqi['aqi_value'] > 250 ? 'Hazardous' : ($aqi['aqi_value'] > 200 ? 'Very Unhealthy' : 'Unhealthy');

            if ($this->createAndPush($plan->user, [
                'type' => 'aqi_warning',
                'destination_id' => $plan->destination_id,
                'title' => "🌫️ Air Quality Warning: {$locationName}",
                'message' => "AQI is {$aqi['aqi_value']} ({$severity}). Outdoor activities are not recommended. Consider wearing a mask or rescheduling.",
                'alert_type' => 'aqi_warning',
                'destination_name' => $locationName,
                'aqi_value' => $aqi['aqi_value'],
                'aqi_status' => $aqi['aqi_status'],
                'severity' => $severity,
            ])) {
                $count++;
            }
        }

        $this->info("    → {$count} AQI warnings sent");
        return $count;
    }

    /**
     * 🚨 DISASTER ALERTS — Severe storms, tornados, extreme events
     */
    private function sendDisasterAlerts(): int
    {
        $this->info('  🚨 Checking disaster alerts...');
        $count = 0;

        $activePlans = TravelPlan::with(['destination', 'user'])
            ->whereIn('status', ['active', 'planned'])
            ->get();

        /** @var TravelPlan $plan */
        foreach ($activePlans as $plan) {
            $lat = $plan->getLatitude();
            $lng = $plan->getLongitude();
            if (!$lat || !$lng) continue;

            $weather = $this->weatherService->getCurrentWeather($lat, $lng);
            if (!$weather) continue;

            $isDisaster = false;
            $disasterType = '';

            if (in_array($weather['weather'], ['Tornado', 'Squall'])) {
                $isDisaster = true;
                $disasterType = $weather['weather'];
            } elseif ($weather['rain'] > 100) {
                $isDisaster = true;
                $disasterType = 'Flooding Risk';
            } elseif ($weather['wind_speed'] > 25) {
                $isDisaster = true;
                $disasterType = 'Cyclone/Hurricane Warning';
            }

            if ($isDisaster) {
                $locationName = $plan->getLocationName();

                if ($this->createAndPush($plan->user, [
                    'type' => 'disaster_alert',
                    'destination_id' => $plan->destination_id,
                    'title' => "🚨 EMERGENCY: {$disasterType} at {$locationName}",
                    'message' => "A {$disasterType} has been detected near your destination. Please exercise extreme caution and follow local authority guidelines immediately.",
                    'alert_type' => 'disaster_alert',
                    'destination_name' => $locationName,
                    'disaster_type' => $disasterType,
                    'severity' => 'critical',
                ])) {
                    $count++;
                }
            }
        }

        $this->info("    → {$count} disaster alerts sent");
        return $count;
    }

    /**
     * 🌴 TRAVEL SEASON — Best time to visit based on current month
     */
    private function sendTravelSeasonNotifications(): int
    {
        $this->info('  🌴 Checking travel season tips...');
        $count = 0;

        $month = now()->format('F');
        $monthNum = (int)now()->format('n');

        // Kerala seasonal recommendations
        $seasonalTips = [
            // Oct–Feb: Best season (post-monsoon, pleasant weather)
            10 => ['season' => 'Peak Season', 'tip' => 'Perfect weather for hill stations and backwaters! Book popular spots early.'],
            11 => ['season' => 'Peak Season', 'tip' => 'Ideal time for Munnar and Wayanad. Cool weather and clear skies!'],
            12 => ['season' => 'Peak Season', 'tip' => 'Best month for wildlife safaris at Periyar and Wayanad sanctuaries.'],
            1  => ['season' => 'Peak Season', 'tip' => 'Great time for houseboat cruises in Alleppey backwaters.'],
            2  => ['season' => 'Peak Season', 'tip' => 'Last month of peak season! Beach destinations are perfect now.'],
            // Mar–May: Summer (hot but good for hill stations)
            3  => ['season' => 'Summer', 'tip' => 'Head to hill stations like Munnar and Vagamon to beat the heat!'],
            4  => ['season' => 'Summer', 'tip' => 'Waterfalls are at their best! Visit Athirappilly and Vazhachal Falls.'],
            5  => ['season' => 'Summer', 'tip' => 'Pre-monsoon showers starting. Great deals on beach resorts!'],
            // Jun–Sep: Monsoon (Ayurveda season)
            6  => ['season' => 'Monsoon', 'tip' => 'Monsoon is here! Best time for Ayurveda treatments in Kerala.'],
            7  => ['season' => 'Monsoon', 'tip' => 'Heavy monsoon - perfect for rejuvenating Ayurveda stays at discounted prices.'],
            8  => ['season' => 'Monsoon', 'tip' => 'Onam festival this month! Experience Kerala culture at its finest.'],
            9  => ['season' => 'Monsoon', 'tip' => 'Monsoon retreating. Lush green landscapes perfect for photography!'],
        ];

        $tip = $seasonalTips[$monthNum] ?? ['season' => 'Explore', 'tip' => 'Great time to explore Kerala!'];

        // Only send to users who have preferences and haven't received a season tip in the last 7 days
        $users = User::whereHas('preferences')
            ->whereDoesntHave('notifications', function ($q) {
                $q->where('notification_type', 'travel_season')
                  ->where('created_at', '>', now()->subDays(7));
            })
            ->limit(50)
            ->get();

        /** @var User $user */
        foreach ($users as $user) {
            if ($this->createAndPush($user, [
                'type' => 'travel_season',
                'title' => "🌴 {$month} Travel Tip: {$tip['season']}",
                'message' => $tip['tip'],
                'alert_type' => 'travel_season',
                'season' => $tip['season'],
                'month' => $month,
            ])) {
                $count++;
            }
        }

        $this->info("    → {$count} season tips sent");
        return $count;
    }

    /**
     * 🎯 RECOMMENDATION UPDATES — When conditions change at recommended destinations
     */
    private function sendRecommendationUpdates(): int
    {
        $this->info('  🎯 Checking recommendation updates...');
        $count = 0;

        // Find destinations in wishlists where conditions have improved
        $users = User::whereHas('wishlists')
            ->whereDoesntHave('notifications', function ($q) {
                $q->where('notification_type', 'recommendation_update')
                  ->where('created_at', '>', now()->subDays(3));
            })
            ->with(['wishlistedDestinations' => function ($q) {
                $q->limit(5);
            }])
            ->limit(30)
            ->get();

        /** @var User $user */
        foreach ($users as $user) {
            foreach ($user->wishlistedDestinations as $dest) {
                if (!$dest->latitude || !$dest->longitude) continue;

                $weather = $this->weatherService->getCurrentWeather($dest->latitude, $dest->longitude);
                $aqi = $this->weatherService->getAirQuality($dest->latitude, $dest->longitude);

                if (!$weather || !$aqi) continue;

                // Notify if conditions are good
                $isGood = $aqi['aqi_value'] < 80
                    && $weather['temperature'] >= 20
                    && $weather['temperature'] <= 35
                    && $weather['rain'] < 5
                    && !in_array($weather['weather'], ['Thunderstorm', 'Squall', 'Tornado']);

                if ($isGood) {
                    if ($this->createAndPush($user, [
                        'type' => 'recommendation_update',
                        'destination_id' => $dest->id,
                        'title' => "🎯 Perfect Conditions: {$dest->name}",
                        'message' => "Your wishlisted destination {$dest->name} has great weather right now! {$weather['temperature']}°C with {$weather['description']}. AQI: {$aqi['aqi_value']} (Good).",
                        'alert_type' => 'recommendation_update',
                        'destination_name' => $dest->name,
                        'temperature' => $weather['temperature'],
                        'aqi_value' => $aqi['aqi_value'],
                        'weather' => $weather['description'],
                    ])) {
                        $count++;
                        break; // One notification per user
                    }
                }
            }
        }

        $this->info("    → {$count} recommendation updates sent");
        return $count;
    }

    /**
     * ✨ NEW MATCH — When a destination gets a high match score for a user
     */
    private function sendNewMatchNotifications(): int
    {
        $this->info('  ✨ Checking new matches...');
        $count = 0;

        // Find users with preferences who haven't received a match notification recently
        $users = User::whereHas('preferences')
            ->whereDoesntHave('notifications', function ($q) {
                $q->where('notification_type', 'new_match')
                  ->where('created_at', '>', now()->subDays(5));
            })
            ->with('preferences')
            ->limit(20)
            ->get();

        /** @var User $user */
        foreach ($users as $user) {
            $prefs = $user->preferences;
            if (!$prefs) continue;

            // Find a destination that matches user's preferred category and has good conditions
            $query = Destination::query();

            if ($prefs->preferred_categories) {
                $categories = is_array($prefs->preferred_categories)
                    ? $prefs->preferred_categories
                    : json_decode($prefs->preferred_categories, true);

                if (!empty($categories)) {
                    $query->where(function ($q) use ($categories) {
                        foreach ($categories as $cat) {
                            $q->orWhere('category', 'like', "%{$cat}%");
                        }
                    });
                }
            }

            $destination = $query->inRandomOrder()->first();

            if ($destination) {
                if ($this->createAndPush($user, [
                    'type' => 'new_match',
                    'destination_id' => $destination->id,
                    'title' => "✨ New Match: {$destination->name}",
                    'message' => "We found a new destination that matches your preferences! {$destination->name} in {$destination->district} — tap to explore.",
                    'alert_type' => 'new_match',
                    'destination_name' => $destination->name,
                    'district' => $destination->district,
                ])) {
                    $count++;
                }
            }
        }

        $this->info("    → {$count} new match notifications sent");
        return $count;
    }

    /**
     * 💡 GENERAL — Travel tips, safety reminders, app updates
     */
    private function sendGeneralNotifications(): int
    {
        $this->info('  💡 Checking general notifications...');
        $count = 0;

        $tips = [
            [
                'title' => '💡 Travel Tip: Pack Smart',
                'message' => 'Use our AI packing list generator to get a customized packing list based on your destination\'s weather!',
            ],
            [
                'title' => '🛡️ Safety Reminder',
                'message' => 'Have you added your emergency contacts? Set them up in the Emergency section for instant SOS alerts during travel.',
            ],
            [
                'title' => '⭐ Rate Your Experience',
                'message' => 'Recently visited a destination? Leave a review to help fellow travelers and earn achievement badges!',
            ],
            [
                'title' => '📱 Pro Tip: Install the App',
                'message' => 'Add SmarTravel to your home screen for offline access and instant push notifications on the go!',
            ],
            [
                'title' => '🗺️ Explore Nearby',
                'message' => 'Enable location access to discover hidden gems near you with real-time safety and weather data.',
            ],
        ];

        // Pick a random tip
        $tip = $tips[array_rand($tips)];

        // Send to users who haven't received a general notification in the last 7 days
        $users = User::whereDoesntHave('notifications', function ($q) {
                $q->where('notification_type', 'general')
                  ->where('created_at', '>', now()->subDays(7));
            })
            ->limit(30)
            ->get();

        /** @var User $user */
        foreach ($users as $user) {
            if ($this->createAndPush($user, [
                'type' => 'general',
                'title' => $tip['title'],
                'message' => $tip['message'],
                'alert_type' => 'general',
            ])) {
                $count++;
            }
        }

        $this->info("    → {$count} general tips sent");
        return $count;
    }

    /**
     * Helper: Create a notification record and send push notification.
     */
    private function createAndPush(User $user, array $data): bool
    {
        try {
            // Avoid duplicate notifications: check if same type+destination was sent in last 6 hours
            $exists = Notification::where('user_id', $user->id)
                ->where('notification_type', $data['type'])
                ->when(isset($data['destination_id']), function ($q) use ($data) {
                    $q->where('destination_id', $data['destination_id']);
                })
                ->where('created_at', '>', now()->subHours(6))
                ->exists();

            if ($exists) {
                return false;
            }

            // Save to database
            $notification = Notification::create([
                'user_id' => $user->id,
                'destination_id' => $data['destination_id'] ?? null,
                'notification_type' => $data['type'],
                'title' => $data['title'],
                'message' => $data['message'],
                'data' => $data,
                'is_read' => false,
                'sent_at' => now(),
            ]);

            // Send web push notification
            try {
                $webPush = new WebPushService();
                $payload = WebPushService::buildPayload(
                    $data['title'],
                    $data['message'],
                    $data['alert_type'] ?? $data['type'],
                    '/icon.svg',
                    isset($data['destination_id'])
                        ? "/destinations/{$data['destination_id']}"
                        : '/notifications'
                );
                $webPush->sendToUser($user, $payload);
            } catch (\Exception $e) {
                Log::warning('Push notification failed (DB notification still saved)', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $user->id,
                'type' => $data['type'],
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
