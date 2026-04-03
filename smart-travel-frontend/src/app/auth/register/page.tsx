'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ArrowRight, Compass } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.passwordConfirmation
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-voyago-page">
      {/* Full-screen Background */}
      <div className="auth-voyago-bg">
        <Image
          src="/registration.jpg"
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
          <Link href="/auth/login" className="auth-voyago-nav-btn">Sign In</Link>
        </div>
      </nav>

      {/* Main Content — Glassmorphic Card */}
      <div className="auth-voyago-content">
        <div className="auth-voyago-card auth-voyago-card-register">
          {/* Hero Text */}
          <div className="auth-voyago-hero">
            <h1 className="auth-voyago-title font-display">
              Start Your Journey to Your<br />
              <span className="auth-voyago-title-accent">Dream Destination.</span>
            </h1>
            <p className="auth-voyago-subtitle">
              Create an account to discover stunning locations, plan with ease,
              and unlock personalized AI-powered recommendations.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-voyago-error">
              <p>{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-voyago-form">
            <div className="auth-voyago-form-row">
              <div className="auth-voyago-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              <div className="auth-voyago-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="auth-voyago-form-row">
              <div className="auth-voyago-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <div className="auth-voyago-field">
                <label htmlFor="passwordConfirmation">Confirm Password</label>
                <input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  required
                  value={formData.passwordConfirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-voyago-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-voyago-footer">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
