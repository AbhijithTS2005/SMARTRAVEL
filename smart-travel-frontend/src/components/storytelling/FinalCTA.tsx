'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   FINAL CTA — Minimal with glowing button
   "Your perfect destination isn't searched… It's discovered."
   ═══════════════════════════════════════════════════════ */

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text reveal
      const words = textRef.current?.querySelectorAll('.cta-word');
      if (words) {
        gsap.fromTo(words,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Button glow pulse
      gsap.fromTo(buttonRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1,
          delay: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Button glow animation
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.2,
          opacity: 0.6,
          repeat: -1,
          yoyo: true,
          duration: 2,
          ease: 'power1.inOut',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Mouse-following glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const ctaText = "Your perfect destination isn't searched… It's discovered.";
  const ctaWords = ctaText.split(' ');

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      className="relative py-40 md:py-56 px-6 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: '#fafbfe' }}
      onMouseMove={handleMouseMove}
    >
      {/* Mouse-following glow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(0, 180, 216, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(255, 107, 53, 0.02) 0%, transparent 50%)
        `,
      }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main CTA text */}
        <div ref={textRef} className="mb-16">
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#1a1a2e] leading-[1.15] tracking-tight">
            {ctaWords.map((word, i) => (
              <span
                key={i}
                className={`cta-word inline-block mr-[0.3em] opacity-0 ${
                  word === "discovered." ? 'font-display italic' : ''
                }`}
                style={
                  word === "discovered."
                    ? {
                        background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }
                    : undefined
                }
              >
                {word}
              </span>
            ))}
          </h2>
        </div>

        {/* Glowing CTA button */}
        <div className="relative inline-block">
          {/* Glow behind button */}
          <div
            ref={glowRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.4), rgba(0, 150, 199, 0.3))',
              filter: 'blur(25px)',
              transform: 'scale(1.3)',
            }}
          />

          <Link
            ref={buttonRef}
            href="/destinations"
            className="relative inline-flex items-center gap-3 px-10 py-5 rounded-full text-white text-lg font-semibold tracking-wide transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl opacity-0"
            style={{
              background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
              boxShadow: '0 8px 30px rgba(0, 180, 216, 0.3)',
            }}
          >
            Start Your Journey
            <span className="text-xl">→</span>
          </Link>
        </div>

        {/* Subtitle */}
        <p className="text-[#9ca3af] text-sm mt-12 tracking-wide">
          394+ destinations · Real-time data · AI-powered matching
        </p>
      </div>
    </section>
  );
}
