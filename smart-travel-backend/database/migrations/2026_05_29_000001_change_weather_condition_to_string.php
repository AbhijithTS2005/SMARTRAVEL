<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * Converts weather_condition from a restricted enum to a plain VARCHAR
     * so the seeder can insert values like 'Hot & Humid', 'Pleasant', etc.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: drop the check constraint and change type to VARCHAR
            DB::statement('ALTER TABLE destination_climate ALTER COLUMN weather_condition TYPE VARCHAR(100)');
        } else {
            // MySQL: change enum to string
            DB::statement("ALTER TABLE destination_climate MODIFY COLUMN weather_condition VARCHAR(100) NOT NULL DEFAULT 'sunny'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE destination_climate ALTER COLUMN weather_condition TYPE VARCHAR(10)");
        } else {
            DB::statement("ALTER TABLE destination_climate MODIFY COLUMN weather_condition ENUM('sunny','rainy','cloudy','misty') NOT NULL DEFAULT 'sunny'");
        }
    }
};
