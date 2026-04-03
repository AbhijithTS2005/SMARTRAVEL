<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DestinationActivity extends Model
{
    protected $fillable = [
        'destination_id',
        'activity_name',
        'activity_type',
        'description',
    ];

    /**
     * Get the destination that owns this activity.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }
}
