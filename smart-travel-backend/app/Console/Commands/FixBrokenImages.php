<?php

namespace App\Console\Commands;

use App\Models\Destination;
use App\Services\PexelsService;
use App\Services\WikimediaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FixBrokenImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:fix {--force : Force update even if image looks like a URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find destinations with broken image paths and backfill from Wikimedia or Pexels';

    /**
     * Execute the console command.
     */
    public function handle(WikimediaService $wikimedia, PexelsService $pexels)
    {
        $this->info('Starting broken image check...');

        $query = Destination::where('is_active', true);
        
        if (!$this->option('force')) {
            // Only find those that don't have a URL in images[0]
            $query->where('images', 'NOT LIKE', '["http%');
        }

        $destinations = $query->get();
        $count = $destinations->count();

        if ($count === 0) {
            $this->info('No broken images found.');
            return 0;
        }

        $this->info("Found {$count} potential destinations to fix.");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $fixed = 0;
        $failed = 0;

        foreach ($destinations as/** @var Destination $dest */ $dest) {
            $currentImages = $dest->images ?? [];
            $firstImage = $currentImages[0] ?? '';

            // Skip if it's already a valid URL and force is not set
            if (str_starts_with($firstImage, 'http') && !$this->option('force')) {
                $bar->advance();
                continue;
            }

            $this->comment("\nFixing: {$dest->name} ({$firstImage})");

            try {
                // 1. Try Wikimedia first (usually more accurate for specific places)
                $photos = $wikimedia->getDestinationPhotos($dest, 1);
                
                // 2. Fallback to Pexels
                if (empty($photos)) {
                    $photos = $pexels->getDestinationPhotos($dest);
                }

                if (!empty($photos)) {
                    $newImageUrl = $photos[0]['large'] ?? $photos[0]['original'] ?? $photos[0]['medium'] ?? null;
                    
                    if ($newImageUrl) {
                        // Update the images array with the new URL at the front
                        $dest->images = array_merge([$newImageUrl], $currentImages);
                        $dest->save();
                        $fixed++;
                    } else {
                        $failed++;
                    }
                } else {
                    $failed++;
                }
            } catch (\Exception $e) {
                $this->error("Error fixing {$dest->name}: " . $e->getMessage());
                $failed++;
            }

            $bar->advance();
            // Sleep slightly to respect APIs
            usleep(200000); 
        }

        $bar->finish();
        $this->info("\n\nDone!");
        $this->info("Fixed: {$fixed}");
        $this->info("Failed: {$failed}");

        return 0;
    }
}
