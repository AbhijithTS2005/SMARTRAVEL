'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ArrowRight, Compass } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-voyago-page">
      {/* Full-screen Background */}
      <div className="auth-voyago-bg">
        <Image
          src="/login.jpg"
          alt="Travel destination"
          fill
          className="object-cover"
        />
        <div className="auth-voyago-overlay" />
      </div>

      {/* Floating particles for depth */}
      <div className="auth-voyago-particles">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="auth-voyago-nav">
        <Link href="/" className="auth-voyago-logo">
          <div className="auth-voyago-logo-icon">
            <Compass className="w-5 h-5" />
          </div>
          <span>SMARTRAVEL</span>
        </Link>
        <div className="auth-voyago-nav-links">
          <Link href="/" className="auth-voyago-nav-link">Homepage</Link>
          <Link href="/auth/register" className="auth-voyago-nav-btn">Register</Link>
        </div>
      </nav>

      {/* Main Content — Glassmorphic Card */}
      <div className="auth-voyago-content">
        <div className="auth-voyago-card">
          {/* Hero Text */}
          <div className="auth-voyago-hero">
            <h1 className="auth-voyago-title font-display">
              Welcome Back to Your<br />
              <span className="auth-voyago-title-accent">Journey.</span>
            </h1>
            <p className="auth-voyago-subtitle">
              Sign in to continue exploring destinations, plan with ease, and
              create memories that last a lifetime.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-voyago-error">
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-voyago-form">
            <div className="auth-voyago-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="auth-voyago-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-voyago-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-voyago-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
