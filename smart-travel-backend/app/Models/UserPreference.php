<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'climate_preference',
        'min_budget',
        'max_budget',
        'travel_types',
        'crowd_preference',
        'air_quality_sensitive',
        'season_preferences',
        'activities_interest',
        'preferred_min_temp',
        'preferred_max_temp',
        'learned_profile',
    ];

    protected $casts = [
        'travel_types' => 'array',
        'season_preferences' => 'array',
        'activities_interest' => 'array',
        'learned_profile' => 'array',
        'air_quality_sensitive' => 'boolean',
        'min_budget' => 'decimal:2',
        'max_budget' => 'decimal:2',
        'preferred_min_temp' => 'decimal:1',
        'preferred_max_temp' => 'decimal:1',
    ];

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
