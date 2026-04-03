'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Shield, Zap, TreePine, Mountain, Compass,
  Menu, X, ChevronDown, Star, MapPin
} from 'lucide-react';

/* ===== Custom Hook: Intersection Observer ===== */
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

/* ===== Main Page Component ===== */
export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Refs for parallax sections */
  const heroRef = useRef<HTMLDivElement>(null);
  const imageBreakRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  /* Hero parallax: scale-on-scroll + text fade out */
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.2]);
  const heroTextY = useTransform(heroProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);

  /* Immersive image break parallax */
  const { scrollYProgress: breakProgress } = useScroll({ target: imageBreakRef, offset: ["start end", "end start"] });
  const breakY = useTransform(breakProgress, [0, 1], ['-15%', '15%']);

  /* CTA parallax bg */
  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "end start"] });
  const ctaBgY = useTransform(ctaProgress, [0, 1], ['-10%', '10%']);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ===== Sticky Navbar ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'py-3 backdrop-blur-xl bg-white/80 shadow-lg shadow-black/5 border-b border-black/5' 
          : 'py-5 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg transition-all ${scrolled ? 'bg-[#1b3a2d]/10' : 'bg-white/10 backdrop-blur-sm'}`}>
              <TreePine className={`w-6 h-6 ${scrolled ? 'text-[#1b3a2d]' : 'text-white'}`} />
            </div>
            <span className={`text-xl font-bold tracking-[0.15em] transition-colors ${scrolled ? 'text-[#1b3a2d]' : 'text-white'}`}>
              SMARTRAVEL
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'Destinations', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`px-4 py-2 rounded-full text-sm font-medium tracking-wider uppercase transition-all ${scrolled ? 'text-gray-600 hover:text-[#1b3a2d] hover:bg-[#1b3a2d]/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                {item}
              </a>
            ))}
            <div className="w-px h-6 bg-current opacity-20 mx-2" />
            <Link href="/auth/login" className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${scrolled ? 'text-gray-600 hover:text-[#1b3a2d]' : 'text-white/80 hover:text-white'}`}>
              Sign In
            </Link>
            <Link href="/auth/register" className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#c8956c] text-white text-sm font-semibold tracking-wide hover:bg-[#b5845e] transition-all hover:shadow-lg hover:shadow-[#c8956c]/25">
              START YOUR JOURNEY
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg transition-colors" style={{ color: scrolled ? '#1b3a2d' : 'white' }}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 right-0 glass-strong p-6 mx-4 mt-2 rounded-2xl"
          >
            <div className="flex flex-col gap-4">
              {['Features', 'Destinations', 'About'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-gray-800 font-medium py-2">
                  {item}
                </a>
              ))}
              <hr className="border-gray-200" />
              <Link href="/auth/login" className="text-gray-700 font-medium py-2">Sign In</Link>
              <Link href="/auth/register" className="btn-warm text-center text-sm">Start Your Journey</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ===== HERO SECTION — Full-Screen with Scale-on-Scroll ===== */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Background Image with Scale Effect */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0 origin-center">
          <Image
            src="/main-hero.jpg"
            alt="Beautiful Kerala landscape"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        </motion.div>

        {/* Floating Particles */}
        <Stars />

        {/* Hero Content — fades out on scroll */}
        <motion.div
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="relative z-10 h-full flex items-end pb-32 md:pb-40"
        >
          <div className="px-8 md:px-16 lg:px-24 max-w-5xl">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-5xl md:text-7xl lg:text-8xl font-display text-white leading-[1.05] mb-6"
            >
              Travel Smarter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8956c] to-[#dbb896]">
                Explore Further
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-white/60 text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
            >
              Personalized recommendations. Real-time safety. AI-powered destination matching.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-3 text-white/90 text-sm font-semibold tracking-[0.2em] uppercase hover:text-white transition-colors group"
              >
                LET&apos;S EXPLORE
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== TRANSITION IMAGE GRID — Two Overlapping Images ===== */}
      <section className="relative z-10 -mt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="col-span-1 md:col-span-1 relative h-[300px] md:h-[450px] overflow-hidden"
          >
            <Image src="/pic1.jpg" alt="Hill station travel" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="hidden md:block col-span-1 relative h-[450px] overflow-hidden"
          >
            <Image src="/pic3.jpg" alt="Waterfall adventure" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="col-span-1 relative h-[300px] md:h-[450px] overflow-hidden"
          >
            <Image src="/pic2.jpg" alt="Luxury resort" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ===== TAGLINE SECTION — Large Serif Heading ===== */}
      <section className="py-24 md:py-36 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="font-display-italic text-[#c8956c] text-lg md:text-xl mb-6 tracking-wide">
              — Nature-Powered Travel Intelligence —
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-8" style={{ color: 'var(--text-primary)' }}>
              Discover Your{' '}
              <span className="gold-shimmer-text">SmartTravel.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="font-display-italic text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              From misty hill stations and pristine beaches to vibrant cultural destinations, 
              our AI-powered platform offers curated experiences matched to your preferences — 
              with real-time weather, safety monitoring, and insights from similar travelers.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== DESTINATION CARDS — Two-Column Grid ===== */}
      <section id="destinations" className="px-6 md:px-12 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DestinationCard
              image="/mntn.jpg"
              category="HILL STATIONS · NATURE"
              title="Explore Kerala's Misty Highlands"
              subtitle="Tea plantations, wildlife sanctuaries, and breathtaking viewpoints"
              delay={0}
            />
            <DestinationCard
              image="/cst.jpg"
              category="BEACHES · WELLNESS"
              title="Discover Pristine Coastal Escapes"
              subtitle="Sun-kissed shores with Ayurvedic resorts and local cuisine"
              delay={0.15}
            />
          </div>
        </div>
      </section>

      {/* ===== IMMERSIVE IMAGE BREAK — Full-Width Parallax ===== */}
      <section ref={imageBreakRef} className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        <motion.div style={{ y: breakY }} className="absolute inset-0 -top-[15%] -bottom-[15%]">
          <Image src="/kerala-hero.jpg" alt="Kerala panoramic view" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <ScrollReveal>
            <h3 className="font-display text-4xl md:text-6xl text-white text-center px-6">
              Where Intelligence<br />Meets Adventure
            </h3>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS — Steps Section ===== */}
      <section id="features" className="py-24 md:py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="step-label text-center mb-4">How It Works</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-5xl text-center mb-20" style={{ color: 'var(--text-primary)' }}>
              Three Steps to Your<br />Perfect Journey
            </h2>
          </ScrollReveal>

          <div className="space-y-32">
            <StepSection
              step="01"
              title="Tell Us Your Preferences"
              description="Share your travel style, budget, and interests. Our AI learns your unique profile — from adventure levels to cuisine preferences — to build a comprehensive traveler persona."
              image="/sunset.png"
              reverse={false}
              icon={<Compass className="w-6 h-6" />}
            />
            <StepSection
              step="02"
              title="Get Smart Recommendations"
              description="Our hybrid algorithm combines content-based filtering with collaborative insights from similar travelers. Every destination is scored across 8+ factors including weather, safety, crowd levels, and budget."
              image="/travel-hillstation.png"
              reverse={true}
              icon={<Zap className="w-6 h-6" />}
            />
            <StepSection
              step="03"
              title="Travel with Confidence"
              description="Create trip plans with one click and enjoy 24/7 autonomous monitoring. Receive proactive alerts about weather changes, air quality drops, and safety advisories — plus discover nearby attractions."
              image="/travel-beach.png"
              reverse={false}
              icon={<Shield className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* ===== FEATURE CARDS — Three Pillars ===== */}
      <section style={{ background: 'var(--bg-secondary)' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <p className="step-label text-center mb-4">Why SmartTravel</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              Intelligence at Every Step
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Compass className="w-7 h-7" />}
              title="AI Recommendations"
              description="Hybrid algorithm combines your preferences, behavior patterns, and collaborative filtering to find your perfect destination"
              color="emerald"
              delay={0}
            />
            <FeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="Live Safety Monitoring"
              description="Real-time AQI, weather conditions, and disaster alerts via OpenWeather API keep you informed 24/7"
              color="teal"
              delay={0.15}
            />
            <FeatureCard
              icon={<MapPin className="w-7 h-7" />}
              title="Smart Trip Planning"
              description="One-click trip creation with autonomous monitoring, proximity-based nearby attractions, and traveler insights"
              color="cyan"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-20 px-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value="394+" label="Destinations" icon={<Mountain className="w-5 h-5" />} />
            <StatCard value="24/7" label="Monitoring" icon={<Shield className="w-5 h-5" />} />
            <StatCard value="8+" label="AI Factors" icon={<Zap className="w-5 h-5" />} />
            <StatCard value="100%" label="Free to Use" icon={<Star className="w-5 h-5" />} />
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION — Premium Dark ===== */}
      <section id="about" ref={ctaRef} className="relative overflow-hidden py-32 md:py-44 px-6">
        {/* Parallax Background */}
        <motion.div style={{ y: ctaBgY }} className="absolute inset-0 -top-[10%] -bottom-[10%]">
          <Image src="/kathakali.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2419]/85 via-[#1b3a2d]/80 to-[#0f2419]/90" />
        </motion.div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-[#c8956c] text-sm font-semibold tracking-[0.25em] uppercase mb-6">
              Begin Your Journey
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-8 leading-[1.1]">
              Ready to Explore?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="font-display-italic text-lg md:text-xl text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
              Join SmartTravel and let nature guide your next adventure with intelligent, personalized recommendations.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#c8956c] text-white rounded-full font-semibold tracking-wide hover:bg-[#b5845e] hover:shadow-2xl hover:shadow-[#c8956c]/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-10 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 px-6 border-t" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-accent)' }}>
                <TreePine className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
              </div>
              <span className="font-bold text-lg tracking-[0.1em]" style={{ color: 'var(--text-primary)' }}>SMARTRAVEL</span>
            </div>
            <div className="flex items-center gap-10">
              {['Features', 'Destinations', 'About'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium tracking-wider uppercase transition-colors hover:text-[#c8956c]" style={{ color: 'var(--text-muted)' }}>
                  {item}
                </a>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © 2026 SmartTravel. Nature-Powered.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===================================================================
   Reusable Components
   =================================================================== */

/* Scroll Reveal Wrapper */
function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 35 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Floating Stars / Particles */
function Stars() {
  const emptySubscribe = () => () => {};
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const stars = useMemo(() =>
    [...Array(40)].map((_, i) => {
      const seed = (n: number) => {
        const x = Math.sin(n * 127.1 + i * 311.7) * 43758.5453;
        return x - Math.floor(x);
      };
      return {
        left: `${seed(1) * 100}%`,
        top: `${seed(2) * 50}%`,
        opacity: seed(3) * 0.5 + 0.2,
        animation: `glow-pulse ${2 + seed(4) * 4}s ease-in-out infinite ${seed(5) * 2}s`,
      };
    }), []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 opacity-15 z-[1]">
      {stars.map((s, i) => (
        <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={s} />
      ))}
    </div>
  );
}

/* Destination Card with Image Overlay */
function DestinationCard({ image, category, title, subtitle, delay }: {
  image: string; category: string; title: string; subtitle: string; delay: number;
}) {
  return (
    <ScrollReveal delay={delay}>
      <div className="destination-overlay-card h-[400px] md:h-[550px]">
        <Image src={image} alt={title} fill className="object-cover" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-10">
          <p className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{category}</p>
          <h3 className="font-display text-2xl md:text-3xl text-white mb-2 leading-tight">{title}</h3>
          <p className="text-white/50 text-sm mb-4">{subtitle}</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 text-white/80 text-sm font-medium hover:text-white transition-colors group">
            Discover more
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* Step Section — Image + Text with Step Label */
function StepSection({ step, title, description, image, reverse }: {
  step: string; title: string; description: string; image: string; reverse: boolean; icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 md:gap-20 items-center`}
    >
      {/* Image */}
      <div className="flex-1 w-full">
        <ScrollReveal delay={reverse ? 0.15 : 0}>
          <div className="relative h-[350px] md:h-[500px] rounded-2xl overflow-hidden">
            <motion.div style={{ y: imgY }} className="absolute inset-0 -top-[10%] -bottom-[10%]">
              <Image src={image} alt={title} fill className="object-cover" />
            </motion.div>
          </div>
        </ScrollReveal>
      </div>

      {/* Text */}
      <div className="flex-1">
        <ScrollReveal delay={reverse ? 0 : 0.15}>
          <p className="step-label mb-4">STEP {step}</p>
        </ScrollReveal>
        <ScrollReveal delay={reverse ? 0.1 : 0.25}>
          <h3 className="font-display text-3xl md:text-4xl mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </ScrollReveal>
        <ScrollReveal delay={reverse ? 0.2 : 0.35}>
          <p className="text-lg leading-relaxed mb-8 font-display-italic" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={reverse ? 0.3 : 0.45}>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.15em] uppercase transition-colors hover:text-[#c8956c]"
            style={{ color: 'var(--text-secondary)' }}
          >
            GET STARTED
            <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
      </div>
    </motion.div>
  );
}

/* Feature Card */
function FeatureCard({ icon, title, description, color, delay }: { icon: React.ReactNode; title: string; description: string; color: string; delay: number }) {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: 'rgba(27, 58, 45, 0.06)', icon: '#1b3a2d', border: 'rgba(27, 58, 45, 0.1)' },
    teal: { bg: 'rgba(200, 149, 108, 0.08)', icon: '#c8956c', border: 'rgba(200, 149, 108, 0.15)' },
    cyan: { bg: 'rgba(45, 106, 79, 0.06)', icon: '#2d6a4f', border: 'rgba(45, 106, 79, 0.1)' },
  };
  const c = colors[color] || colors.emerald;
  return (
    <ScrollReveal delay={delay}>
      <div className="card-elevated p-8 group h-full">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
          style={{ background: c.bg, color: c.icon, border: `1px solid ${c.border}` }}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="leading-relaxed text-[15px]" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </ScrollReveal>
  );
}

/* Stat Card */
function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <ScrollReveal>
      <div className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl text-center group shadow-lg shadow-black/5 border border-white/50 transition-all duration-300 hover:-translate-y-1">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 transition-transform group-hover:scale-110" style={{ background: 'var(--color-accent)', color: 'var(--color-primary-dark)' }}>
          {icon}
        </div>
        <p className="text-3xl font-bold mb-1 font-display" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-sm font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </ScrollReveal>
  );
}
