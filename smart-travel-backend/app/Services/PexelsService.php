<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PexelsService
{
    protected $apiKey;
    protected $baseUrl = 'https://api.pexels.com/v1';

    public function __construct()
    {
        $this->apiKey = env('PEXELS_API_KEY');
    }

    /**
     * Search for photos based on query
     *
     * @param string $query Search query (e.g., "Munnar Kerala")
     * @param int $perPage Number of photos to return (default: 4)
     * @return array Array of photo URLs
     */
    public function searchPhotos(string $query, int $perPage = 4): array
    {
        // Cache key based on query
        $cacheKey = 'pexels_photos_' . md5($query);

        // Return cached results if available (cache for 7 days)
        return Cache::remember($cacheKey, 60 * 24 * 7, function () use ($query, $perPage) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => $this->apiKey,
                ])->get("{$this->baseUrl}/search", [
                            'query' => $query,
                            'per_page' => $perPage,
                            'orientation' => 'landscape',
                        ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $photos = [];

                    foreach ($data['photos'] ?? [] as $photo) {
                        $photos[] = [
                            'original' => $photo['src']['original'] ?? '',
                            'large' => $photo['src']['large2x'] ?? '',
                            'medium' => $photo['src']['large'] ?? '',
                            'small' => $photo['src']['medium'] ?? '',
                        ];
                    }

                    return $photos;
                }

                Log::warning('Pexels API request failed', [
                    'status' => $response->status(),
                    'query' => $query,
                ]);

                return [];
            } catch (\Exception $e) {
                Log::error('Pexels API error', [
                    'error' => $e->getMessage(),
                    'query' => $query,
                ]);

                return [];
            }
        });
    }

    /**
     * Get photos for a destination
     *
     * @param \App\Models\Destination $destination
     * @return array Array of photo URLs
     */
    public function getDestinationPhotos($destination): array
    {
        // Build search query from destination details
        $query = "{$destination->name} {$destination->district} Kerala India travel";

        return $this->searchPhotos($query, 4);
    }
}
