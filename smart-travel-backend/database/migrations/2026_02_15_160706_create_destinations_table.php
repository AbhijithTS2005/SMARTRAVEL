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
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('district', 100)->nullable();
            $table->enum('primary_type', ['adventure', 'hill_station', 'beach', 'nature', 'cultural', 'wildlife']);
            $table->json('images')->nullable()->comment('Array of image URLs');
            $table->decimal('avg_budget_min', 10, 2)->default(1000);
            $table->decimal('avg_budget_max', 10, 2)->default(10000);
            $table->enum('crowd_level', ['low', 'medium', 'high'])->default('medium');
            $table->integer('popularity_score')->default(0)->comment('Tracked by user interactions');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
            $table->index('district');
            $table->index('primary_type');
            $table->index('popularity_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('destinations');
    }
};
