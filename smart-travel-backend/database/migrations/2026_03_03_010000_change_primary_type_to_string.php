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
        // MySQL requires dropping the enum and re-creating as string
        DB::statement("ALTER TABLE destinations MODIFY COLUMN primary_type VARCHAR(50) NOT NULL DEFAULT 'nature'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE destinations MODIFY COLUMN primary_type ENUM('adventure','hill_station','beach','nature','cultural','wildlife') NOT NULL DEFAULT 'nature'");
    }
};
