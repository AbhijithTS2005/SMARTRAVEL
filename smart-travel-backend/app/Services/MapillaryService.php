<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Mapillary API Service
 *
 * Fetches street-level and location photos from Mapillary (Meta's open street imagery platform).
 * Free signup at https://www.mapillary.com/developer — get a Client Access Token.
 *
 * API Docs: https://www.mapillary.com/developer/api-documentation
 */
class MapillaryService
{
    private ?string $accessToken;
    private string $baseUrl = 'https://graph.mapillary.com';
    private int $cacheDays = 7; // Cache photos for 7 days

    public function __construct()
    {
        $this->accessToken = config('services.mapillary.access_token', '');
    }

    /**
     * Get photos for a destination using its coordinates.
     *
     * Strategy:
     * 1. Create a bounding box around the destination's lat/lng
     * 2. Search Mapillary for images within that bbox
     * 3. Return the best quality images sorted by most recent
     *
     * @param \App\Models\Destination $destination
     * @param int $limit Number of photos to return
     * @return array Array of photo data with URLs and attribution
     */
    public function getDestinationPhotos($destination, int $limit = 4): array
    {
        if (empty($this->accessToken)) {
            Log::warning('Mapillary: No access token configured. Set MAPILLARY_ACCESS_TOKEN in .env');
            return [];
        }

        $cacheKey = "mapillary_dest_{$destination->id}";

        return Cache::remember($cacheKey, now()->addDays($this->cacheDays), function () use ($destination, $limit) {
            return $this->searchByCoordinates(
                (float) $destination->latitude,
                (float) $destination->longitude,
                $limit
            );
        });
    }

    /**
     * Search for images near specific coordinates.
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @param int $limit Max images to return
     * @param float $radiusDeg Search radius in degrees (~0.005 = ~500m, 0.01 = ~1km)
     * @return array Photos with URLs and attribution
     */
    public function searchByCoordinates(float $lat, float $lon, int $limit = 4, float $radiusDeg = 0.01): array
    {
        try {
            // Create bounding box around the point
            // ~0.01 degrees ≈ 1.1km at equator, good for finding nearby imagery
            $bbox = implode(',', [
                $lon - $radiusDeg, // west
                $lat - $radiusDeg, // south
                $lon + $radiusDeg, // east
                $lat + $radiusDeg, // north
            ]);

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::get("{$this->baseUrl}/images", [
                'access_token' => $this->accessToken,
                'fields' => 'id,captured_at,thumb_1024_url,thumb_2048_url,thumb_256_url,thumb_original_url,compass_angle,geometry,creator',
                'bbox' => $bbox,
                'limit' => $limit,
                'is_pano' => 'false', // Regular photos (not 360°) look better as thumbnails
            ]);

            if (!$response->successful()) {
                Log::warning('Mapillary API request failed', [
                    'status' => $response->status(),
                    'lat' => $lat,
                    'lon' => $lon,
                    'body' => $response->body(),
                ]);

                // If no results with small radius, try wider search (~5km)
                if ($radiusDeg < 0.05) {
                    Log::info('Mapillary: Expanding search radius', ['lat' => $lat, 'lon' => $lon]);
                    return $this->searchByCoordinates($lat, $lon, $limit, 0.05);
                }

                return [];
            }

            $data = $response->json();
            $photos = [];

            foreach ($data['data'] ?? [] as $image) {
                $photos[] = [
                    'id' => $image['id'] ?? null,
                    'original' => $image['thumb_original_url'] ?? $image['thumb_2048_url'] ?? '',
                    'large' => $image['thumb_2048_url'] ?? $image['thumb_1024_url'] ?? '',
                    'medium' => $image['thumb_1024_url'] ?? '',
                    'small' => $image['thumb_256_url'] ?? '',
                    'captured_at' => $image['captured_at'] ?? null,
                    'attribution' => 'Mapillary — © Contributors, CC BY-SA',
                    'creator' => $image['creator']['username'] ?? 'Mapillary User',
                    'link' => "https://www.mapillary.com/app/?pKey={$image['id']}",
                ];
            }

            // If no results found with current radius, try wider
            if (empty($photos) && $radiusDeg < 0.05) {
                Log::info('Mapillary: No photos found, expanding search', ['lat' => $lat, 'lon' => $lon]);
                return $this->searchByCoordinates($lat, $lon, $limit, 0.05);
            }

            return $photos;
        } catch (\Exception $e) {
            Log::error('Mapillary API error', [
                'error' => $e->getMessage(),
                'lat' => $lat,
                'lon' => $lon,
            ]);

            return [];
        }
    }

    /**
     * Get a single image by Mapillary image ID.
     *
     * @param string $imageId Mapillary image ID
     * @return array|null Photo data or null if not found
     */
    public function getImage(string $imageId): ?array
    {
        $cacheKey = "mapillary_img_{$imageId}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($imageId) {
            try {
                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::get("{$this->baseUrl}/{$imageId}", [
                    'access_token' => $this->accessToken,
                    'fields' => 'id,captured_at,thumb_1024_url,thumb_2048_url,thumb_256_url,thumb_original_url,compass_angle,geometry,creator',
                ]);

                if ($response->successful()) {
                    $image = $response->json();

                    return [
                        'id' => $image['id'],
                        'original' => $image['thumb_original_url'] ?? $image['thumb_2048_url'] ?? '',
                        'large' => $image['thumb_2048_url'] ?? $image['thumb_1024_url'] ?? '',
                        'medium' => $image['thumb_1024_url'] ?? '',
                        'small' => $image['thumb_256_url'] ?? '',
                        'captured_at' => $image['captured_at'] ?? null,
                        'attribution' => 'Mapillary — © Contributors, CC BY-SA',
                        'creator' => $image['creator']['username'] ?? 'Mapillary User',
                        'link' => "https://www.mapillary.com/app/?pKey={$image['id']}",
                    ];
                }

                return null;
            } catch (\Exception $e) {
                Log::error('Mapillary getImage error', [
                    'imageId' => $imageId,
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }

    /**
     * Check if the service is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->accessToken);
    }
}
