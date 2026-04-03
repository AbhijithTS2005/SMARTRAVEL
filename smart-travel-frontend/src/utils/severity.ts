/**
 * Centralized severity and color utilities
 */

export const severity = {
  /**
   * Get AQI color classes based on air quality index
   */
  getAQIColor(aqi: string | number): string {
    const aqiNum = typeof aqi === 'string' ? parseInt(aqi) : aqi;
    
    if (aqiNum <= 50) return 'text-green-600 bg-green-100';
    if (aqiNum <= 100) return 'text-yellow-600 bg-yellow-100';
    if (aqiNum <= 150) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  },

  /**
   * Get AQI text label
   */
  getAQILabel(aqi: string | number): string {
    const aqiNum = typeof aqi === 'string' ? parseInt(aqi) : aqi;
    
    if (aqiNum <= 50) return 'Good';
    if (aqiNum <= 100) return 'Moderate';
    if (aqiNum <= 150) return 'Unhealthy (Sensitive)';
    return 'Unhealthy';
  },

  /**
   * Get match score gradient color
   */
  getMatchScoreColor(score: number): string {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-indigo-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  },

  /**
   * Get severity badge color based on alert level
   */
  getSeverityColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'severe':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'moderate':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  },

  /**
   * Get temperature match against user preferences
   * Shows how destination temp relates to user's preferred range
   */
  getTemperatureMatch(
    currentTemp: number,
    minPreferred: number,
    maxPreferred: number
  ): { label: string; color: string; icon: string } {
    // Within preferred range - ideal
    if (currentTemp >= minPreferred && currentTemp <= maxPreferred) {
      return {
        label: 'Ideal for you',
        color: 'text-green-600 bg-green-50',
        icon: '✓',
      };
    }

    // Slightly outside range (within 5°C tolerance)
    if (
      currentTemp >= minPreferred - 5 &&
      currentTemp <= maxPreferred + 5
    ) {
      const deviation = currentTemp > maxPreferred ? 'warmer' : 'cooler';
      return {
        label: `Slightly ${deviation}`,
        color: 'text-yellow-600 bg-yellow-50',
        icon: '⚠',
      };
    }

    // Far outside range
    const deviation = currentTemp > maxPreferred ? 'Too warm' : 'Too cold';
    return {
      label: deviation,
      color: 'text-red-600 bg-red-50',
      icon: '✗',
    };
  },
};
