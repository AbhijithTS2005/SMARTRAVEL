export interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

class GeocodingService {
  private lastRequestTime = 0;
  private minInterval = 1100; // Nominatim requires max 1 req/sec

  async searchPlaces(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 3) return [];

    // Rate limiting — Nominatim usage policy: max 1 request per second
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }

    try {
      this.lastRequestTime = Date.now();

      // Call Nominatim directly — free, no API key required
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        accept_language: 'en',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'SmartTravelApp/1.0 (https://smartravel.com)',
          },
        }
      );

      if (!response.ok) {
        console.error('Nominatim API error:', response.status);
        return [];
      }

      const data: GeocodingResult[] = await response.json();
      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }
}

export const geocodingService = new GeocodingService();
