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
        Schema::create('destination_climate', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->onDelete('cascade');
            $table->enum('season', ['summer', 'monsoon', 'winter', 'spring']);
            $table->decimal('avg_temp_min', 4, 1);
            $table->decimal('avg_temp_max', 4, 1);
            $table->decimal('rainfall_mm', 6, 2)->default(0);
            $table->enum('weather_condition', ['sunny', 'rainy', 'cloudy', 'misty'])->default('sunny');
            $table->integer('avg_aqi')->default(50)->comment('Air Quality Index');
            $table->timestamps();

            $table->unique(['destination_id', 'season']);
            $table->index('season');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('destination_climate');
    }
};
