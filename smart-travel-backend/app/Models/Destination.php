<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Destination extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'latitude',
        'longitude',
        'district',
        'primary_type',
        'images',
        'avg_budget_min',
        'avg_budget_max',
        'crowd_level',
        'popularity_score',
        'is_active',
        'source',
    ];

    protected $casts = [
        'images' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'avg_budget_min' => 'decimal:2',
        'avg_budget_max' => 'decimal:2',
        'popularity_score' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get a valid photo URL for this destination.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (empty($this->images)) {
            return null;
        }

        $url = $this->images[0];

        // Return only if it looks like a full URL
        if (str_starts_with($url, 'http')) {
            return $url;
        }

        return null;
    }

    /**
     * Get the climate data for this destination.
     */
    public function climateData(): HasMany
    {
        return $this->hasMany(DestinationClimate::class);
    }

    /**
     * Get the current climate data for this destination (for recommendations).
     * Returns the most recent climate record.
     */
    public function climate()
    {
        return $this->hasOne(DestinationClimate::class)->latestOfMany();
    }

    /**
     * Get the activities available at this destination.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(DestinationActivity::class);
    }

    /**
     * Get user interactions for this destination.
     */
    public function interactions(): HasMany
    {
        return $this->hasMany(UserInteraction::class);
    }

    /**
     * Get recommendation logs for this destination.
     */
    public function recommendationLogs(): HasMany
    {
        return $this->hasMany(RecommendationLog::class);
    }

    /**
     * Get notifications related to this destination.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get disaster alerts for this destination.
     */
    public function disasterAlerts(): HasMany
    {
        return $this->hasMany(DisasterAlert::class);
    }

    /**
     * Get users tracking this destination.
     */
    public function trackingUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_tracking_destinations')
            ->withPivot('started_at', 'is_active', 'travel_date')
            ->withTimestamps();
    }

    /**
     * Increment the popularity score.
     */
    public function incrementPopularity(int $amount = 1): void
    {
        $this->increment('popularity_score', $amount);
    }

    /**
     * Get wishlists for this destination.
     */
    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Get reviews for this destination.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the average rating for this destination.
     */
    public function getAverageRatingAttribute(): ?float
    {
        $avg = $this->reviews()->avg('rating');
        return $avg ? round($avg, 1) : null;
    }
}
