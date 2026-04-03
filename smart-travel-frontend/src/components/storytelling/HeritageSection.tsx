'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   HERITAGE SECTION — Cinematic Kathakali Reveal
   Premium cultural centerpiece for Kerala
   ═══════════════════════════════════════════════════════ */

export default function HeritageSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image Reveal
      gsap.fromTo(imageRef.current,
        { scale: 1.1, opacity: 0.3 },
        {
          scale: 1, opacity: 1,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Text Reveal
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.3,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="heritage-reveal"
      className="relative py-24 md:py-32 px-6 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: '#fafbfe' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Two-column: Text + Image */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Text */}
          <div ref={textRef} className="flex-1 text-center lg:text-left">
            <p className="text-xs font-bold tracking-[0.5em] uppercase mb-4" style={{ color: '#2d6a4f' }}>
              🌴 WHERE ART COMES ALIVE
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
              Kerala&apos;s{' '}
              <span className="font-display italic" style={{ color: '#2d6a4f' }}>Heritage</span>
            </h2>
            <div className="w-16 h-1 bg-[#2d6a4f] mx-auto lg:mx-0 mb-6 rounded-full opacity-30" />
            <p className="text-[#6b7280] text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Every expression tells a thousand-year-old story. Experience the magic of Kathakali,
              the soul of God&apos;s Own Country.
            </p>
          </div>

          {/* Right: Kathakali Image */}
          <div ref={imageRef} className="flex-1 relative w-full aspect-square max-w-md mx-auto lg:mx-0">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
              style={{
                border: '1px solid rgba(45, 106, 79, 0.1)',
                boxShadow: '0 25px 80px rgba(45, 106, 79, 0.12)',
              }}>
              <Image
                src="/kathakali-premium.png"
                alt="Kathakali Heritage"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
