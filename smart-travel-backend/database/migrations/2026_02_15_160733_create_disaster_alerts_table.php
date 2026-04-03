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
        Schema::create('disaster_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->nullable()->constrained()->onDelete('set null');
            $table->string('district', 100)->nullable();
            $table->enum('alert_type', [
                'heavy_rainfall',
                'flood',
                'landslide',
                'cyclone',
                'extreme_heat',
                'poor_air_quality',
                'storm',
                'general_warning'
            ]);
            $table->enum('severity', ['low', 'moderate', 'high', 'critical'])->default('moderate');
            $table->string('title');
            $table->text('description');
            $table->string('source', 100)->nullable()->comment('API source: openweather, imd, news');
            $table->json('data')->nullable()->comment('Raw API response data');
            $table->boolean('is_active')->default(true);
            $table->timestamp('detected_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('destination_id');
            $table->index('severity');
            $table->index('is_active');
            $table->index('detected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disaster_alerts');
    }
};
