<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->enum('climate_preference', ['cold', 'moderate', 'hot'])->default('moderate');
            $table->decimal('min_budget', 10, 2)->default(0);
            $table->decimal('max_budget', 10, 2)->default(50000);
            $table->json('travel_types')->comment('Array: adventure, hill_station, beach, nature, cultural, wildlife');
            $table->enum('crowd_preference', ['crowded', 'less_crowded', 'any'])->default('any');
            $table->boolean('air_quality_sensitive')->default(false);
            $table->json('season_preferences')->nullable()->comment('Array: summer, monsoon, winter');
            $table->json('activities_interest')->nullable()->comment('Array: trekking, boating, photography, etc');
            $table->decimal('preferred_min_temp', 4, 1)->default(15.0);
            $table->decimal('preferred_max_temp', 4, 1)->default(35.0);
            $table->json('learned_profile')->nullable()->comment('AI-learned user patterns and preferences');
            $table->timestamps();

            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
