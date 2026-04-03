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
        Schema::create('user_tracking_destinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('destination_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->date('travel_date')->nullable()->comment('Planned travel date');
            $table->timestamps();

            // Prevent duplicate active trackings for same user-destination pair
            $table->unique(['user_id', 'destination_id'], 'unique_user_destination_tracking');
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_tracking_destinations');
    }
};
