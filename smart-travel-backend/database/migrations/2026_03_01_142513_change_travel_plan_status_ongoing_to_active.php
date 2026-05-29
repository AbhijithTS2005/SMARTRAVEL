<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First update any existing 'ongoing' rows to 'active'
        DB::table('travel_plans')->where('status', 'ongoing')->update(['status' => 'active']);

        // Change the enum to use 'active' instead of 'ongoing'
        // MySQL: MODIFY COLUMN — PostgreSQL: ALTER COLUMN ... TYPE
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            DB::statement("ALTER TABLE travel_plans ALTER COLUMN status TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE travel_plans ALTER COLUMN status SET DEFAULT 'planned'");
        } else {
            DB::statement("ALTER TABLE travel_plans MODIFY COLUMN status ENUM('planned', 'active', 'completed', 'cancelled') DEFAULT 'planned'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('travel_plans')->where('status', 'active')->update(['status' => 'ongoing']);

        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            DB::statement("ALTER TABLE travel_plans ALTER COLUMN status TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE travel_plans ALTER COLUMN status SET DEFAULT 'planned'");
        } else {
            DB::statement("ALTER TABLE travel_plans MODIFY COLUMN status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned'");
        }
    }
};
