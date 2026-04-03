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
        Schema::table('travel_plans', function (Blueprint $table) {
            // Make destination_id nullable so plans can reference custom locations
            $table->foreignId('destination_id')->nullable()->change();

            // Custom location fields for non-database locations
            $table->string('custom_location_name')->nullable()->after('destination_id');
            $table->decimal('custom_latitude', 10, 7)->nullable()->after('custom_location_name');
            $table->decimal('custom_longitude', 10, 7)->nullable()->after('custom_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('travel_plans', function (Blueprint $table) {
            $table->dropColumn(['custom_location_name', 'custom_latitude', 'custom_longitude']);
        });
    }
};
