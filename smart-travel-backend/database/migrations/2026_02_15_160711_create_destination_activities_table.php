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
        Schema::create('destination_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->onDelete('cascade');
            $table->string('activity_name');
            $table->enum('activity_type', ['trekking', 'boating', 'photography', 'camping', 'wildlife_safari', 'water_sports', 'cultural', 'adventure']);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('destination_id');
            $table->index('activity_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('destination_activities');
    }
};
