<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $destination_id
 * @property string|null $custom_location_name
 * @property float|null $custom_latitude
 * @property float|null $custom_longitude
 * @property \Carbon\Carbon $start_date
 * @property \Carbon\Carbon $end_date
 * @property string $status
 * @property bool $monitoring_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class TravelPlan extends Model
{
    protected $fillable = [
        'user_id',
        'destination_id',
        'custom_location_name',
        'custom_latitude',
        'custom_longitude',
        'start_date',
        'end_date',
        'status',
        'monitoring_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'monitoring_active' => 'boolean',
        'custom_latitude' => 'float',
        'custom_longitude' => 'float',
    ];

    /**
     * Get the user that owns the travel plan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the destination for this travel plan.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Get the latitude for this plan (from destination or custom location).
     */
    public function getLatitude(): ?float
    {
        return $this->destination ? (float) $this->destination->latitude : $this->custom_latitude;
    }

    /**
     * Get the longitude for this plan (from destination or custom location).
     */
    public function getLongitude(): ?float
    {
        return $this->destination ? (float) $this->destination->longitude : $this->custom_longitude;
    }

    /**
     * Get the display name for this plan's location.
     */
    public function getLocationName(): string
    {
        return $this->destination ? $this->destination->name : ($this->custom_location_name ?? 'Unknown Location');
    }

    /**
     * Scope to get only active plans (planned or active).
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['planned', 'active'])
            ->where('monitoring_active', true);
    }

    /**
     * Check if plan is currently active.
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['planned', 'active'])
            && $this->monitoring_active
            && $this->end_date >= now()->toDateString();
    }

    /**
     * Transition plan from planned to active.
     */
    public function activate(): void
    {
        $this->update([
            'status' => 'active',
        ]);
    }

    /**
     * Mark plan as cancelled.
     */
    public function cancel(): void
    {
        $this->update([
            'status' => 'cancelled',
            'monitoring_active' => false,
        ]);
    }

    /**
     * Mark plan as completed.
     */
    public function complete(): void
    {
        $this->update([
            'status' => 'completed',
            'monitoring_active' => false,
        ]);
    }
}
