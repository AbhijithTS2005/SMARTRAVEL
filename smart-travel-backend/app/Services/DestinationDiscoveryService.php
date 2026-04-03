<?php

namespace App\Services;

use App\Models\Destination;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Discovers and creates new Destination records from user-searched locations.
 *
 * When a user clicks on or searches for a location that doesn't exist in the DB,
 * this service auto-creates a Destination record using geocoded + weather data,
 * enabling full scoring and future recommendations.
 */
class DestinationDiscoveryService
{
    public function __construct(
        private PexelsService $pexelsService
    ) {
    }

    /**
     * Attempt to create a new destination from location data.
     *
     * @param array  $locationData  Reverse-geocoded data (name, district, state, country, nominatim_class, nominatim_type)
     * @param float  $lat           Latitude
     * @param float  $lng           Longitude
     * @param array  $weather       Live weather data
     * @return Destination|null     The newly created destination, or null if creation was skipped
     */
    public function discoverFromLocation(array $locationData, float $lat, float $lng, array $weather): ?Destination
    {
        $name = $locationData['name'] ?? null;

        // Skip invalid or generic names
        if (!$name || in_array($name, ['Unknown Location', 'Location', ''])) {
            return null;
        }

        // Skip if name is too short or looks like a number/coordinate
        if (strlen($name) < 3 || is_numeric($name)) {
            return null;
        }

        // Check for existing destination by proximity first (within ~1km)
        $existing = Destination::whereRaw(
            'ABS(latitude - ?) < 0.01 AND ABS(longitude - ?) < 0.01',
            [$lat, $lng]
        )->first();

        if ($existing) {
            return $existing;
        }

        // Also check by name to avoid duplicates
        $existing = Destination::where('name', $name)->first();
        if ($existing) {
            return $existing;
        }

        try {
            // Infer the primary type from Nominatim classification
            $primaryType = $this->inferPrimaryType(
                $locationData['nominatim_class'] ?? null,
                $locationData['nominatim_type'] ?? null,
                $name
            );

            // Estimate budget based on region
            $budget = $this->estimateBudget($locationData['state'] ?? null);

            // Generate slug
            $slug = $this->generateUniqueSlug($name);

            // Determine climate type for description
            $temp = $weather['temperature'] ?? 25;
            $climateType = $this->determineClimateType($temp);

            // Auto-generate description
            $district = $locationData['district'] ?? '';
            $state = $locationData['state'] ?? '';
            $description = $this->generateDescription($name, $district, $state, $primaryType, $climateType);

            // Fetch an initial image
            $images = $this->fetchInitialImages($name, $district, $state);

            // Create the destination
            $destination = Destination::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'latitude' => $lat,
                'longitude' => $lng,
                'district' => $district ?: null,
                'primary_type' => $primaryType,
                'images' => $images,
                'avg_budget_min' => $budget['min'],
                'avg_budget_max' => $budget['max'],
                'crowd_level' => 'medium',
                'popularity_score' => 1,
                'is_active' => true,
                'source' => 'discovered',
            ]);

            Log::info('Destination discovered from user search', [
                'id' => $destination->id,
                'name' => $name,
                'type' => $primaryType,
                'lat' => $lat,
                'lng' => $lng,
            ]);

            return $destination;
        } catch (\Exception $e) {
            Log::warning('Failed to create discovered destination', [
                'name' => $name,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Infer primary_type from Nominatim class/type fields.
     *
     * Nominatim returns fields like:
     *   class: "natural", type: "beach"
     *   class: "tourism", type: "viewpoint"
     *   class: "amenity", type: "place_of_worship"
     */
    private function inferPrimaryType(?string $class, ?string $type, string $name): string
    {
        // Direct type mappings from Nominatim
        $typeMap = [
            // Natural features
            'beach' => 'beach',
            'coastline' => 'beach',
            'bay' => 'beach',

            // Hill stations & peaks
            'peak' => 'hill_station',
            'mountain' => 'hill_station',
            'ridge' => 'hill_station',
            'saddle' => 'hill_station',
            'volcano' => 'hill_station',
            'hill' => 'hill_station',

            // Nature
            'water' => 'nature',
            'waterfall' => 'nature',
            'lake' => 'nature',
            'river' => 'nature',
            'reservoir' => 'nature',
            'wetland' => 'nature',
            'glacier' => 'nature',
            'garden' => 'nature',
            'park' => 'nature',
            'forest' => 'nature',
            'wood' => 'nature',
            'scrub' => 'nature',
            'grassland' => 'nature',
            'heath' => 'nature',

            // Wildlife
            'zoo' => 'wildlife',
            'aquarium' => 'wildlife',
            'nature_reserve' => 'wildlife',
            'protected_area' => 'wildlife',
            'national_park' => 'wildlife',

            // Cultural
            'place_of_worship' => 'cultural',
            'temple' => 'cultural',
            'church' => 'cultural',
            'mosque' => 'cultural',
            'monastery' => 'cultural',
            'castle' => 'cultural',
            'fort' => 'cultural',
            'palace' => 'cultural',
            'museum' => 'cultural',
            'memorial' => 'cultural',
            'monument' => 'cultural',
            'archaeological_site' => 'cultural',
            'ruins' => 'cultural',
            'heritage' => 'cultural',
            'arts_centre' => 'cultural',
            'theatre' => 'cultural',
            'library' => 'cultural',
            'marketplace' => 'cultural',
            'town_hall' => 'cultural',

            // Adventure
            'cliff' => 'adventure',
            'cave_entrance' => 'adventure',
            'rock' => 'adventure',
            'rapids' => 'adventure',

            // Tourism
            'viewpoint' => 'nature',
            'attraction' => 'nature',
            'picnic_site' => 'nature',
            'camp_site' => 'adventure',
            'theme_park' => 'adventure',
        ];

        // Check type field first (more specific)
        if ($type && isset($typeMap[$type])) {
            return $typeMap[$type];
        }

        // Check class field
        $classMap = [
            'natural' => 'nature',
            'waterway' => 'nature',
            'leisure' => 'nature',
            'tourism' => 'nature',
            'historic' => 'cultural',
            'amenity' => 'cultural',
            'boundary' => 'wildlife', // often used for protected areas
        ];

        if ($class && isset($classMap[$class])) {
            return $classMap[$class];
        }

        // Name-based heuristics as fallback
        $nameLower = strtolower($name);

        $namePatterns = [
            'beach' => 'beach',
            'island' => 'beach',
            'coast' => 'beach',
            'shore' => 'beach',
            'hill' => 'hill_station',
            'peak' => 'hill_station',
            'mount' => 'hill_station',
            'mountain' => 'hill_station',
            'station' => 'hill_station',
            'falls' => 'nature',
            'waterfall' => 'nature',
            'lake' => 'nature',
            'river' => 'nature',
            'dam' => 'nature',
            'garden' => 'nature',
            'park' => 'nature',
            'forest' => 'nature',
            'backwater' => 'nature',
            'temple' => 'cultural',
            'church' => 'cultural',
            'mosque' => 'cultural',
            'fort' => 'cultural',
            'palace' => 'cultural',
            'museum' => 'cultural',
            'sanctuary' => 'wildlife',
            'wildlife' => 'wildlife',
            'zoo' => 'wildlife',
            'reserve' => 'wildlife',
            'tiger' => 'wildlife',
            'trek' => 'adventure',
            'camp' => 'adventure',
            'rapids' => 'adventure',
            'cave' => 'adventure',
        ];

        foreach ($namePatterns as $pattern => $mappedType) {
            if (str_contains($nameLower, $pattern)) {
                return $mappedType;
            }
        }

        return 'nature'; // Default fallback
    }

    /**
     * Estimate budget range based on state/region.
     */
    private function estimateBudget(?string $state): array
    {
        $budgetRanges = [
            'Kerala' => ['min' => 1500, 'max' => 5000],
            'Tamil Nadu' => ['min' => 1000, 'max' => 4000],
            'Karnataka' => ['min' => 1200, 'max' => 4500],
            'Goa' => ['min' => 2000, 'max' => 7000],
            'Rajasthan' => ['min' => 1500, 'max' => 6000],
            'Himachal Pradesh' => ['min' => 1800, 'max' => 5500],
            'Uttarakhand' => ['min' => 1500, 'max' => 5000],
            'Maharashtra' => ['min' => 1500, 'max' => 5500],
            'Andhra Pradesh' => ['min' => 1000, 'max' => 4000],
            'Telangana' => ['min' => 1200, 'max' => 4500],
            'West Bengal' => ['min' => 1000, 'max' => 4000],
            'Odisha' => ['min' => 800, 'max' => 3500],
            'Gujarat' => ['min' => 1200, 'max' => 4500],
            'Punjab' => ['min' => 1200, 'max' => 4500],
            'Jammu and Kashmir' => ['min' => 2000, 'max' => 6000],
            'Ladakh' => ['min' => 2500, 'max' => 7000],
            'Sikkim' => ['min' => 1800, 'max' => 5500],
            'Meghalaya' => ['min' => 1500, 'max' => 5000],
            'Assam' => ['min' => 1200, 'max' => 4000],
            'Arunachal Pradesh' => ['min' => 2000, 'max' => 6000],
            'Madhya Pradesh' => ['min' => 1000, 'max' => 4000],
        ];

        return $budgetRanges[$state] ?? ['min' => 1500, 'max' => 5000];
    }

    /**
     * Generate a unique slug from the destination name.
     */
    private function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (Destination::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Determine climate type from temperature.
     */
    private function determineClimateType(float $temp): string
    {
        if ($temp < 15)
            return 'Cold';
        if ($temp < 25)
            return 'Moderate';
        if ($temp < 32)
            return 'Warm';
        return 'Hot';
    }

    /**
     * Generate a short description for the discovered destination.
     */
    private function generateDescription(string $name, string $district, string $state, string $primaryType, string $climateType): string
    {
        $typeLabels = [
            'beach' => 'a beautiful beach destination',
            'hill_station' => 'a scenic hill station',
            'nature' => 'a nature destination',
            'cultural' => 'a culturally rich destination',
            'wildlife' => 'a wildlife destination',
            'adventure' => 'an adventure destination',
        ];

        $typeLabel = $typeLabels[$primaryType] ?? 'a travel destination';
        $location = implode(', ', array_filter([$district, $state]));

        return "{$name} is {$typeLabel}" . ($location ? " located in {$location}" : '') . ". Discovered through user exploration on SmarTravel.";
    }

    /**
     * Fetch initial images from Pexels for the new destination.
     */
    private function fetchInitialImages(string $name, string $district, string $state): array
    {
        try {
            $searchQuery = trim("{$name} {$state} India travel");
            $photos = $this->pexelsService->searchPhotos($searchQuery, 2);

            $images = [];
            foreach ($photos as $photo) {
                $url = $photo['large'] ?? $photo['medium'] ?? $photo['small'] ?? null;
                if ($url) {
                    $images[] = $url;
                }
            }

            return $images;
        } catch (\Exception $e) {
            Log::warning('Failed to fetch photos for discovered destination', [
                'name' => $name,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}
