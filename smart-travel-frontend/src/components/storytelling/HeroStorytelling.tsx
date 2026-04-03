'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   HERO SECTION — Fullscreen with word-by-word reveal
   Cinematic hook: "Not every place is meant for you... But one is."
   ═══════════════════════════════════════════════════════ */

export default function HeroStorytelling() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background slow zoom effect
      gsap.to(bgRef.current, {
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Word-by-word reveal for line 1
      const words1 = line1Ref.current?.querySelectorAll('.word');
      if (words1) {
        gsap.fromTo(
          words1,
          { opacity: 0, y: 60, filter: 'blur(8px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              end: 'top 20%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Word-by-word reveal for line 2 (delayed)
      const words2 = line2Ref.current?.querySelectorAll('.word');
      if (words2) {
        gsap.fromTo(
          words2,
          { opacity: 0, y: 60, scale: 0.9, filter: 'blur(8px)' },
          {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 50%',
              end: 'top 10%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Subtitle fade in
      gsap.fromTo(subtitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 30%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scroll indicator bounce
      gsap.to(scrollIndicatorRef.current, {
        y: 12,
        repeat: -1,
        yoyo: true,
        duration: 1.2,
        ease: 'power1.inOut',
      });

      // Fade out hero on scroll away
      gsap.to(sectionRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'bottom 80%',
          end: 'bottom 20%',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const line1Words = ['Not', 'every', 'place', 'is', 'meant', 'for', 'you...'];
  const line2Words = ['But', 'one', 'is.'];

  return (
    <section
      ref={sectionRef}
      id="hero-storytelling"
      className="relative h-[150vh] overflow-hidden"
    >
      {/* Sticky inner container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background with parallax zoom */}
        <div
          ref={bgRef}
          className="absolute inset-0 origin-center"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(0, 212, 255, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 70%, rgba(255, 107, 53, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(200, 149, 108, 0.03) 0%, transparent 60%),
              linear-gradient(180deg, #ffffff 0%, #f8f9fc 40%, #f0f2f8 100%)
            `,
          }}
        />

        {/* Floating ambient particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 4) * 2}px`,
                height: `${2 + (i % 4) * 2}px`,
                left: `${(i * 17 + 5) % 100}%`,
                top: `${(i * 23 + 10) % 100}%`,
                background: i % 2 === 0
                  ? 'rgba(0, 212, 255, 0.3)'
                  : 'rgba(255, 107, 53, 0.25)',
                animation: `glow-pulse ${3 + (i % 5)}s ease-in-out infinite ${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Line 1 */}
          <div ref={line1Ref} className="mb-4">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#1a1a2e] leading-[1.15] tracking-tight">
              {line1Words.map((word, i) => (
                <span key={i} className="word inline-block mr-[0.3em] opacity-0">
                  {word}
                </span>
              ))}
            </h1>
          </div>

          {/* Line 2 — Accent colored */}
          <div ref={line2Ref} className="mb-10">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight">
              {line2Words.map((word, i) => (
                <span
                  key={i}
                  className="word inline-block mr-[0.3em] opacity-0"
                  style={{
                    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
          </div>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-[#6b7280] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0"
          >
            Discover destinations that match your soul — powered by AI, weather intelligence, and travelers like you.
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[#9ca3af] text-xs tracking-[0.3em] uppercase">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border-2 border-[#d1d5db] flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-[#9ca3af] rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
