'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   CLIMATE EXPERIENCE — Dynamic environment transitions
   Scroll-driven: Sunny → Rainy → Snowy
   ═══════════════════════════════════════════════════════ */

const climates = [
  {
    name: 'Sunny',
    temp: '32°C',
    bg: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 40%, #fff8e1 100%)',
    emoji: '☀️',
    description: 'Clear skies, warm breezes, and golden light',
  },
  {
    name: 'Rainy',
    temp: '18°C',
    bg: 'linear-gradient(180deg, #546e7a 0%, #78909c 40%, #cfd8dc 100%)',
    emoji: '🌧️',
    description: 'Gentle rain, misty mornings, and fresh petrichor',
  },
  {
    name: 'Snowy',
    temp: '-5°C',
    bg: 'linear-gradient(180deg, #e3e8ef 0%, #eceff1 40%, #f5f5f5 100%)',
    emoji: '❄️',
    description: 'Crisp air, powder snow, and serene silence',
  },
];

/* Pre-generate particle data to avoid recreating on every render */
const sunRayData = [...Array(8)].map((_, i) => ({
  key: `sun-${i}`,
  rotation: i * 45,
  delay: i * 0.5,
}));

const rainDropData = [...Array(40)].map((_, i) => ({
  key: `rain-${i}`,
  height: 15 + (i % 4) * 10,
  left: (i * 7.3 + 3) % 100,
  topOffset: 20 + (i % 5) * 10,
  duration: 0.6 + (i % 3) * 0.2,
  animDelay: i * 0.05,
}));

const snowFlakeData = [...Array(30)].map((_, i) => ({
  key: `snow-${i}`,
  size: 3 + (i % 5) * 2,
  left: (i * 11.7 + 2) % 100,
  topOffset: 10 + (i % 8) * 5,
  opacity: 0.5 + (i % 5) * 0.1,
  duration: 4 + (i % 4) * 2,
  animDelay: i * 0.3,
}));

export default function ClimateExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tempValue, setTempValue] = useState(32);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=120%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress < 0.33) {
            setActiveIndex(0);
            setTempValue(Math.round(32 - progress * 42));
          } else if (progress < 0.66) {
            setActiveIndex(1);
            setTempValue(Math.round(18 - (progress - 0.33) * 70));
          } else {
            setActiveIndex(2);
            setTempValue(Math.round(-5 - (progress - 0.66) * 10));
          }
          if (progressRef.current) {
            progressRef.current.style.width = `${progress * 100}%`;
          }
        },
      });

      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const climate = climates[activeIndex];
  const isDark = activeIndex === 1;

  return (
    <section
      ref={sectionRef}
      id="climate-experience"
      className="relative h-screen overflow-hidden"
    >
      {/* Dynamic background */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{ background: climate.bg }}
      />

      {/* Weather particles — all rendered, visibility toggled via opacity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun rays */}
        <div className="absolute inset-0" style={{ opacity: activeIndex === 0 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {sunRayData.map((ray) => (
            <div
              key={ray.key}
              className="absolute climate-sunray"
              style={{
                top: '-20%',
                right: '-10%',
                width: '400px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 193, 7, 0.15), transparent)',
                transform: `rotate(${ray.rotation}deg)`,
                transformOrigin: '0 50%',
                animationDelay: `${ray.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Rain drops */}
        <div className="absolute inset-0" style={{ opacity: activeIndex === 1 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {rainDropData.map((drop) => (
            <div
              key={drop.key}
              className="absolute w-[1px] bg-white/20 climate-raindrop"
              style={{
                height: `${drop.height}px`,
                left: `${drop.left}%`,
                top: `-${drop.topOffset}px`,
                animationDuration: `${drop.duration}s`,
                animationDelay: `${drop.animDelay}s`,
              }}
            />
          ))}
        </div>

        {/* Snow flakes */}
        <div className="absolute inset-0" style={{ opacity: activeIndex === 2 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {snowFlakeData.map((flake) => (
            <div
              key={flake.key}
              className="absolute rounded-full bg-white climate-snowflake"
              style={{
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                left: `${flake.left}%`,
                top: `-${flake.topOffset}px`,
                opacity: flake.opacity,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.animDelay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center px-6 max-w-3xl">
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-8"
            style={{ color: isDark ? '#ffffff' : '#1a1a2e' }}>
            CLIMATE INTELLIGENCE
          </p>

          <div className="mb-8">
            <span
              className="font-display text-8xl md:text-[10rem] font-bold transition-colors duration-700"
              style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,46,0.85)' }}
            >
              {tempValue}°
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">{climate.emoji}</span>
            <h3
              className="font-display text-3xl md:text-4xl transition-colors duration-700"
              style={{ color: isDark ? '#ffffff' : '#1a1a2e' }}
            >
              {climate.name}
            </h3>
          </div>
          <p
            className="text-lg transition-colors duration-700 max-w-lg mx-auto"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
          >
            {climate.description}
          </p>

          <div className="flex items-center justify-center gap-3 mt-12">
            {climates.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    background: i === activeIndex
                      ? (isDark ? '#ffffff' : '#1a1a2e')
                      : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,46,0.15)'),
                    transform: i === activeIndex ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
                {i < climates.length - 1 && (
                  <div className="w-8 h-[1px]" style={{
                    background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.1)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 z-20">
        <div
          ref={progressRef}
          className="h-full transition-all duration-300"
          style={{ background: 'linear-gradient(90deg, #ff6b35, #00b4d8, #90caf9)', width: '0%' }}
        />
      </div>
    </section>
  );
}
