<?php

namespace App\Services;

class ClimateService
{
    /**
     * Detect climate type based on temperature
     *
     * @param float $temperature Temperature in Celsius
     * @return string Climate type: cool, moderate, warm, hot
     */
    public function detectClimate(float $temperature): string
    {
        if ($temperature < 20) {
            return 'cool';
        } elseif ($temperature >= 20 && $temperature < 28) {
            return 'moderate';
        } elseif ($temperature >= 28 && $temperature < 35) {
            return 'warm';
        } else {
            return 'hot';
        }
    }

    /**
     * Climate compatibility matrix
     * Shows how well different climates match user preferences
     *
     * @return array
     */
    public function getCompatibilityMatrix(): array
    {
        return [
            'cool' => [
                'cool' => 100,
                'moderate' => 70,
                'warm' => 40,
                'hot' => 20,
            ],
            'moderate' => [
                'cool' => 70,
                'moderate' => 100,
                'warm' => 70,
                'hot' => 40,
            ],
            'warm' => [
                'cool' => 40,
                'moderate' => 70,
                'warm' => 100,
                'hot' => 70,
            ],
            'hot' => [
                'cool' => 20,
                'moderate' => 40,
                'warm' => 70,
                'hot' => 100,
            ],
        ];
    }

    /**
     * Calculate climate compatibility score
     *
     * @param string $userPreference User's climate preference
     * @param string $actualClimate Actual destination climate
     * @return int Score from 0-100
     */
    public function calculateCompatibilityScore(string $userPreference, string $actualClimate): int
    {
        $matrix = $this->getCompatibilityMatrix();
        return $matrix[$userPreference][$actualClimate] ?? 50;
    }

    /**
     * Get climate description
     *
     * @param string $climate Climate type
     * @return string Human-readable description
     */
    public function getClimateDescription(string $climate): string
    {
        return match ($climate) {
            'cool' => 'Cool and pleasant',
            'moderate' => 'Comfortable and mild',
            'warm' => 'Warm and sunny',
            'hot' => 'Hot and tropical',
            default => 'Variable',
        };
    }
}
