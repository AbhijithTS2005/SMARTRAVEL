import api from './api';

export type InteractionType = 'view' | 'search' | 'lets_go' | 'scroll' | 'share' | 'favorite';

/**
 * Service for tracking user interactions with destinations.
 * These interactions feed the collaborative filtering algorithm
 * which recommends destinations based on similar user behavior.
 */
export const interactionService = {
  /**
   * Record a user interaction with a destination.
   * Fires silently — never blocks the UI or shows errors.
   */
  async track(
    destinationId: number,
    interactionType: InteractionType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await api.post('/interactions', {
        destination_id: destinationId,
        interaction_type: interactionType,
        metadata,
      });
    } catch {
      // Silent fail — interaction tracking should never interrupt the user experience
      console.debug(`[Interaction] Failed to track ${interactionType} for destination ${destinationId}`);
    }
  },

  /** Track a destination page view */
  trackView(destinationId: number): void {
    this.track(destinationId, 'view', { source: 'detail_page' });
  },

  /** Track "Let's Go" (travel plan creation) */
  trackLetsGo(destinationId: number): void {
    this.track(destinationId, 'lets_go', { source: 'detail_page' });
  },

  /** Track share action */
  trackShare(destinationId: number): void {
    this.track(destinationId, 'share', { source: 'detail_page' });
  },

  /** Track favorite action */
  trackFavorite(destinationId: number): void {
    this.track(destinationId, 'favorite', { source: 'detail_page' });
  },

  /** Track search interaction */
  trackSearch(destinationId: number, query?: string): void {
    this.track(destinationId, 'search', { source: 'search', query });
  },
};
