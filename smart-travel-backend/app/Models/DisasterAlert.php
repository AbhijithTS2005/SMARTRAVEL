<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterAlert extends Model
{
    protected $fillable = [
        'destination_id',
        'district',
        'alert_type',
        'severity',
        'title',
        'description',
        'source',
        'data',
        'is_active',
        'detected_at',
        'expires_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_active' => 'boolean',
        'detected_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the destination for this alert.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Scope for active alerts.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope for critical alerts.
     */
    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    /**
     * Scope for alerts by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('alert_type', $type);
    }

    /**
     * Deactivate this alert.
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Check if alert is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
