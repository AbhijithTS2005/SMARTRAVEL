'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cloud, Sun, Wind, Droplets, Eye, Gauge } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   LIVE WEATHER — Glassmorphism weather dashboard
   Simulated real-time UI with animated icons
   ═══════════════════════════════════════════════════════ */

const weatherCards = [
  {
    icon: Sun,
    label: 'Temperature',
    value: '26°C',
    detail: 'Feels like 28°C',
    iconColor: '#ff6b35',
    animation: 'spin-slow',
  },
  {
    icon: Wind,
    label: 'Wind Speed',
    value: '12 km/h',
    detail: 'NE direction',
    iconColor: '#00b4d8',
    animation: 'sway',
  },
  {
    icon: Droplets,
    label: 'Humidity',
    value: '65%',
    detail: 'Comfortable',
    iconColor: '#4fc3f7',
    animation: 'drip',
  },
  {
    icon: Eye,
    label: 'Visibility',
    value: '10 km',
    detail: 'Clear',
    iconColor: '#2d6a4f',
    animation: 'pulse',
  },
  {
    icon: Gauge,
    label: 'AQI',
    value: '42',
    detail: 'Good',
    iconColor: '#66bb6a',
    animation: 'pulse',
  },
  {
    icon: Cloud,
    label: 'Cloud Cover',
    value: '20%',
    detail: 'Mostly clear',
    iconColor: '#9e9e9e',
    animation: 'float',
  },
];

export default function LiveWeather() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const mainCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Main weather card
      gsap.fromTo(mainCardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Staggered weather cards
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 0.6,
            ease: 'power3.out',
            delay: i * 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 50%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="live-weather"
      className="relative py-32 md:py-44 px-6 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(0, 180, 216, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(255, 107, 53, 0.02) 0%, transparent 50%)
        `,
      }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#00b4d8' }}>
            LIVE CONDITIONS
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
            Real-time{' '}
            <span className="font-display italic" style={{ color: '#00b4d8' }}>weather</span>
          </h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">
            Live atmospheric data, updated every minute, for the destinations you care about.
          </p>
        </div>

        {/* Main featured weather card */}
        <div
          ref={mainCardRef}
          className="rounded-3xl p-8 md:p-12 mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Weather animation */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 107, 53, 0.1))',
                  animation: 'glow-pulse 3s ease-in-out infinite',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sun className="w-16 h-16" style={{ color: '#ff6b35', animation: 'spin 20s linear infinite' }} />
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <p className="text-[#6b7280] text-sm mb-1">Currently in</p>
              <h3 className="font-display text-3xl text-[#1a1a2e] mb-2">Kerala, India</h3>
              <p className="text-[#9ca3af] text-sm">Last updated: Just now</p>
            </div>

            {/* Temperature */}
            <div className="text-center">
              <span
                className="font-display text-7xl md:text-8xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                26°
              </span>
              <p className="text-[#6b7280] text-sm mt-1">Partly Cloudy</p>
            </div>
          </div>
        </div>

        {/* Weather metric cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {weatherCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 group cursor-default"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  boxShadow: '0 2px 20px rgba(0, 0, 0, 0.02)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.02)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.iconColor}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: card.iconColor }} />
                  </div>
                  <span className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider">{card.label}</span>
                </div>
                <p className="text-[#1a1a2e] text-2xl font-bold mb-1">{card.value}</p>
                <p className="text-[#9ca3af] text-xs">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
