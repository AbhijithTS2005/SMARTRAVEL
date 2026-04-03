'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThermometerSun, Compass, Wallet } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   PERSONALIZATION SECTION — Animated preference cards
   Temperature · Travel Type · Budget
   ═══════════════════════════════════════════════════════ */

const cards = [
  {
    icon: ThermometerSun,
    title: 'Temperature',
    subtitle: 'Your climate comfort',
    description: 'We analyze real-time weather data to match destinations with your ideal temperature range.',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    iconBg: 'rgba(255, 107, 53, 0.1)',
    iconColor: '#ff6b35',
  },
  {
    icon: Compass,
    title: 'Travel Type',
    subtitle: 'Your adventure style',
    description: 'Whether you seek beaches, mountains, culture, or wildlife — we find your perfect match.',
    gradient: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    iconBg: 'rgba(0, 180, 216, 0.1)',
    iconColor: '#00b4d8',
  },
  {
    icon: Wallet,
    title: 'Budget',
    subtitle: 'Your spending sweet spot',
    description: 'Smart recommendations within your budget, from backpacking to luxury getaways.',
    gradient: 'linear-gradient(135deg, #2d6a4f, #40916c)',
    iconBg: 'rgba(45, 106, 79, 0.1)',
    iconColor: '#2d6a4f',
  },
];

export default function PersonalizationSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

      // Staggered card animations
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        const direction = i % 2 === 0 ? -80 : 80;
        gsap.fromTo(card,
          {
            opacity: 0,
            x: direction,
            rotateY: i % 2 === 0 ? -8 : 8,
          },
          {
            opacity: 1,
            x: 0,
            rotateY: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
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
      id="personalization"
      className="relative py-20 md:py-28 px-6 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: '#fafbfe' }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(0, 180, 216, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(255, 107, 53, 0.03) 0%, transparent 50%)
        `,
      }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section heading */}
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#00b4d8' }}>
            PERSONALIZED FOR YOU
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
            We learn what{' '}
            <span className="font-display italic" style={{ color: '#00b4d8' }}>
              moves you
            </span>
          </h2>
          <p className="text-[#6b7280] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Three dimensions that define your perfect trip — analyzed in real-time to curate destinations uniquely for you.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="group relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-3 cursor-default"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.08)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 180, 216, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Gradient top border */}
                <div
                  className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: card.gradient }}
                />

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-7 h-7" style={{ color: card.iconColor }} />
                </div>

                {/* Content */}
                <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: card.iconColor }}>
                  {card.subtitle}
                </p>
                <h3 className="font-display text-2xl text-[#1a1a2e] mb-3">{card.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{card.description}</p>

                {/* Decorative number */}
                <div
                  className="absolute bottom-6 right-8 font-display text-[5rem] leading-none font-bold opacity-[0.03]"
                  style={{ color: card.iconColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
