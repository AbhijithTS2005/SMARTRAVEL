<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add source column to distinguish seeded vs discovered destinations.
     */
    public function up(): void
    {
        Schema::table('destinations', function (Blueprint $table) {
            $table->enum('source', ['seeded', 'discovered'])->default('seeded')->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('destinations', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
