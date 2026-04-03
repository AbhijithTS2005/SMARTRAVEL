<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecommendationLog extends Model
{
    protected $fillable = [
        'user_id',
        'destination_id',
        'match_score',
        'score_breakdown',
        'rank_position',
        'was_clicked',
    ];

    protected $casts = [
        'score_breakdown' => 'array',
        'match_score' => 'decimal:2',
        'rank_position' => 'integer',
        'was_clicked' => 'boolean',
    ];

    /**
     * Get the user who received this recommendation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the recommended destination.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Scope for high-scoring recommendations.
     */
    public function scopeHighScore($query, float $threshold = 80.0)
    {
        return $query->where('match_score', '>=', $threshold);
    }

    /**
     * Scope for clicked recommendations.
     */
    public function scopeClicked($query)
    {
        return $query->where('was_clicked', true);
    }
}
