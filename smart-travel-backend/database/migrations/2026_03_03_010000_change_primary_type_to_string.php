<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Change primary_type from enum to string for flexibility with discovered destinations.
     */
    public function up(): void
    {
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            // PostgreSQL: ALTER COLUMN ... TYPE (column is already a compatible type from the create migration)
            DB::statement("ALTER TABLE destinations ALTER COLUMN primary_type TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE destinations ALTER COLUMN primary_type SET DEFAULT 'nature'");
        } else {
            // MySQL: drop enum and re-create as string
            DB::statement("ALTER TABLE destinations MODIFY COLUMN primary_type VARCHAR(50) NOT NULL DEFAULT 'nature'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            DB::statement("ALTER TABLE destinations ALTER COLUMN primary_type TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE destinations ALTER COLUMN primary_type SET DEFAULT 'nature'");
        } else {
            DB::statement("ALTER TABLE destinations MODIFY COLUMN primary_type ENUM('adventure','hill_station','beach','nature','cultural','wildlife') NOT NULL DEFAULT 'nature'");
        }
    }
};
