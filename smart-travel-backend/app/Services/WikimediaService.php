<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Wikimedia/Wikipedia Image Service
 *
 * Fetches REAL photos of specific destinations from Wikipedia & Wikimedia Commons.
 * This is free, no API key required, and returns actual photos of real places.
 *
 * Wikipedia API requires a descriptive User-Agent header on ALL requests.
 */
class WikimediaService
{
    private int $cacheDays = 30;
    private string $userAgent = 'SmartTravelApp/1.0 (https://smarttravel.local; smarttravel@example.com)';

    /**
     * Get a pre-configured HTTP client with required headers.
     */
    private function http(): PendingRequest
    {
        return Http::timeout(10)->withHeaders([
            'User-Agent' => $this->userAgent,
            'Accept' => 'application/json',
        ]);
    }

    /**
     * Get photos for a destination from Wikipedia.
     */
    public function getDestinationPhotos($destination, int $limit = 4): array
    {
        $cacheKey = "wikimedia_dest_{$destination->id}";

        return Cache::remember($cacheKey, now()->addDays($this->cacheDays), function () use ($destination, $limit) {
            // Try the REST API summary endpoint first (most reliable for main image)
            $photos = $this->getFromSummary($destination->name);

            // If no result, try with district name appended
            if (empty($photos)) {
                $photos = $this->getFromSummary("{$destination->name}, {$destination->district}");
            }

            // If still no result, try search API
            if (empty($photos)) {
                $photos = $this->getFromSearch($destination->name, $limit);
            }

            // Try with district
            if (empty($photos)) {
                $photos = $this->getFromSearch("{$destination->name} {$destination->district} Kerala", $limit);
            }

            return $photos;
        });
    }

    /**
     * Get the main image from Wikipedia page summary (REST API).
     * This is the most reliable way to get a relevant main image.
     */
    private function getFromSummary(string $title): array
    {
        try {
            $encodedTitle = rawurlencode(str_replace(' ', '_', $title));

            $response = $this->http()
                ->get("https://en.wikipedia.org/api/rest_v1/page/summary/{$encodedTitle}");

            if (!$response->successful()) {
                Log::debug("WikimediaService: Summary API returned {$response->status()} for '{$title}'");
                return [];
            }

            $data = $response->json();

            if (!empty($data['originalimage']['source'])) {
                $original = $data['originalimage']['source'];
                $thumbnail = $data['thumbnail']['source'] ?? $original;

                Log::info("WikimediaService: Found image for '{$title}' from summary API");

                return [
                    [
                        'original' => $original,
                        'large' => $this->getThumbUrl($original, 1200),
                        'medium' => $this->getThumbUrl($original, 800),
                        'small' => $thumbnail,
                        'attribution' => 'Wikipedia — © Wikimedia Commons',
                        'link' => "https://en.wikipedia.org/wiki/" . rawurlencode(str_replace(' ', '_', $data['title'] ?? $title)),
                    ]
                ];
            }

            return [];
        } catch (\Exception $e) {
            Log::debug("WikimediaService: Summary error for '{$title}': {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Search Wikipedia and find images from matching pages.
     */
    private function getFromSearch(string $query, int $limit): array
    {
        try {
            // Use the MediaWiki API to search and get page images in one call
            $response = $this->http()->get('https://en.wikipedia.org/w/api.php', [
                'action' => 'query',
                'generator' => 'search',
                'gsrsearch' => $query,
                'gsrlimit' => 5,
                'prop' => 'pageimages|pageterms',
                'piprop' => 'original|thumbnail',
                'pithumbsize' => 800,
                'format' => 'json',
                'formatversion' => 2,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $pages = $response->json()['query']['pages'] ?? [];
            $photos = [];

            foreach ($pages as $page) {
                if (!empty($page['original']['source'])) {
                    $original = $page['original']['source'];
                    $thumbnail = $page['thumbnail']['source'] ?? $original;

                    $photos[] = [
                        'original' => $original,
                        'large' => $this->getThumbUrl($original, 1200),
                        'medium' => $thumbnail,
                        'small' => $this->getThumbUrl($original, 400),
                        'attribution' => 'Wikipedia — © Wikimedia Commons',
                        'link' => "https://en.wikipedia.org/wiki/" . rawurlencode(str_replace(' ', '_', $page['title'])),
                    ];

                    if (count($photos) >= $limit) {
                        break;
                    }
                }
            }

            if (!empty($photos)) {
                Log::info("WikimediaService: Found " . count($photos) . " images via search for '{$query}'");
            }

            return $photos;
        } catch (\Exception $e) {
            Log::debug("WikimediaService: Search error for '{$query}': {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Generate a Wikimedia thumbnail URL at a specific width.
     */
    private function getThumbUrl(string $url, int $width): string
    {
        // If it's already a thumb URL, replace the width
        if (preg_match('/\/thumb\//', $url)) {
            return preg_replace('/\/\d+px-/', "/{$width}px-", $url);
        }

        // Convert original Commons URL to thumbnail URL
        // e.g. /commons/a/ab/File.jpg → /commons/thumb/a/ab/File.jpg/1200px-File.jpg
        if (preg_match('#(.*?/(?:commons|wikipedia/\w+)/)(.+/)([^/]+)$#', $url, $matches)) {
            $base = $matches[1];
            $path = $matches[2];
            $filename = $matches[3];
            return "{$base}thumb/{$path}{$filename}/{$width}px-{$filename}";
        }

        // Can't transform, return as-is
        return $url;
    }
}
