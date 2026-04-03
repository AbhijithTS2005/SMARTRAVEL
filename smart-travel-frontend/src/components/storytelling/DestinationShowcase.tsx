'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   DESTINATION SHOWCASE — Horizontal scroll within vertical
   Fullscreen image cards with parallax
   ═══════════════════════════════════════════════════════ */

const showcaseDestinations = [
  {
    name: 'Manali',
    subtitle: 'Himachal Pradesh, India',
    description: 'A high-altitude Himalayan resort town wrapped in snow-capped mountains, flowing rivers, and lush deodar forests.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgImage: '/kerala-hero.jpg',
    temp: '8°C',
    rating: '4.8',
  },
  {
    name: 'Bali',
    subtitle: 'Indonesia',
    description: 'An island paradise where ancient temples meet turquoise waters, terraced rice paddies, and volcanic landscapes.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bgImage: '/kerala-hero.jpg',
    temp: '28°C',
    rating: '4.9',
  },
  {
    name: 'Reykjavik',
    subtitle: 'Iceland',
    description: 'A capital city between dramatic fjords and geothermal springs, where the Northern Lights paint the sky.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    bgImage: '/kerala-hero.jpg',
    temp: '-2°C',
    rating: '4.7',
  },
  {
    name: 'Santorini',
    subtitle: 'Greece',
    description: 'Sun-drenched whitewashed villages cascading down volcanic cliffs, overlooking the deep blue Aegean Sea.',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    bgImage: '/kerala-hero.jpg',
    temp: '24°C',
    rating: '4.9',
  },
];

export default function DestinationShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

      // Horizontal scroll — pin the section and scrub horizontally
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const totalWidth = scrollContainer.scrollWidth - window.innerWidth;

      gsap.to(scrollContainer, {
        x: -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: `+=${totalWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="destination-showcase" className="relative overflow-hidden">
      {/* Section heading (above the pinned area) */}
      <div className="py-20 px-6 md:px-16 lg:px-24 text-center" style={{ background: '#ffffff' }}>
        <div ref={headingRef}>
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#00b4d8' }}>
            FEATURED DESTINATIONS
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
            Scroll through{' '}
            <span className="font-display italic" style={{ color: '#00b4d8' }}>paradise</span>
          </h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">
            Swipe horizontally through our handpicked destinations — each one a world waiting to be discovered.
          </p>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div ref={containerRef} className="relative h-screen overflow-hidden" style={{ background: '#f5f7fa' }}>
        <div
          ref={scrollContainerRef}
          className="flex h-full items-center gap-8 px-8"
          style={{ width: `${showcaseDestinations.length * 85}vw` }}
        >
          {showcaseDestinations.map((dest, i) => (
            <div
              key={dest.name}
              className="relative flex-shrink-0 rounded-3xl overflow-hidden group cursor-pointer"
              style={{
                width: '75vw',
                height: '75vh',
                maxWidth: '900px',
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                style={{ background: dest.gradient }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Card number */}
              <div className="absolute top-8 left-8 z-10">
                <span className="text-white/20 font-display text-8xl font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-10 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    ⭐ {dest.rating}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    🌡️ {dest.temp}
                  </div>
                </div>

                <h3 className="font-display text-4xl md:text-5xl text-white mb-2 leading-tight">
                  {dest.name}
                </h3>
                <p className="text-white/60 text-sm mb-4 uppercase tracking-widest">{dest.subtitle}</p>
                <p className="text-white/50 text-base max-w-lg leading-relaxed">{dest.description}</p>

                {/* CTA */}
                <button className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                  Explore →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
