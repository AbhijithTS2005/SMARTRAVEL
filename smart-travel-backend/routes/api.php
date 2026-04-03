<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PreferenceController;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\DestinationAnalysisController;
use App\Http\Controllers\Api\TravelPlanController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\GeocodingController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\LocationAnalysisController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PackingListController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\EmergencyController;
use App\Http\Controllers\Api\BadgeController;
use App\Http\Controllers\Api\PushSubscriptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Destinations (public - browsing)
Route::get('/destinations', [DestinationController::class, 'index']);
Route::get('/destinations/{id}', [DestinationController::class, 'show']);
Route::get('/destinations/{id}/photos', [DestinationController::class, 'getPhotos']);
Route::get('/destinations-stats', [DestinationController::class, 'stats']);
Route::get('/districts', [DestinationController::class, 'districts']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/fcm-token', [AuthController::class, 'updateFcmToken']);
    Route::get('/me', [AuthController::class, 'me']);

    // Preferences
    Route::get('/preferences', [PreferenceController::class, 'show']);
    Route::post('/preferences', [PreferenceController::class, 'store']);
    Route::put('/preferences', [PreferenceController::class, 'update']);
    Route::delete('/preferences', [PreferenceController::class, 'destroy']);

    // Dashboard (Personalized Recommendations with Live Data)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Recommendations (AI-powered matching)
    Route::get('/recommendations', [RecommendationController::class, 'index']);

    // Destination Analysis (Live AQI + Weather + Suitability)
    Route::get('/destinations/{id}/analyze', [DestinationAnalysisController::class, 'analyze']);

    // Location Analysis (Click-anywhere map analysis)
    Route::middleware('throttle:20,1')->group(function () {
        Route::post('/locations/analyze', [LocationAnalysisController::class, 'analyze']);
        Route::get('/geocoding/search', [GeocodingController::class, 'search']);
    });

    // Destination Recommendation Analysis (NEW - Production-Ready)
    // Rate limited to prevent API abuse: 20 requests per minute per user
    Route::middleware('throttle:20,1')->group(function () {
        Route::post('/recommend/analyze', [RecommendationController::class, 'analyze']);
    });

    // Advanced Recommendation Features
    Route::get('/recommendations/people-also-like/{destinationId}', [RecommendationController::class, 'peopleAlsoLike']);
    Route::get('/recommendations/nearby/{destinationId}', [RecommendationController::class, 'nearby']);

    // User Interaction Tracking (feeds collaborative filtering)
    Route::post('/interactions', [InteractionController::class, 'store']);

    // Travel Plans (Let's Go + Monitoring)
    Route::get('/travel-plans', [TravelPlanController::class, 'index']);
    Route::post('/travel-plans', [TravelPlanController::class, 'store']);
    Route::delete('/travel-plans/{id}', [TravelPlanController::class, 'destroy']);
    Route::post('/travel-plans/{id}/complete', [TravelPlanController::class, 'complete']);
    Route::post('/travel-plans/{id}/toggle-monitoring', [TravelPlanController::class, 'toggleMonitoring']);

    // Notifications (Travel Alerts)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Push Subscriptions (Web Push Notifications)
    Route::post('/push-subscription', [PushSubscriptionController::class, 'store']);
    Route::delete('/push-subscription', [PushSubscriptionController::class, 'destroy']);
    Route::post('/push-test', [PushSubscriptionController::class, 'test']);

    // Wishlist / Bucket List
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);
    Route::get('/wishlist/check/{destinationId}', [WishlistController::class, 'check']);

    // Reviews & Ratings
    Route::get('/destinations/{id}/reviews', [ReviewController::class, 'index']);
    Route::post('/destinations/{id}/reviews', [ReviewController::class, 'store']);
    Route::delete('/destinations/{id}/reviews', [ReviewController::class, 'destroy']);

    // Smart Packing List
    Route::get('/packing-list/{destinationId}', [PackingListController::class, 'generate']);

    // Travel Stats
    Route::get('/stats', [StatsController::class, 'index']);

    // Emergency SOS
    Route::get('/emergency/contacts', [EmergencyController::class, 'contacts']);
    Route::post('/emergency/contacts', [EmergencyController::class, 'storeContact']);
    Route::put('/emergency/contacts/{id}', [EmergencyController::class, 'updateContact']);
    Route::delete('/emergency/contacts/{id}', [EmergencyController::class, 'deleteContact']);
    Route::post('/emergency/sos', [EmergencyController::class, 'triggerSOS']);
    Route::get('/emergency/helplines', [EmergencyController::class, 'helplines']);

    // Badges & Achievements
    Route::get('/badges', [BadgeController::class, 'index']);
});

