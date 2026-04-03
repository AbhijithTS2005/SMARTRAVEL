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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('destination_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('notification_type', [
                'weather_alert',
                'aqi_warning',
                'disaster_alert',
                'travel_season',
                'recommendation_update',
                'new_match',
                'general'
            ]);
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable()->comment('Additional notification payload');
            $table->boolean('is_read')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index('notification_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
