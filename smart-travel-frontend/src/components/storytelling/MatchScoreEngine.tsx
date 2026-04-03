'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   MATCH SCORE ENGINE — Animated circular progress
   Temperature Match · Travel Match · Final Score
   ═══════════════════════════════════════════════════════ */

const scores = [
  { label: 'Temperature', sublabel: 'Climate compatibility', value: 87, color: '#ff6b35', trackColor: 'rgba(255, 107, 53, 0.1)' },
  { label: 'Travel Style', sublabel: 'Activity alignment', value: 92, color: '#00b4d8', trackColor: 'rgba(0, 180, 216, 0.1)' },
  { label: 'Final Score', sublabel: 'Overall match', value: 89, color: '#2d6a4f', trackColor: 'rgba(45, 106, 79, 0.1)' },
];

// SVG circular progress component
function CircularProgress({
  value,
  color,
  trackColor,
  size = 200,
  strokeWidth = 8,
}: {
  value: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-[2000ms] ease-out"
      />
    </svg>
  );
}

export default function MatchScoreEngine() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState(false);
  const [counters, setCounters] = useState(scores.map(() => 0));

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

      // Card reveals + counter animation trigger
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            delay: i * 0.15,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
              onEnter: () => setAnimated(true),
              onLeaveBack: () => {
                setAnimated(false);
                setCounters(scores.map(() => 0));
              },
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Counter animation
  useEffect(() => {
    if (!animated) return;

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounters(scores.map(s => Math.round(s.value * eased)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animated]);

  return (
    <section
      ref={sectionRef}
      id="match-score"
      className="relative py-20 md:py-28 px-6 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: '#fafbfe' }}
    >
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(0, 180, 216, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(255, 107, 53, 0.03) 0%, transparent 50%)
        `,
      }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#ff6b35' }}>
            MATCH ENGINE
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
            Your compatibility{' '}
            <span className="font-display italic" style={{ color: '#ff6b35' }}>score</span>
          </h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">
            Our AI analyzes multiple dimensions to calculate your perfect match percentage.
          </p>
        </div>

        {/* Score cards */}
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {scores.map((score, i) => (
            <div
              key={score.label}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="flex flex-col items-center text-center group"
            >
              {/* Circular progress */}
              <div className="relative mb-8">
                <CircularProgress
                  value={animated ? score.value : 0}
                  color={score.color}
                  trackColor={score.trackColor}
                  size={180}
                  strokeWidth={6}
                />
                {/* Counter in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-display text-5xl font-bold"
                    style={{ color: score.color }}
                  >
                    {counters[i]}
                  </span>
                  <span className="text-[#1a1a2e]/40 text-sm font-medium">%</span>
                </div>
              </div>

              {/* Label */}
              <h3 className="font-display text-xl text-[#1a1a2e] mb-2">{score.label}</h3>
              <p className="text-[#6b7280] text-sm">{score.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Summary bar at bottom */}
        <div className="mt-20 flex items-center justify-center">
          <div
            className="px-8 py-4 rounded-2xl flex items-center gap-6"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.04)',
            }}
          >
            <span className="text-[#6b7280] text-sm">Based on your preferences and live data</span>
            <div className="w-[1px] h-6 bg-[#e5e7eb]" />
            <span className="text-[#1a1a2e] text-sm font-semibold">Updated in real-time</span>
          </div>
        </div>
      </div>
    </section>
  );
}
