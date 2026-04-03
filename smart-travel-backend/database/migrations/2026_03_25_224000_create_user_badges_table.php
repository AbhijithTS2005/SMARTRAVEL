<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('badge_slug', 50);
            $table->timestamp('unlocked_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'badge_slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};
