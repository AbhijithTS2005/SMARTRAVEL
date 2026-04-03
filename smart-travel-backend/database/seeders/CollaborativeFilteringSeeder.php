<?php

namespace Database\Seeders;

use App\Models\Destination;
use App\Models\User;
use App\Models\UserInteraction;
use App\Models\UserPreference;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds test users with diverse preferences and overlapping interaction histories
 * to exercise the collaborative filtering algorithm.
 *
 * User Similarity Design:
 *   - Beach Lover ↔ Nature Explorer: share ~5 beach destinations → high cosine similarity
 *   - Hill Trekker ↔ Culture Buff: share ~5 hill_station destinations → high cosine similarity
 *   - All-Rounder: sparse interactions across all types → cold-start behavior
 *
 * CF should recommend each user's unique destinations to their similar counterpart.
 */
class CollaborativeFilteringSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch destination IDs by type
        $beachIds = Destination::where('primary_type', 'beach')->pluck('id')->toArray();
        $hillIds = Destination::where('primary_type', 'hill_station')->pluck('id')->toArray();
        $natureIds = Destination::where('primary_type', 'nature')->pluck('id')->toArray();
        $culturalIds = Destination::where('primary_type', 'cultural')->pluck('id')->toArray();
        $wildlifeIds = Destination::where('primary_type', 'wildlife')->pluck('id')->toArray();
        $adventureIds = Destination::where('primary_type', 'adventure')->pluck('id')->toArray();

        $this->command->info("Available destinations — Beach: " . count($beachIds)
            . ", Hill: " . count($hillIds) . ", Nature: " . count($natureIds)
            . ", Cultural: " . count($culturalIds) . ", Wildlife: " . count($wildlifeIds)
            . ", Adventure: " . count($adventureIds));

        // ─── SHARED DESTINATION POOLS ───────────────────────────
        // Destinations shared between similar user pairs (for cosine similarity)
        $sharedBeach = array_slice($beachIds, 0, 5);     // Beach Lover ↔ Nature Explorer
        $sharedHill = array_slice($hillIds, 0, 5);      // Hill Trekker ↔ Culture Buff

        // Unique destinations per user (CF should recommend these cross-user)
        $uniqueBeachLover = array_slice($beachIds, 5, 5);
        $uniqueNatureExplorer = array_slice($wildlifeIds, 0, 5);
        $uniqueHillTrekker = array_slice($hillIds, 5, 5);
        $uniqueCultureBuff = array_slice($culturalIds, 0, 5);

        // ─── USER 1: Beach Lover ────────────────────────────────
        $user1 = $this->createUser('Beach Lover', 'beach@test.com');
        $this->createPreferences($user1->id, [
            'climate_preference' => 'hot',
            'travel_types' => ['beach', 'nature'],
            'min_budget' => 500,
            'max_budget' => 5000,
            'preferred_min_temp' => 25,
            'preferred_max_temp' => 35,
            'crowd_preference' => 'any',
        ]);
        // Strong interactions on shared beaches (will match with Nature Explorer)
        $this->createInteractions($user1->id, $sharedBeach, ['favorite', 'lets_go', 'view']);
        // Unique beaches only Beach Lover has interacted with (CF should recommend to Nature Explorer)
        $this->createInteractions($user1->id, $uniqueBeachLover, ['favorite', 'share', 'view']);
        // Some nature views
        $this->createInteractions($user1->id, array_slice($natureIds, 0, 3), ['view']);

        $this->command->info("✓ Created Beach Lover (beach@test.com) with " . (count($sharedBeach) + count($uniqueBeachLover) + 3) . " interactions");

        // ─── USER 2: Hill Trekker ───────────────────────────────
        $user2 = $this->createUser('Hill Trekker', 'hill@test.com');
        $this->createPreferences($user2->id, [
            'climate_preference' => 'cold',
            'travel_types' => ['hill_station', 'adventure'],
            'min_budget' => 1000,
            'max_budget' => 4000,
            'preferred_min_temp' => 10,
            'preferred_max_temp' => 22,
            'crowd_preference' => 'less_crowded',
        ]);
        // Strong interactions on shared hills (will match with Culture Buff)
        $this->createInteractions($user2->id, $sharedHill, ['favorite', 'lets_go', 'view']);
        // Unique hills only Hill Trekker has (CF should recommend to Culture Buff)
        $this->createInteractions($user2->id, $uniqueHillTrekker, ['favorite', 'lets_go', 'share']);
        // Some adventure views
        $this->createInteractions($user2->id, array_slice($adventureIds, 0, 3), ['view', 'lets_go']);

        $this->command->info("✓ Created Hill Trekker (hill@test.com) with " . (count($sharedHill) + count($uniqueHillTrekker) + 3) . " interactions");

        // ─── USER 3: Nature Explorer ────────────────────────────
        $user3 = $this->createUser('Nature Explorer', 'nature@test.com');
        $this->createPreferences($user3->id, [
            'climate_preference' => 'moderate',
            'travel_types' => ['nature', 'beach', 'wildlife'],
            'min_budget' => 500,
            'max_budget' => 6000,
            'preferred_min_temp' => 20,
            'preferred_max_temp' => 32,
            'crowd_preference' => 'less_crowded',
        ]);
        // Strong interactions on same shared beaches as Beach Lover → cosine similarity!
        $this->createInteractions($user3->id, $sharedBeach, ['favorite', 'view', 'share']);
        // Unique wildlife destinations (their own unique set)
        $this->createInteractions($user3->id, $uniqueNatureExplorer, ['favorite', 'lets_go', 'view']);
        // Some nature views
        $this->createInteractions($user3->id, array_slice($natureIds, 3, 4), ['view', 'favorite']);

        $this->command->info("✓ Created Nature Explorer (nature@test.com) with " . (count($sharedBeach) + count($uniqueNatureExplorer) + 4) . " interactions");

        // ─── USER 4: Culture Buff ───────────────────────────────
        $user4 = $this->createUser('Culture Buff', 'culture@test.com');
        $this->createPreferences($user4->id, [
            'climate_preference' => 'moderate',
            'travel_types' => ['cultural', 'hill_station'],
            'min_budget' => 200,
            'max_budget' => 3000,
            'preferred_min_temp' => 18,
            'preferred_max_temp' => 30,
            'crowd_preference' => 'any',
        ]);
        // Strong interactions on same shared hills as Hill Trekker → cosine similarity!
        $this->createInteractions($user4->id, $sharedHill, ['favorite', 'lets_go', 'view']);
        // Unique cultural destinations (their own unique set)
        $this->createInteractions($user4->id, $uniqueCultureBuff, ['favorite', 'share', 'view']);
        // Some extra cultural views
        $this->createInteractions($user4->id, array_slice($culturalIds, 5, 3), ['view']);

        $this->command->info("✓ Created Culture Buff (culture@test.com) with " . (count($sharedHill) + count($uniqueCultureBuff) + 3) . " interactions");

        // ─── USER 5: All-Rounder (Cold Start) ──────────────────
        $user5 = $this->createUser('All Rounder', 'all@test.com');
        $this->createPreferences($user5->id, [
            'climate_preference' => 'moderate',
            'travel_types' => ['beach', 'hill_station', 'nature', 'cultural', 'wildlife', 'adventure'],
            'min_budget' => 500,
            'max_budget' => 8000,
            'preferred_min_temp' => 15,
            'preferred_max_temp' => 35,
            'crowd_preference' => 'any',
        ]);
        // Sparse interactions — 1 from each type (weak signal for CF)
        $sparseIds = [
            $beachIds[array_rand($beachIds)] ?? null,
            $hillIds[array_rand($hillIds)] ?? null,
            $natureIds[array_rand($natureIds)] ?? null,
            $culturalIds[array_rand($culturalIds)] ?? null,
            $wildlifeIds[array_rand($wildlifeIds)] ?? null,
        ];
        $sparseIds = array_filter($sparseIds);
        $this->createInteractions($user5->id, $sparseIds, ['view']);

        $this->command->info("✓ Created All-Rounder (all@test.com) with " . count($sparseIds) . " sparse interactions");

        // ─── SUMMARY ────────────────────────────────────────────
        $this->command->newLine();
        $this->command->info("═══════════════════════════════════════════════");
        $this->command->info("  Collaborative Filtering Test Data Seeded!");
        $this->command->info("═══════════════════════════════════════════════");
        $this->command->info("  Total users:        " . User::count());
        $this->command->info("  Total interactions:  " . UserInteraction::count());
        $this->command->info("  Total preferences:   " . UserPreference::count());
        $this->command->newLine();
        $this->command->info("  Expected CF Pairs:");
        $this->command->info("    Beach Lover → Nature Explorer (shared " . count($sharedBeach) . " beach destinations)");
        $this->command->info("    Hill Trekker → Culture Buff (shared " . count($sharedHill) . " hill destinations)");
        $this->command->newLine();
        $this->command->info("  Login credentials: password123");
        $this->command->info("  Emails: beach@test.com, hill@test.com, nature@test.com, culture@test.com, all@test.com");
        $this->command->info("═══════════════════════════════════════════════");
    }

    /**
     * Create a test user (or return existing one).
     */
    private function createUser(string $name, string $email): User
    {
        return User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password123'),
            ]
        );
    }

    /**
     * Create user preferences.
     */
    private function createPreferences(int $userId, array $data): void
    {
        UserPreference::firstOrCreate(
            ['user_id' => $userId],
            array_merge($data, ['user_id' => $userId])
        );
    }

    /**
     * Create user interactions for a list of destination IDs.
     * Spreads creation timestamps over the last 30 days for time-decay realism.
     */
    private function createInteractions(int $userId, array $destinationIds, array $interactionTypes): void
    {
        foreach ($destinationIds as $index => $destId) {
            if (!$destId)
                continue;

            foreach ($interactionTypes as $type) {
                // Spread timestamps over the last 30 days
                $daysAgo = rand(0, 30);
                $hoursAgo = rand(0, 23);

                UserInteraction::create([
                    'user_id' => $userId,
                    'destination_id' => $destId,
                    'interaction_type' => $type,
                    'duration_seconds' => $type === 'view' ? rand(10, 120) : 0,
                    'metadata' => ['source' => 'cf_test_seeder'],
                    'created_at' => now()->subDays($daysAgo)->subHours($hoursAgo),
                    'updated_at' => now()->subDays($daysAgo)->subHours($hoursAgo),
                ]);
            }
        }
    }
}
