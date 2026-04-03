'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Home, Map, Calendar, Bell, Settings, LogOut, TreePine, Menu, X,
  Heart, Languages, ShieldAlert, Trophy
} from 'lucide-react';

export default function TopNav() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user, logout } = useAuth() as any;
  const { language, setLanguage, t } = useLanguage();
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
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    { name: t('nav.destinations'), href: '/destinations', icon: Map },
    { name: t('nav.travelPlans'), href: '/travel-plans', icon: Calendar },
    { name: t('nav.notifications'), href: '/notifications', icon: Bell },
  ];

  const secondaryNav = [
    { name: t('nav.wishlist'), href: '/wishlist', icon: Heart },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
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
        scrolled
          ? 'py-3 backdrop-blur-xl border-b'
          : 'py-5 bg-transparent'
      }`}
      style={scrolled ? { background: 'rgba(245, 240, 234, 0.85)', borderColor: 'rgba(0,0,0,0.06)' } : {}}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.2)' }}>
            <TreePine className="w-5 h-5 text-[#c8956c]" />
          </div>
          <span className="text-black text-lg font-bold tracking-[0.12em]">SMARTRAVEL</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {primaryNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
                pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                  ? 'text-[#c8956c] bg-[#c8956c]/10'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all flex items-center gap-1.5 ${
                moreOpen || secondaryNav.some(i => pathname === i.href)
                  ? 'text-[#c8956c] bg-[#c8956c]/10'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
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
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                            pathname === item.href
                              ? 'text-[#c8956c] bg-[#c8956c]/8'
                              : 'text-black/60 hover:text-black hover:bg-black/5'
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

        {/* Language Toggle + User + Logout */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#e8e0d6] hover:border-[#c8956c]/40 transition-all"
            style={{ color: '#c8956c' }}
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5" />
            {language === 'en' ? 'ML' : 'EN'}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #c8956c, #dbb896)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-black/60 text-sm font-medium">{user?.name}</span>
          </div>
          <button onClick={logout} className="text-black/30 hover:text-red-400 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Burger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-black p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu — all items flat */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden backdrop-blur-xl border-t"
            style={{ background: 'rgba(245, 240, 234, 0.95)', borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <div className="px-6 py-4 space-y-1">
              {allNav.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      pathname === item.href ? 'text-[#c8956c] bg-[#c8956c]/10' : 'text-black/60 hover:text-black'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[#c8956c] hover:bg-[#c8956c]/10 transition-all"
              >
                <Languages className="w-5 h-5" />
                <span className="font-medium">{language === 'en' ? 'മലയാളം' : 'English'}</span>
              </button>
              <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-black/40 hover:text-red-400 transition-all">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
