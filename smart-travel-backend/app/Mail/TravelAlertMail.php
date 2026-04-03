<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TravelAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $alertData;
    public string $locationName;

    /**
     * Create a new message instance.
     */
    public function __construct(array $alertData, string $locationName)
    {
        $this->alertData = $alertData;
        $this->locationName = $locationName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $severity = $this->alertData['severity'] ?? 'Medium';

        return new Envelope(
            subject: "⚠️ Travel Alert [{$severity}]: {$this->locationName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.travel-alert',
            with: [
                'alertData' => $this->alertData,
                'locationName' => $this->locationName,
                'severity' => $this->alertData['severity'] ?? 'Medium',
                'message' => $this->alertData['message'] ?? '',
                'conditions' => $this->alertData['detailed_conditions'] ?? [],
                'alternatives' => $this->alertData['safer_alternatives'] ?? [],
                'planId' => $this->alertData['plan_id'] ?? null,
            ],
        );
    }
}
