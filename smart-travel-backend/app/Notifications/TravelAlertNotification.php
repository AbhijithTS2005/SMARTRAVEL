<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TravelAlertNotification extends Notification
{
    use Queueable;

    private array $alertData;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $alertData)
    {
        $this->alertData = $alertData;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database']; // Can add 'mail', 'fcm' later
    }

    /**
     * Get the array representation of the notification (for database).
     */
    public function toArray(object $notifiable): array
    {
        $severity = $this->determineSeverity();
        $message = $this->generateMessage();

        return [
            'type' => 'travel_alert',
            'severity' => $severity,
            'destination' => $this->alertData['destination'],
            'message' => $message,
            'detailed_conditions' => [
                'aqi' => $this->alertData['aqi']['aqi_status'] ?? 'Unknown',
                'aqi_value' => $this->alertData['aqi']['aqi_value'] ?? null,
                'temperature' => $this->alertData['weather']['temperature'] ?? null,
                'weather' => $this->alertData['weather']['description'] ?? 'Unknown',
                'rainfall' => $this->alertData['weather']['rain'] ?? 0,
                'alerts' => $this->alertData['alerts'] ?? [],
            ],
            'safer_alternatives' => $this->alertData['safer_alternatives'] ?? [],
            'action_required' => true,
            'plan_id' => $this->alertData['plan_id'],
            'timestamp' => now()->toDateTimeString(),
        ];
    }

    /**
     * Get the mail representation (optional).
     */
    public function toMail(object $notifiable): MailMessage
    {
        $severity = $this->determineSeverity();
        $message = $this->generateMessage();

        return (new MailMessage)
            ->subject("⚠️ Travel Alert: {$this->alertData['destination']}")
            ->greeting("Travel Safety Alert!")
            ->line($message)
            ->line("Severity: {$severity}")
            ->line($this->getConditionsSummary())
            ->action('View Safer Alternatives', url('/travel-plans'))
            ->line('Please review your travel plans and consider the suggested alternatives.');
    }

    /**
     * Determine alert severity.
     */
    private function determineSeverity(): string
    {
        $hasHighAlerts = !empty(array_filter(
            $this->alertData['alerts'] ?? [],
            fn($a) => $a['severity'] === 'High'
        ));

        $aqiValue = $this->alertData['aqi']['aqi_value'] ?? 0;

        if ($hasHighAlerts || $aqiValue > 250) {
            return 'Severe';
        } elseif ($aqiValue > 180) {
            return 'High';
        } else {
            return 'Medium';
        }
    }

    /**
     * Generate user-friendly message.
     */
    private function generateMessage(): string
    {
        $destination = $this->alertData['destination'];
        $alerts = $this->alertData['alerts'] ?? [];
        $aqiValue = $this->alertData['aqi']['aqi_value'] ?? 0;
        $rainfall = $this->alertData['weather']['rain'] ?? 0;

        $messages = [];

        // Weather alerts
        foreach ($alerts as $alert) {
            if ($alert['type'] === 'Heavy Rainfall') {
                $messages[] = "Heavy rainfall expected ({$rainfall}mm/hour)";
            } elseif ($alert['type'] === 'Storm Warning') {
                $messages[] = "Storm conditions detected";
            } elseif ($alert['type'] === 'High Wind') {
                $messages[] = "High winds detected";
            }
        }

        // AQI alerts
        if ($aqiValue > 250) {
            $messages[] = "Very poor air quality (AQI: {$aqiValue})";
        } elseif ($aqiValue > 180) {
            $messages[] = "Poor air quality (AQI: {$aqiValue})";
        }

        if (empty($messages)) {
            return "Environmental conditions at {$destination} require attention.";
        }

        $conditionsList = implode(', ', $messages);
        return "Severe conditions detected at {$destination}: {$conditionsList}. Consider reviewing your travel plans.";
    }

    /**
     * Get conditions summary for email.
     */
    private function getConditionsSummary(): string
    {
        $aqi = $this->alertData['aqi']['aqi_status'] ?? 'Unknown';
        $temp = $this->alertData['weather']['temperature'] ?? 'N/A';
        $weather = $this->alertData['weather']['description'] ?? 'Unknown';

        return "Current Conditions - AQI: {$aqi}, Temperature: {$temp}°C, Weather: {$weather}";
    }
}
