<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('endpoint');
            $table->string('public_key')->comment('p256dh key');
            $table->string('auth_token')->comment('auth secret');
            $table->string('content_encoding')->default('aesgcm');
            $table->string('user_agent')->nullable()->comment('Browser/device identifier');
            $table->timestamps();

            $table->index('user_id');
            // Endpoint can be very long, so use a hash index
            $table->unique(['user_id', 'public_key'], 'unique_user_subscription');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
