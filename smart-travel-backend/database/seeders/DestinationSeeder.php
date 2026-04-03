<?php

namespace Database\Seeders;

use App\Models\Destination;
use App\Models\DestinationClimate;
use App\Models\DestinationActivity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DestinationSeeder extends Seeder
{
    public function run(): void
    {
        $csvFile = database_path('seeders/destinations_sample.csv');

        if (!file_exists($csvFile)) {
            $this->command->error("CSV file not found: {$csvFile}");
            return;
        }

        $file = fopen($csvFile, 'r');
        $header = fgetcsv($file); // Skip header row

        $count = 0;
        while (($row = fgetcsv($file)) !== false) { // Import all rows
            // Parse CSV row
            $data = [
                'name' => $row[1],
                'district' => $row[2],
                'category' => $row[3],
                'climate_type' => $row[4],
                'crowd_level' => $row[5],
                'rating' => (float) $row[6],
                'best_season' => $row[7],
                'aqi' => (int) $row[8],
                'latitude' => (float) $row[9],
                'longitude' => (float) $row[10],
            ];

            try {
                // Create destination
                $destination = Destination::create([
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'description' => $this->generateDescription($data['name'], $data['category']),
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'district' => $data['district'],
                    'primary_type' => $this->mapCategoryToType($data['category']),
                    'images' => $this->generateImages($data['category']),
                    'avg_budget_min' => $this->getBudgetRange($data['category'])[0],
                    'avg_budget_max' => $this->getBudgetRange($data['category'])[1],
                    'crowd_level' => $this->mapCrowdLevel($data['crowd_level']),
                    'popularity_score' => (int) ($data['rating'] * 20),
                    'is_active' => true,
                ]);

                // Create climate data
                $this->createClimateData($destination->id, $data['climate_type'], $data['aqi']);

                // Create activities
                $this->createActivities($destination->id, $data['category']);

                $count++;
                $this->command->info("Seeded: {$data['name']}");
            } catch (\Exception $e) {
                $this->command->error("Failed to seed: {$data['name']} - Error: " . $e->getMessage());
                continue;
            }
        }

        fclose($file);

        $this->command->info("Successfully seeded {$count} destinations!");
    }

    private function mapCategoryToType(string $category): string
    {
        // Map CSV categories to database enum values
        // Enum options: adventure, hill_station, beach, nature, cultural, wildlife
        $mapping = [
            'Beach' => 'beach',
            'Hill Station' => 'hill_station',
            'Hill' => 'hill_station',
            'Peak' => 'adventure',
            'Temple' => 'cultural',
            'Church' => 'cultural',
            'Mosque' => 'cultural',
            'Palace' => 'cultural',
            'Fort' => 'cultural',
            'Heritage' => 'cultural',
            'Heritage Site' => 'cultural',
            'Museum' => 'cultural',
            'Waterfall' => 'nature',
            'Dam' => 'nature',
            'Dam Structure' => 'nature',
            'Lake' => 'nature',
            'River' => 'nature',
            'Reservoir' => 'nature',
            'Wildlife' => 'wildlife',
            'Bird Sanctuary' => 'wildlife',
            'Backwaters' => 'nature',
            'Backwater' => 'nature',
            'Island' => 'beach',
            'Islands' => 'beach',
            'Park' => 'nature',
            'Eco Park' => 'nature',
            'Garden' => 'nature',
            'Viewpoint' => 'nature',
            'Trekking' => 'adventure',
            'Adventure Park' => 'adventure',
            'Eco Tourism' => 'nature',
            'Tourism Hub' => 'cultural',
            'Lighthouse' => 'nature',
            'Religious Site' => 'cultural',
            'Pilgrim Site' => 'cultural',
            'Port' => 'nature',
            'Market' => 'cultural',
            'Village' => 'cultural',
            'Town' => 'cultural',
            'Forest' => 'nature',
            'Wetland' => 'nature',
            'Lakefront' => 'nature',
            'Waterfront' => 'nature',
            'Bay' => 'beach',
            'Lagoon' => 'nature',
            'Zoo' => 'wildlife',
            'Cultural' => 'cultural',
            'Scenic' => 'nature',
            'Scenic Spot' => 'nature',
            'Recreation' => 'nature',
            'Landmark' => 'cultural',
            'Bridge' => 'cultural',
            'Rock Formation' => 'nature',
            'Plantation' => 'nature',
        ];

        return $mapping[$category] ?? 'nature'; // Default to nature if not found
    }

    private function mapCrowdLevel(string $crowdLevel): string
    {
        // Map CSV crowd levels to database enum values
        // Enum options: low, medium, high
        $mapping = [
            'Low' => 'low',
            'Moderate' => 'medium',
            'High' => 'high',
            'Very High' => 'high',
        ];

        return $mapping[$crowdLevel] ?? 'medium'; // Default to medium if not found
    }

    private function generateDescription(string $name, string $category): string
    {
        $templates = [
            'Beach' => "Experience the pristine beauty of {$name}, a stunning beach destination in Kerala. Perfect for relaxation, water activities, and witnessing breathtaking sunsets along the Arabian Sea.",
            'Hill Station' => "Discover {$name}, a scenic hill station offering breathtaking mountain views and cool climate. Ideal for nature lovers, trekkers, and those seeking a peaceful retreat.",
            'Temple' => "Visit {$name}, a sacred temple with rich cultural heritage and spiritual significance. This ancient site attracts pilgrims and cultural enthusiasts from across India.",
            'Waterfall' => "Marvel at {$name}, a magnificent waterfall cascading through lush greenery. A perfect spot for nature photography and refreshing escapes.",
            'Backwaters' => "Explore the serene backwaters at {$name}. Experience traditional houseboat cruises, village life, and Kerala's unique ecosystem.",
            'Wildlife' => "{$name} offers incredible wildlife viewing opportunities. Home to diverse flora and fauna, it's perfect for nature enthusiasts and wildlife photographers.",
            'Heritage' => "Step back in time at {$name}, a historical site showcasing Kerala's rich heritage, architecture, and fascinating past.",
            'Fort' => "Explore {$name}, an ancient fort offering panoramic views and insights into Kerala's colonial history and strategic importance.",
            'Palace' => "Visit {$name}, a magnificent palace reflecting Kerala's royal heritage, featuring traditional architecture and historical artifacts.",
            'Museum' => "Discover Kerala's culture and history at {$name}. This museum houses fascinating exhibits and artifacts from the region.",
            'Dam' => "{$name} offers scenic views and water-based activities. A great spot for picnics and enjoying the surrounding natural beauty.",
            'Island' => "Escape to {$name}, a tranquil island destination offering pristine beaches, clear waters, and peaceful surroundings.",
        ];

        return $templates[$category] ?? "Discover the beauty and charm of {$name}, a popular destination in Kerala known for its unique attractions and cultural significance.";
    }

    private function getBudgetRange(string $category): array
    {
        $budgets = [
            'Beach' => [500, 2000],
            'Hill Station' => [1000, 3500],
            'Temple' => [200, 800],
            'Waterfall' => [300, 1200],
            'Backwaters' => [1500, 5000],
            'Wildlife' => [800, 2500],
            'Heritage' => [300, 1000],
            'Fort' => [200, 600],
            'Island' => [1000, 3000],
            'Dam' => [300, 1000],
            'Palace' => [200, 800],
            'Museum' => [200, 500],
            'Lake' => [300, 1200],
            'Park' => [200, 600],
            'Market' => [500, 1500],
            'Village' => [400, 1200],
        ];

        return $budgets[$category] ?? [500, 1500];
    }

    private function generateImages(string $category): array
    {
        // Real photo URLs from Wikimedia Commons (free, publicly available, no API key needed)
        $categoryImages = [
            'Beach' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Varkala_Beach_Kerala_India.jpg/1280px-Varkala_Beach_Kerala_India.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Marari_Beach_Alleppey.jpg/1280px-Marari_Beach_Alleppey.jpg',
            ],
            'Hill Station' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Munnar_Tea_Plantations_-_Kerala.jpg/1280px-Munnar_Tea_Plantations_-_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tea_Plantations_in_Munnar%2CKerala.jpg/1280px-Tea_Plantations_in_Munnar%2CKerala.jpg',
            ],
            'Hill' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Munnar_Tea_Plantations_-_Kerala.jpg/1280px-Munnar_Tea_Plantations_-_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tea_Plantations_in_Munnar%2CKerala.jpg/1280px-Tea_Plantations_in_Munnar%2CKerala.jpg',
            ],
            'Peak' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Munnar_Tea_Plantations_-_Kerala.jpg/1280px-Munnar_Tea_Plantations_-_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tea_Plantations_in_Munnar%2CKerala.jpg/1280px-Tea_Plantations_in_Munnar%2CKerala.jpg',
            ],
            'Temple' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Sree_Padmanabhaswamy_temple_Thiruvananthapuram.jpg/1280px-Sree_Padmanabhaswamy_temple_Thiruvananthapuram.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Guruvayur_Temple_Kerala.jpg/1280px-Guruvayur_Temple_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Vadakkunnathan_temple%2C_Thrissur%2C_Kerala%2C_India.jpg/1280px-Vadakkunnathan_temple%2C_Thrissur%2C_Kerala%2C_India.jpg',
            ],
            'Church' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/St._Francis_Church%2C_Fort_Kochi.jpg/1280px-St._Francis_Church%2C_Fort_Kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Santa_Cruz_Cathedral_Basilica_at_Fort_Kochi.jpg/1280px-Santa_Cruz_Cathedral_Basilica_at_Fort_Kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/St._Francis_Church%2C_Fort_Kochi.jpg/1280px-St._Francis_Church%2C_Fort_Kochi.jpg',
            ],
            'Mosque' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cheraman_Juma_Masjid_Kodungallur.jpg/1280px-Cheraman_Juma_Masjid_Kodungallur.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cheraman_Juma_Masjid_Kodungallur.jpg/1280px-Cheraman_Juma_Masjid_Kodungallur.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cheraman_Juma_Masjid_Kodungallur.jpg/1280px-Cheraman_Juma_Masjid_Kodungallur.jpg',
            ],
            'Waterfall' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Athirappilly_Falls_Kerala.jpg/1280px-Athirappilly_Falls_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Athirappilly_Falls_Kerala.jpg/1280px-Athirappilly_Falls_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Athirappilly_Falls_Kerala.jpg/1280px-Athirappilly_Falls_Kerala.jpg',
            ],
            'Backwaters' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
            ],
            'Backwater' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
            ],
            'Wildlife' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Periyar_Tiger_Reserve.jpg/1280px-Periyar_Tiger_Reserve.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Elephants_at_Periyar_Lake.jpg/1280px-Elephants_at_Periyar_Lake.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Periyar_Tiger_Reserve.jpg/1280px-Periyar_Tiger_Reserve.jpg',
            ],
            'Bird Sanctuary' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Kumarakom_Bird_Sanctuary_Kerala.jpg/1280px-Kumarakom_Bird_Sanctuary_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Kumarakom_Bird_Sanctuary_Kerala.jpg/1280px-Kumarakom_Bird_Sanctuary_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Kumarakom_Bird_Sanctuary_Kerala.jpg/1280px-Kumarakom_Bird_Sanctuary_Kerala.jpg',
            ],
            'Dam' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
            ],
            'Dam Structure' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
            ],
            'Lake' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
            ],
            'Palace' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mattancherry_Palace%2C_Kochi.jpg/1280px-Mattancherry_Palace%2C_Kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mattancherry_Palace%2C_Kochi.jpg/1280px-Mattancherry_Palace%2C_Kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mattancherry_Palace%2C_Kochi.jpg/1280px-Mattancherry_Palace%2C_Kochi.jpg',
            ],
            'Heritage' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
            ],
            'Heritage Site' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Chinese_fishing_nets_kochi.jpg/1280px-Chinese_fishing_nets_kochi.jpg',
            ],
            'Fort' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bekal_Fort_Kerala.jpg/1280px-Bekal_Fort_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bekal_Fort_Kerala.jpg/1280px-Bekal_Fort_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bekal_Fort_Kerala.jpg/1280px-Bekal_Fort_Kerala.jpg',
            ],
            'Museum' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Napier_Museum_trivandrum.jpg/1280px-Napier_Museum_trivandrum.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Napier_Museum_trivandrum.jpg/1280px-Napier_Museum_trivandrum.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Napier_Museum_trivandrum.jpg/1280px-Napier_Museum_trivandrum.jpg',
            ],
            'Island' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Varkala_Beach_Kerala_India.jpg/1280px-Varkala_Beach_Kerala_India.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
            ],
            'Islands' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Varkala_Beach_Kerala_India.jpg/1280px-Varkala_Beach_Kerala_India.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
            ],
            'Eco Tourism' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tea_Plantations_in_Munnar%2CKerala.jpg/1280px-Tea_Plantations_in_Munnar%2CKerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Munnar_Tea_Plantations_-_Kerala.jpg/1280px-Munnar_Tea_Plantations_-_Kerala.jpg',
            ],
            'Adventure Park' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Munnar_Tea_Plantations_-_Kerala.jpg/1280px-Munnar_Tea_Plantations_-_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Tea_Plantations_in_Munnar%2CKerala.jpg/1280px-Tea_Plantations_in_Munnar%2CKerala.jpg',
            ],
            'Lighthouse' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Varkala_Beach_Kerala_India.jpg/1280px-Varkala_Beach_Kerala_India.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
            ],
            'River' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg/1280px-A_houseboat_in_Vembanad_Lake%2C_Kerala.jpg',
            ],
            'Reservoir' => [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Idukki_dam_kerala.jpg/1280px-Idukki_dam_kerala.jpg',
            ],
        ];

        // Default: generic Kerala landscape for unmapped categories
        $defaultImages = [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kerala_Backwaters_Houseboat.jpg/1280px-Kerala_Backwaters_Houseboat.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Munnar_hillstation_kerala.jpg/1280px-Munnar_hillstation_kerala.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kovalam_Beach_Kerala.jpg/1280px-Kovalam_Beach_Kerala.jpg',
        ];

        return $categoryImages[$category] ?? $defaultImages;
    }

    private function createClimateData(int $destinationId, string $climateType, int $aqi): void
    {
        $climateProfiles = [
            'Hill Station' => [
                ['season' => 'summer', 'temp_min' => 15, 'temp_max' => 25, 'rainfall' => 50, 'weather' => 'Pleasant', 'aqi' => max($aqi - 3, 20)],
                ['season' => 'monsoon', 'temp_min' => 12, 'temp_max' => 20, 'rainfall' => 250, 'weather' => 'Rainy', 'aqi' => max($aqi - 5, 18)],
                ['season' => 'winter', 'temp_min' => 10, 'temp_max' => 20, 'rainfall' => 30, 'weather' => 'Cool', 'aqi' => max($aqi - 3, 19)],
            ],
            'Tropical' => [
                ['season' => 'summer', 'temp_min' => 25, 'temp_max' => 35, 'rainfall' => 40, 'weather' => 'Hot & Humid', 'aqi' => min($aqi + 5, 100)],
                ['season' => 'monsoon', 'temp_min' => 23, 'temp_max' => 30, 'rainfall' => 300, 'weather' => 'Heavy Rain', 'aqi' => $aqi],
                ['season' => 'winter', 'temp_min' => 22, 'temp_max' => 32, 'rainfall' => 20, 'weather' => 'Pleasant', 'aqi' => max($aqi - 2, 25)],
            ],
        ];

        $profile = $climateProfiles[$climateType] ?? $climateProfiles['Tropical'];

        foreach ($profile as $climate) {
            DestinationClimate::create([
                'destination_id' => $destinationId,
                'season' => $climate['season'],
                'avg_temp_min' => $climate['temp_min'],
                'avg_temp_max' => $climate['temp_max'],
                'rainfall_mm' => $climate['rainfall'],
                'weather_condition' => $climate['weather'],
                'avg_aqi' => $climate['aqi'],
            ]);
        }
    }

    private function createActivities(int $destinationId, string $category): void
    {
        $activityMap = [
            'Beach' => [
                ['name' => 'Swimming', 'type' => 'water_sports', 'desc' => 'Enjoy swimming in the clear waters'],
                ['name' => 'Sunbathing', 'type' => 'relaxation', 'desc' => 'Relax on the sandy shores under the sun'],
                ['name' => 'Beach Volleyball', 'type' => 'sports', 'desc' => 'Play beach sports with friends and family'],
            ],
            'Hill Station' => [
                ['name' => 'Trekking', 'type' => 'adventure', 'desc' => 'Explore scenic trekking trails through the hills'],
                ['name' => 'Photography', 'type' => 'leisure', 'desc' => 'Capture stunning landscape photographs'],
                ['name' => 'Tea Plantation Tours', 'type' => 'sightseeing', 'desc' => 'Visit lush tea estates and learn about tea production'],
            ],
            'Temple' => [
                ['name' => 'Temple Visit', 'type' => 'spiritual', 'desc' => 'Experience spiritual serenity and architectural beauty'],
                ['name' => 'Cultural Tours', 'type' => 'cultural', 'desc' => 'Learn about local traditions and religious practices'],
            ],
            'Waterfall' => [
                ['name' => 'Viewing', 'type' => 'sightseeing', 'desc' => 'Admire the cascading waterfalls'],
                ['name' => 'Photography', 'type' => 'leisure', 'desc' => 'Capture the natural beauty'],
                ['name' => 'Nature Walk', 'type' => 'nature', 'desc' => 'Walk through surrounding forest trails'],
            ],
            'Backwaters' => [
                ['name' => 'Houseboat Cruise', 'type' => 'leisure', 'desc' => 'Enjoy a traditional Kerala houseboat experience'],
                ['name' => 'Canoeing', 'type' => 'water_sports', 'desc' => 'Paddle through narrow waterways'],
                ['name' => 'Village Tours', 'type' => 'cultural', 'desc' => 'Experience authentic rural Kerala life'],
            ],
            'Wildlife' => [
                ['name' => 'Wildlife Safari', 'type' => 'adventure', 'desc' => 'Spot elephants, tigers, and exotic birds'],
                ['name' => 'Nature Walks', 'type' => 'nature', 'desc' => 'Guided walks through the sanctuary'],
                ['name' => 'Bird Watching', 'type' => 'nature', 'desc' => 'Observe rare and migratory bird species'],
            ],
            'Heritage' => [
                ['name' => 'Guided Tours', 'type' => 'cultural', 'desc' => 'Learn about historical significance'],
                ['name' => 'Photography', 'type' => 'leisure', 'desc' => 'Capture architectural marvels'],
            ],
            'Fort' => [
                ['name' => 'Fort Exploration', 'type' => 'sightseeing', 'desc' => 'Explore ancient fortifications'],
                ['name' => 'History Tours', 'type' => 'cultural', 'desc' => 'Learn about colonial history'],
            ],
        ];

        $activities = $activityMap[$category] ?? [
            ['name' => 'Sightseeing', 'type' => 'leisure', 'desc' => 'Explore and discover the destination'],
            ['name' => 'Photography', 'type' => 'leisure', 'desc' => 'Capture memorable moments'],
        ];

        foreach ($activities as $activity) {
            DestinationActivity::create([
                'destination_id' => $destinationId,
                'activity_name' => $activity['name'],
                'activity_type' => $activity['type'],
                'description' => $activity['desc'],
            ]);
        }
    }
}
