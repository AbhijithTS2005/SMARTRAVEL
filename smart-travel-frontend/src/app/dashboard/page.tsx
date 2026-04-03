'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { dashboardService, type DashboardData } from '@/services/dashboard';
import { destinationsService } from '@/services/destinations';
import { preferencesService } from '@/services/preferences';
import type { Recommendation } from '@/types';
import { severity } from '@/utils/severity';
import {
  Loader2, AlertTriangle, TreePine, Home, Map, Calendar, Bell, Settings,
  LogOut, Menu, X, ArrowRight, Sparkles, Users, Clock, Wind, ThermometerSun,
  Heart, ShieldAlert, Trophy
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   STORYTELLING SECTIONS — Dynamically imported for code-split
   ═══════════════════════════════════════════════════════ */

const HeroStorytelling = dynamic(() => import('@/components/storytelling/HeroStorytelling'), { ssr: false });
const PersonalizationSection = dynamic(() => import('@/components/storytelling/PersonalizationSection'), { ssr: false });
const ClimateExperience = dynamic(() => import('@/components/storytelling/ClimateExperience'), { ssr: false });
const HeritageSection = dynamic(() => import('@/components/storytelling/HeritageSection'), { ssr: false });
const MatchScoreEngine = dynamic(() => import('@/components/storytelling/MatchScoreEngine'), { ssr: false });
const LiveWeather = dynamic(() => import('@/components/storytelling/LiveWeather'), { ssr: false });
const FinalCTA = dynamic(() => import('@/components/storytelling/FinalCTA'), { ssr: false });

/* ═══════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK
   ═══════════════════════════════════════════════════════ */
function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL — Reusable animation wrapper
   ═══════════════════════════════════════════════════════ */
function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 35 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE — Scroll-Based Storytelling + Recommendations
   ═══════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [photos, setPhotos] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const preferences = await preferencesService.getPreferences();
      if (!preferences) { router.push('/preferences'); return; }

      const data = await dashboardService.getDashboard();
      setDashboardData(data);

      // Fetch photos for all recommendations
      const allRecs = [...(data.for_you || []), ...(data.travelers_like_you || []), ...(data.recent_plans || [])];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photosMap: Record<number, any> = {};
      await Promise.all(
        allRecs.map(async (rec) => {
          if (photosMap[rec.id]) return;
          try {
            const response = await destinationsService.getDestinationPhotos(rec.id);
            if (response?.photos?.length > 0) photosMap[rec.id] = response.photos[0];
          } catch { /* skip */ }
        })
      );
      setPhotos(photosMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#ffffff' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-screen" style={{ background: '#fafbfe' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#00b4d8' }} />
              <p className="text-[#9ca3af] text-sm tracking-widest uppercase">Preparing your journey…</p>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-screen p-8" style={{ background: '#fafbfe' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-[#1a1a2e] text-xl font-semibold mb-2">Something went wrong</p>
              <p className="text-[#9ca3af] text-sm mb-8">{error}</p>
              <button onClick={loadDashboard} className="dash-action-btn dash-action-btn-primary">Try Again</button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* ═══ NAVIGATION ═══ */}
            <DashNav user={user} logout={logout} />

            {/* ═══ 1. HERO — Word-by-word reveal ═══ */}
            <HeroStorytelling />

            {/* ═══ 2. PERSONALIZATION — Animated preference cards ═══ */}
            <PersonalizationSection />

            {/* ═══ 3. FOR YOU — Real recommendation data ═══ */}
            <ForYouSection recommendations={dashboardData?.for_you || []} photos={photos} />

            {/* ═══ 4. CLIMATE EXPERIENCE — Dynamic environment transitions ═══ */}
            <ClimateExperience />

            {/* ═══ 5. KERALA HERITAGE — Cinematic Kathakali reveal ═══ */}
            <HeritageSection />

            {/* ═══ 6. MATCH SCORE ENGINE — Animated circular progress ═══ */}
            <MatchScoreEngine />

            {/* ═══ 7. TRAVELERS LIKE YOU — Horizontal scroll with real data ═══ */}
            <TravelersHorizontalSection recommendations={dashboardData?.travelers_like_you || []} photos={photos} />

            {/* ═══ 9. RECENT PLANS — Real recommendation data ═══ */}
            <RecentPlansSection recommendations={dashboardData?.recent_plans || []} photos={photos} />

            {/* ═══ 10. LIVE WEATHER — Glassmorphism dashboard ═══ */}
            <LiveWeather />

            {/* ═══ 11. FINAL CTA — Glowing button ═══ */}
            <FinalCTA />

            {/* ═══ FOOTER ═══ */}
            <DashFooter />
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}


/* ═══════════════════════════════════════════════════════
   FOR YOU — Clean card grid (Light theme)
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ForYouSection({ recommendations, photos }: { recommendations: Recommendation[]; photos: Record<number, any> }) {
  if (recommendations.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-6 md:px-16 lg:px-24" style={{ background: '#ffffff' }}>
      <div className="max-w-[1300px] mx-auto">
        {/* Section header */}
        <ScrollReveal>
          <p className="text-sm font-bold tracking-[0.35em] uppercase mb-5" style={{ color: '#00b4d8' }}>
            <Sparkles className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
            PERSONALIZED FOR YOU
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6 max-w-2xl">
            Destinations that{' '}
            <span className="font-display italic" style={{ color: '#00b4d8' }}>match you</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="text-[#6b7280] text-lg max-w-xl leading-relaxed mb-16">
            AI-curated destinations based on your travel preferences, climate comfort, and budget range.
          </p>
        </ScrollReveal>

        {/* Card grid — centered for small numbers of recommendations */}
        <div className="flex flex-wrap justify-center gap-8">
          {recommendations.map((dest, i) => (
            <div key={dest.id} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[400px]">
              <RecommendationCard destination={dest} photoUrl={photos[dest.id]?.large || photos[dest.id]?.medium} delay={i * 0.1} variant="light" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════
   TRAVELERS LIKE YOU — Horizontal scroll with real data
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TravelersHorizontalSection({ recommendations, photos }: { recommendations: Recommendation[]; photos: Record<number, any> }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      if (headingRef.current) {
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
      }

      // Horizontal scroll pin
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer || recommendations.length === 0) return;

      const totalWidth = scrollContainer.scrollWidth - window.innerWidth;
      if (totalWidth <= 0) return;

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
  }, [recommendations.length]);

  if (recommendations.length === 0) return null;

  return (
    <section ref={sectionRef} id="travelers-horizontal" className="relative overflow-hidden">
      {/* Heading */}
      <div className="py-20 px-6 md:px-16 lg:px-24 text-center" style={{ background: '#ffffff' }}>
        <div ref={headingRef}>
          <p className="text-sm font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#ff6b35' }}>
            <Users className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
            TRAVELERS LIKE YOU
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[#1a1a2e] leading-[1.1] mb-6">
            Scroll through{' '}
            <span className="font-display italic" style={{ color: '#ff6b35' }}>traveler picks</span>
          </h2>
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto">
            Destinations loved by travelers with preferences and interests similar to yours.
          </p>
        </div>
      </div>

      {/* Horizontal scroll container — only if we have enough items to justify it */}
      {recommendations.length >= 3 ? (
        <div ref={containerRef} className="relative h-screen overflow-hidden" style={{ background: '#f5f7fa' }}>
          <div
            ref={scrollContainerRef}
            className="flex h-full items-center gap-8 px-8"
            style={{ width: `${Math.max(recommendations.length * 85, 100)}vw` }}
          >
            {recommendations.map((dest, i) => {
              const imageUrl = photos[dest.id]?.large || photos[dest.id]?.medium || dest.images?.[0];
              const badge = getReasonBadge(dest);
              return (
                <Link
                  key={dest.id}
                  href={`/destinations/${dest.id}`}
                  className="relative flex-shrink-0 rounded-3xl overflow-hidden group cursor-pointer block"
                  style={{ width: '75vw', height: '75vh', maxWidth: '900px' }}
                >
                  {/* Background image or gradient */}
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={dest.name} fill unoptimized className="object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(135deg, hsl(${(i * 60) % 360}, 70%, 55%), hsl(${(i * 60 + 40) % 360}, 60%, 45%))`,
                      }} />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Card number */}
                  <div className="absolute top-8 left-8 z-10">
                    <span className="text-white/20 font-display text-8xl font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Match score badge */}
                  <div className="absolute top-8 right-8 z-10">
                    <div className={`bg-gradient-to-r ${severity.getMatchScoreColor(dest.match_score)} text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl`}>
                      {dest.match_score}% Match
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-10 md:p-12">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5`}>
                        <span>{badge.emoji}</span> {badge.label}
                      </div>
                      {dest.temperature && (
                        <div className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                          🌡️ {dest.temperature}°C
                        </div>
                      )}
                      <div className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                        💨 AQI {dest.live_aqi}
                      </div>
                    </div>

                    <h3 className="font-display text-4xl md:text-5xl text-white mb-2 leading-tight">
                      {dest.name}
                    </h3>
                    <p className="text-white/60 text-sm mb-4 uppercase tracking-widest">{dest.district}</p>

                    {dest.has_alerts && (
                      <div className="inline-flex items-center gap-1.5 bg-red-500/80 text-white px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                        <AlertTriangle className="w-3.5 h-3.5" /> Active Alert
                      </div>
                    )}

                    <div className="mt-2">
                      <span className="inline-flex items-center gap-2 text-white/80 text-sm font-semibold tracking-wider uppercase group-hover:gap-4 transition-all">
                        View Details <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        /* Fallback centered grid for small numbers of items */
        <div className="py-20 px-6 md:px-16 lg:px-24 flex flex-wrap justify-center gap-8" style={{ background: '#f5f7fa' }}>
          {recommendations.map((dest, i) => {
            const imageUrl = photos[dest.id]?.large || photos[dest.id]?.medium || dest.images?.[0];
            return (
              <div key={dest.id} className="w-full max-w-[800px]">
                <RecommendationCard destination={dest} photoUrl={imageUrl} delay={i * 0.1} variant="overlay" />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   RECENT PLANS — Dark section with live data
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RecentPlansSection({ recommendations, photos }: { recommendations: Recommendation[]; photos: Record<number, any> }) {
  if (recommendations.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-6 md:px-16 lg:px-24" style={{
      background: 'linear-gradient(180deg, #0f1729 0%, #162038 50%, #1a2744 100%)',
    }}>
      <div className="max-w-[1300px] mx-auto">
        <ScrollReveal>
          <p className="text-sm font-bold tracking-[0.35em] uppercase mb-5" style={{ color: '#00b4d8' }}>
            <Clock className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
            LIVE DATA
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-6 max-w-2xl">
            Your Recent Plans
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="text-white/30 text-lg max-w-xl leading-relaxed mb-16">
            Re-scored with today&apos;s live weather, air quality, and safety conditions.
          </p>
        </ScrollReveal>

        {/* Card grid — centered for small numbers of recommendations */}
        <div className="flex flex-wrap justify-center gap-8">
          {recommendations.map((dest, i) => (
            <div key={dest.id} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[400px]">
              <RecommendationCard destination={dest} photoUrl={photos[dest.id]?.large || photos[dest.id]?.medium} delay={i * 0.1} variant="dark" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════
   RECOMMENDATION CARD — Reusable card component
   Supports 3 variants: overlay, light, dark
   ═══════════════════════════════════════════════════════ */

function RecommendationCard({
  destination, photoUrl, delay, variant
}: {
  destination: Recommendation;
  photoUrl?: string;
  delay: number;
  variant: 'overlay' | 'light' | 'dark';
}) {
  const imageUrl = photoUrl || destination.images?.[0];
  const badge = getReasonBadge(destination);

  if (variant === 'overlay') {
    return (
      <ScrollReveal delay={delay}>
        <Link href={`/destinations/${destination.id}`} className="block">
          <div className="dash-card-cinematic h-[350px] md:h-[420px]">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f1729, #1a2744)' }}>
              {imageUrl && <Image src={imageUrl} alt={destination.name} fill unoptimized className="object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            </div>
            <div className="absolute inset-0 card-overlay" />
            <div className="absolute top-5 right-5 z-10">
              <div className={`bg-gradient-to-r ${severity.getMatchScoreColor(destination.match_score)} text-white px-3.5 py-1.5 rounded-full text-sm font-bold shadow-xl`}>
                {destination.match_score}%
              </div>
            </div>
            {destination.has_alerts && (
              <div className="absolute top-5 left-5 z-10">
                <div className="bg-red-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Alert
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-10 p-7">
              <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full text-[11px] font-semibold mb-4 shadow-lg`}>
                <span>{badge.emoji}</span><span>{badge.label}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1 font-display leading-tight">{destination.name}</h3>
              <p className="text-white/40 text-sm mb-4">{destination.district}</p>
              <div className="flex items-center gap-4 text-white/40 text-sm">
                <span className="flex items-center gap-1.5"><Wind className="w-4 h-4" /> AQI {destination.live_aqi}</span>
                {destination.temperature && <span className="flex items-center gap-1.5"><ThermometerSun className="w-4 h-4" /> {destination.temperature}°C</span>}
              </div>
            </div>
          </div>
        </Link>
      </ScrollReveal>
    );
  }

  if (variant === 'dark') {
    return (
      <ScrollReveal delay={delay}>
        <Link href={`/destinations/${destination.id}`} className="block group">
          <div className="rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1729, #1a2744)' }}>
              {imageUrl && <Image src={imageUrl} alt={destination.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 z-10">
                <div className={`bg-gradient-to-r ${severity.getMatchScoreColor(destination.match_score)} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                  {destination.match_score}%
                </div>
              </div>
              {destination.has_alerts && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Alert
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 right-3 z-10">
                <div className={`bg-gradient-to-r ${badge.color} text-white px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-lg flex items-center gap-1`}>
                  <span>{badge.emoji}</span><span>{badge.label}</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-1 text-white font-display">{destination.name}</h3>
              <p className="text-sm mb-4 text-white/35">{destination.district}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,180,216,0.08)', color: '#00b4d8' }}>
                  <div className="flex items-center gap-2 mb-1"><Wind className="w-4 h-4" /><span className="text-xs font-medium">AQI</span></div>
                  <p className="text-lg font-bold">{destination.live_aqi}</p>
                  <p className="text-xs mt-0.5 opacity-60">{severity.getAQILabel(destination.live_aqi)}</p>
                </div>
                {destination.temperature && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,53,0.08)', color: '#ff6b35' }}>
                    <div className="flex items-center gap-2 mb-1"><ThermometerSun className="w-4 h-4" /><span className="text-xs font-medium">Temp</span></div>
                    <p className="text-lg font-bold">{destination.temperature}°C</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#00b4d8] group-hover:gap-3 transition-all">
                View Details <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </ScrollReveal>
    );
  }

  // Light variant
  return (
    <ScrollReveal delay={delay}>
      <Link href={`/destinations/${destination.id}`} className="block group">
        <div className="bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-2 border border-black/5">
          <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1729, #1a2744)' }}>
            {imageUrl && <Image src={imageUrl} alt={destination.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 z-10">
              <div className={`bg-gradient-to-r ${severity.getMatchScoreColor(destination.match_score)} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                {destination.match_score}%
              </div>
            </div>
            {destination.has_alerts && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Alert
                </div>
              </div>
            )}
            <div className="absolute bottom-3 right-3 z-10">
              <div className={`bg-gradient-to-r ${badge.color} text-white px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-lg flex items-center gap-1`}>
                <span>{badge.emoji}</span><span>{badge.label}</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg mb-1 text-[#1a1a2e] font-display">{destination.name}</h3>
            <p className="text-sm mb-4 text-[#6b7280]">{destination.district}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={`${severity.getAQIColor(destination.live_aqi)} rounded-xl p-3`}>
                <div className="flex items-center gap-2 mb-1"><Wind className="w-4 h-4" /><span className="text-xs font-medium">AQI</span></div>
                <p className="text-lg font-bold">{destination.live_aqi}</p>
              </div>
              {destination.temperature && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,180,216,0.08)', color: '#0096c7' }}>
                  <div className="flex items-center gap-2 mb-1"><ThermometerSun className="w-4 h-4" /><span className="text-xs font-medium">Temp</span></div>
                  <p className="text-lg font-bold">{destination.temperature}°C</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#00b4d8] group-hover:gap-3 transition-all">
              View Details <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}


/* ═══════════════════════════════════════════════════════
   HELPER — Recommendation badge
   ═══════════════════════════════════════════════════════ */

function getReasonBadge(destination: Recommendation) {
  switch (destination.recommendation_type) {
    case 'collaborative': return { emoji: '👥', label: 'Travelers Pick', color: 'from-pink-500 to-rose-500' };
    case 'recent': return { emoji: '📋', label: destination.recommendation_reason || 'Recent', color: 'from-amber-500 to-orange-500' };
    case 'trending': return { emoji: '🔥', label: 'Trending', color: 'from-orange-500 to-amber-500' };
    default: return { emoji: '🎯', label: 'For You', color: 'from-[#00b4d8] to-[#0096c7]' };
  }
}


/* ═══════════════════════════════════════════════════════
   NAVIGATION — Transparent top bar (white theme)
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashNav({ user, logout }: { user: any; logout: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const primaryNav = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Destinations', href: '/destinations', icon: Map },
    { name: 'Travel Plans', href: '/travel-plans', icon: Calendar },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const secondaryNav = [
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Emergency', href: '/emergency', icon: ShieldAlert },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3 backdrop-blur-xl border-b' : 'py-5 bg-transparent'
      }`}
      style={scrolled ? { background: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(0,0,0,0.06)' } : {}}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0, 180, 216, 0.1)' }}>
            <TreePine className="w-5 h-5" style={{ color: '#00b4d8' }} />
          </div>
          <span className="text-[#1a1a2e] text-lg font-bold tracking-[0.12em]">SMARTRAVEL</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {primaryNav.map(item => (
            <Link key={item.name} href={item.href}
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
                pathname === item.href ? 'text-[#00b4d8] bg-[#00b4d8]/10' : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5'
              }`}>
              {item.name}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all flex items-center gap-1.5 ${
                moreOpen || secondaryNav.some(i => pathname === i.href)
                  ? 'text-[#00b4d8] bg-[#00b4d8]/10'
                  : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5'
              }`}
            >
              More
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden shadow-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div className="py-2">
                    {secondaryNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                            pathname === item.href
                              ? 'text-[#00b4d8] bg-[#00b4d8]/8'
                              : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User avatar + logout */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #00b4d8, #0096c7)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[#1a1a2e]/60 text-sm font-medium">{user?.name}</span>
          </div>
          <button onClick={logout} className="text-[#1a1a2e]/30 hover:text-red-400 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#1a1a2e] p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu — all items flat */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden backdrop-blur-xl border-t"
            style={{ background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="px-6 py-4 space-y-1">
              {allNav.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      pathname === item.href ? 'text-[#00b4d8] bg-[#00b4d8]/10' : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e]'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[#1a1a2e]/40 hover:text-red-400 transition-all">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}


/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */

function DashFooter() {
  return (
    <footer className="py-16 px-6 md:px-16 lg:px-24 border-t" style={{ background: '#fafbfe', borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0, 180, 216, 0.1)' }}>
            <TreePine className="w-5 h-5" style={{ color: '#00b4d8' }} />
          </div>
          <span className="text-[#1a1a2e]/60 font-bold text-lg tracking-[0.1em]">SMARTRAVEL</span>
        </div>
        <div className="flex items-center gap-8">
          {['Destinations', 'Travel Plans', 'Settings'].map(item => (
            <Link key={item} href={`/${item.toLowerCase().replace(' ', '-')}`}
              className="text-[#1a1a2e]/30 text-sm font-medium tracking-wider uppercase hover:text-[#00b4d8] transition-colors">
              {item}
            </Link>
          ))}
        </div>
        <p className="text-[#1a1a2e]/20 text-sm">© 2026 SmartTravel</p>
      </div>
    </footer>
  );
}
