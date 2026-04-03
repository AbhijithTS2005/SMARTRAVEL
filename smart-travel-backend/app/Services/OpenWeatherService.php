<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenWeatherService
{
    private ?string $apiKey;
    private ?string $baseUrl;
    private int $cacheDuration = 1800; // 30 minutes in seconds

    public function __construct()
    {
        $this->apiKey = config('services.openweather.api_key');
        $this->baseUrl = config('services.openweather.base_url', 'https://api.openweathermap.org/data/3.0');
    }

    /**
     * Get air quality data for a location.
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array|null
     */
    public function getAirQuality(float $lat, float $lon): ?array
    {
        $cacheKey = "aqi_{$lat}_{$lon}";

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($lat, $lon) {
            try {
                $url = "http://api.openweathermap.org/data/2.5/air_pollution";

                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::get($url, [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (isset($data['list'][0])) {
                        $pollution = $data['list'][0];

                        return [
                            'aqi' => $pollution['main']['aqi'],
                            'aqi_value' => $this->convertAqiToValue($pollution['main']['aqi']),
                            'aqi_status' => $this->getAqiStatus($pollution['main']['aqi']),
                            'components' => $pollution['components'] ?? [],
                            'timestamp' => $pollution['dt'],
                        ];
                    }
                }

                Log::warning('OpenWeather AQI API failed', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'status' => $response->status()
                ]);

                return null;
            } catch (\Exception $e) {
                Log::error('OpenWeather AQI error', [
                    'message' => $e->getMessage(),
                    'lat' => $lat,
                    'lon' => $lon
                ]);

                return null;
            }
        });
    }

    /**
     * Get current weather data for a location.
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array|null
     */
    public function getCurrentWeather(float $lat, float $lon): ?array
    {
        $cacheKey = "weather_{$lat}_{$lon}";

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($lat, $lon) {
            try {
                $url = "http://api.openweathermap.org/data/2.5/weather";

                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::get($url, [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $this->apiKey,
                    'units' => 'metric',
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    return [
                        'temperature' => $data['main']['temp'],
                        'feels_like' => $data['main']['feels_like'],
                        'temp_min' => $data['main']['temp_min'],
                        'temp_max' => $data['main']['temp_max'],
                        'humidity' => $data['main']['humidity'],
                        'pressure' => $data['main']['pressure'],
                        'weather' => $data['weather'][0]['main'] ?? 'Unknown',
                        'description' => $data['weather'][0]['description'] ?? '',
                        'wind_speed' => $data['wind']['speed'] ?? 0,
                        'clouds' => $data['clouds']['all'] ?? 0,
                        'rain' => $data['rain']['1h'] ?? 0, // Rainfall in last hour
                        'timestamp' => $data['dt'],
                    ];
                }

                Log::warning('OpenWeather current weather API failed', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'status' => $response->status()
                ]);

                return null;
            } catch (\Exception $e) {
                Log::error('OpenWeather current weather error', [
                    'message' => $e->getMessage(),
                    'lat' => $lat,
                    'lon' => $lon
                ]);

                return null;
            }
        });
    }

    /**
     * Get weather alerts for a location (if any).
     * Note: Alerts are only available in One Call API 3.0 (paid tier)
     * For free tier, we check weather conditions manually
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array
     */
    public function getWeatherAlerts(float $lat, float $lon): array
    {
        $weather = $this->getCurrentWeather($lat, $lon);
        $alerts = [];

        if (!$weather) {
            return $alerts;
        }

        // Heavy rain alert
        if ($weather['rain'] > 50) {
            $alerts[] = [
                'type' => 'Heavy Rainfall',
                'severity' => 'High',
                'description' => "Heavy rainfall detected: {$weather['rain']}mm/hour",
            ];
        } elseif ($weather['rain'] > 20) {
            $alerts[] = [
                'type' => 'Moderate Rainfall',
                'severity' => 'Medium',
                'description' => "Moderate rainfall: {$weather['rain']}mm/hour",
            ];
        }

        // Storm/thunderstorm alert
        if (in_array($weather['weather'], ['Thunderstorm', 'Squall', 'Tornado'])) {
            $alerts[] = [
                'type' => 'Storm Warning',
                'severity' => 'High',
                'description' => "Storm conditions: {$weather['description']}",
            ];
        }

        // High wind alert
        if ($weather['wind_speed'] > 15) {
            $alerts[] = [
                'type' => 'High Wind',
                'severity' => 'Medium',
                'description' => "Strong winds: {$weather['wind_speed']} m/s",
            ];
        }

        return $alerts;
    }

    /**
     * Get complete environmental data (AQI + Weather + Alerts).
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array
     */
    public function getCompleteData(float $lat, float $lon): array
    {
        return [
            'air_quality' => $this->getAirQuality($lat, $lon),
            'weather' => $this->getCurrentWeather($lat, $lon),
            'alerts' => $this->getWeatherAlerts($lat, $lon),
            'fetched_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Convert OpenWeather AQI index (1-5) to approximate AQI value (0-500).
     */
    private function convertAqiToValue(int $index): int
    {
        $mapping = [
            1 => 25,   // Good (0-50)
            2 => 75,   // Fair (51-100)
            3 => 125,  // Moderate (101-150)
            4 => 175,  // Poor (151-200)
            5 => 275,  // Very Poor (201-300)
        ];

        return $mapping[$index] ?? 50;
    }

    /**
     * Get human-readable AQI status.
     */
    private function getAqiStatus(int $index): string
    {
        $statuses = [
            1 => 'Good',
            2 => 'Fair',
            3 => 'Moderate',
            4 => 'Poor',
            5 => 'Very Poor',
        ];

        return $statuses[$index] ?? 'Unknown';
    }

    /**
     * Calculate AQI score for recommendation engine (0-10 points).
     */
    public function calculateAqiScore(?array $aqiData): float
    {
        if (!$aqiData) {
            return 7; // Default moderate score if data unavailable
        }

        $aqiValue = $aqiData['aqi_value'];

        if ($aqiValue <= 50) {
            return 10; // Good
        } elseif ($aqiValue <= 100) {
            return 7; // Fair/Moderate
        } elseif ($aqiValue <= 150) {
            return 4; // Unhealthy for sensitive
        } elseif ($aqiValue <= 200) {
            return 2; // Unhealthy
        } else {
            return 0; // Very unhealthy/hazardous
        }
    }

    /**
     * Check if conditions are severe (require alert).
     */
    public function isSevereCondition(array $environmentalData): bool
    {
        $aqi = $environmentalData['air_quality'];
        $weather = $environmentalData['weather'];
        $alerts = $environmentalData['alerts'];

        // Severe AQI
        if ($aqi && $aqi['aqi_value'] > 180) {
            return true;
        }

        // Heavy rainfall
        if ($weather && $weather['rain'] > 50) {
            return true;
        }

        // Storm alerts
        if (!empty($alerts)) {
            foreach ($alerts as $alert) {
                if ($alert['severity'] === 'High') {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get weather by coordinates (simplified for recommendation engine)
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array|null
     */
    public function getWeatherByCoordinates(float $lat, float $lon): ?array
    {
        $weather = $this->getCurrentWeather($lat, $lon);

        if (!$weather) {
            return null;
        }

        return [
            'temperature' => $weather['temperature'],
            'feels_like' => $weather['feels_like'],
            'humidity' => $weather['humidity'],
            'weather_main' => $weather['weather'],
            'description' => $weather['description'],
            'wind_speed' => $weather['wind_speed'],
            'timestamp' => $weather['timestamp'],
        ];
    }

    /**
     * Geocode location name to coordinates
     *
     * @param string $location Location name (e.g., "Munnar, Kerala")
     * @return array|null [lat, lon, display_name]
     */
    public function geocodeLocation(string $location): ?array
    {
        $cacheKey = "geocode_" . md5($location);

        return Cache::remember($cacheKey, 86400, function () use ($location) { // Cache for 24 hours
            try {
                $url = "http://api.openweathermap.org/geo/1.0/direct";

                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::get($url, [
                    'q' => $location,
                    'limit' => 1,
                    'appid' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (!empty($data)) {
                        $result = $data[0];
                        return [
                            'lat' => $result['lat'],
                            'lon' => $result['lon'],
                            'name' => $result['name'] ?? $location,
                            'country' => $result['country'] ?? '',
                            'state' => $result['state'] ?? '',
                        ];
                    }
                }

                Log::warning('Geocoding failed', ['location' => $location]);
                return null;
            } catch (\Exception $e) {
                Log::error('Geocoding error', [
                    'message' => $e->getMessage(),
                    'location' => $location
                ]);
                return null;
            }
        });
    }

    /**
     * Reverse geocode coordinates to location name
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return string|null Location name
     */
    public function reverseGeocode(float $lat, float $lon): ?string
    {
        $cacheKey = "reverse_geocode_{$lat}_{$lon}";

        return Cache::remember($cacheKey, 86400, function () use ($lat, $lon) {
            try {
                $url = "http://api.openweathermap.org/geo/1.0/reverse";

                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::get($url, [
                    'lat' => $lat,
                    'lon' => $lon,
                    'limit' => 1,
                    'appid' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (!empty($data)) {
                        $result = $data[0];
                        $parts = array_filter([
                            $result['name'] ?? null,
                            $result['state'] ?? null,
                            $result['country'] ?? null,
                        ]);
                        return implode(', ', $parts);
                    }
                }

                return null;
            } catch (\Exception $e) {
                Log::error('Reverse geocoding error', [
                    'message' => $e->getMessage(),
                    'lat' => $lat,
                    'lon' => $lon
                ]);
                return null;
            }
        });
    }
}
