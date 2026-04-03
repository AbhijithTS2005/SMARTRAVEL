<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule travel plan monitoring every 30 minutes
Schedule::command('travel:monitor-plans')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// ═══ SMART NOTIFICATIONS SCHEDULE ═══

// Weather & AQI alerts — check every hour for active travel plans
Schedule::command('travel:send-notifications --type=weather')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('travel:send-notifications --type=aqi')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Disaster alerts — check every 15 minutes (urgent)
Schedule::command('travel:send-notifications --type=disaster')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Travel season tips — once a week (Monday 9 AM)
Schedule::command('travel:send-notifications --type=season')
    ->weeklyOn(1, '09:00')
    ->withoutOverlapping()
    ->runInBackground();

// Recommendation updates — daily at 10 AM
Schedule::command('travel:send-notifications --type=recommendation')
    ->dailyAt('10:00')
    ->withoutOverlapping()
    ->runInBackground();

// New match notifications — daily at 6 PM
Schedule::command('travel:send-notifications --type=match')
    ->dailyAt('18:00')
    ->withoutOverlapping()
    ->runInBackground();

// General tips — once a week (Friday 11 AM)
Schedule::command('travel:send-notifications --type=general')
    ->weeklyOn(5, '11:00')
    ->withoutOverlapping()
    ->runInBackground();
