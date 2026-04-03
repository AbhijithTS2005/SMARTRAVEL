<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\PushSubscription;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'fcm_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's preferences.
     */
    public function preferences()
    {
        return $this->hasOne(UserPreference::class);
    }

    /**
     * Get all interactions by this user.
     */
    public function interactions()
    {
        return $this->hasMany(UserInteraction::class);
    }

    /**
     * Get recommendation logs for this user.
     */
    public function recommendationLogs()
    {
        return $this->hasMany(RecommendationLog::class);
    }

    /**
     * Get notifications for this user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get unread notifications for this user.
     */
    public function unreadNotifications()
    {
        return $this->notifications()->where('is_read', false);
    }

    /**
     * Get destinations this user is tracking.
     */
    public function trackingDestinations()
    {
        return $this->hasMany(UserTrackingDestination::class);
    }

    /**
     * Get destinations this user is tracking (through relationship).
     */
    public function trackedDestinations()
    {
        return $this->belongsToMany(Destination::class, 'user_tracking_destinations')
            ->withPivot('started_at', 'is_active', 'travel_date')
            ->withTimestamps();
    }

    /**
     * Get wishlisted items for this user.
     */
    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Get wishlisted destinations (through relationship).
     */
    public function wishlistedDestinations(): BelongsToMany
    {
        return $this->belongsToMany(Destination::class, 'wishlists')
            ->withTimestamps();
    }

    /**
     * Get reviews written by this user.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get emergency contacts for this user.
     */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class);
    }

    /**
     * Get push subscriptions for this user.
     */
    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }
}
