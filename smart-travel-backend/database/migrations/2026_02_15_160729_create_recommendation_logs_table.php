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
        Schema::create('recommendation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('destination_id')->constrained()->onDelete('cascade');
            $table->decimal('match_score', 5, 2);
            $table->json('score_breakdown')->nullable()->comment('Detailed score breakdown by factor');
            $table->integer('rank_position');
            $table->boolean('was_clicked')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('match_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recommendation_logs');
    }
};
