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
        Schema::create('user_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('destination_id')->constrained()->onDelete('cascade');
            $table->enum('interaction_type', ['view', 'search', 'lets_go', 'scroll', 'share', 'favorite']);
            $table->integer('duration_seconds')->default(0);
            $table->json('metadata')->nullable()->comment('Additional interaction data');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('destination_id');
            $table->index('interaction_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_interactions');
    }
};
