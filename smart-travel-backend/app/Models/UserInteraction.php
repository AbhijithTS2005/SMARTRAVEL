<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserInteraction extends Model
{
    protected $fillable = [
        'user_id',
        'destination_id',
        'interaction_type',
        'duration_seconds',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'duration_seconds' => 'integer',
    ];

    /**
     * Get the user who made this interaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the destination for this interaction.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Scope for recent interactions (last 30 days).
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope for specific interaction types.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('interaction_type', $type);
    }
}
