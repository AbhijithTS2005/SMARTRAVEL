/**
 * SSR-safe localStorage utilities
 * Prevents hydration errors in Next.js
 */

interface User {
  id: number;
  name: string;
  email: string;
}

export const storage = {
  /**
   * Get auth token safely
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  /**
   * Get user data safely
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (!userData || userData === 'undefined' || userData === 'null') return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },

  /**
   * Set auth token
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },

  /**
   * Set user data
   */
  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear all auth data
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * Check if running in browser
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  },
};
