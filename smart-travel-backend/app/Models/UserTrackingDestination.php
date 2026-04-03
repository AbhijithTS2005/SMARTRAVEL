<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTrackingDestination extends Model
{
    protected $fillable = [
        'user_id',
        'destination_id',
        'started_at',
        'is_active',
        'travel_date',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'is_active' => 'boolean',
        'travel_date' => 'date',
    ];

    /**
     * Get the user who is tracking.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the destination being tracked.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Scope for active trackings.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Deactivate tracking.
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Scope for upcoming travels (within next 30 days).
     */
    public function scopeUpcoming($query, int $days = 30)
    {
        return $query->whereNotNull('travel_date')
            ->whereBetween('travel_date', [now(), now()->addDays($days)]);
    }
}
