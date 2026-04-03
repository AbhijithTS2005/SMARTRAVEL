<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DestinationClimate extends Model
{
    protected $table = 'destination_climate';

    protected $fillable = [
        'destination_id',
        'season',
        'avg_temp_min',
        'avg_temp_max',
        'rainfall_mm',
        'weather_condition',
        'avg_aqi',
    ];

    protected $casts = [
        'avg_temp_min' => 'decimal:1',
        'avg_temp_max' => 'decimal:1',
        'rainfall_mm' => 'decimal:2',
        'avg_aqi' => 'integer',
    ];

    /**
     * Get the destination that owns this climate data.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    /**
     * Get the average temperature (calculated from min and max).
     */
    public function getAvgTemperatureAttribute(): float
    {
        return ($this->avg_temp_min + $this->avg_temp_max) / 2;
    }

    /**
     * Get the climate type based on average temperature.
     */
    public function getClimateTypeAttribute(): string
    {
        $avgTemp = $this->avg_temperature;

        if ($avgTemp < 15) {
            return 'Cold';
        } elseif ($avgTemp < 25) {
            return 'Moderate';
        } elseif ($avgTemp < 32) {
            return 'Warm';
        }
        return 'Hot';
    }

    /**
     * Get average humidity (default to 60% as Kerala is generally humid).
     */
    public function getAvgHumidityAttribute(): float
    {
        // Default humidity for Kerala climate
        return 60.0;
    }
}
