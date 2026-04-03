'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Map, Calendar, Bell, Settings, LogOut, TreePine,
  Heart, Package, BarChart3, Languages, ShieldAlert, Trophy
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    { name: t('nav.destinations'), href: '/destinations', icon: Map },
    { name: t('nav.travelPlans'), href: '/travel-plans', icon: Calendar },
    { name: t('nav.wishlist'), href: '/wishlist', icon: Heart },
    { name: t('nav.packingList'), href: '/packing-list', icon: Package },
    { name: t('nav.stats'), href: '/stats', icon: BarChart3 },
    { name: t('nav.notifications'), href: '/notifications', icon: Bell },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
    { name: 'Emergency SOS', href: '/emergency', icon: ShieldAlert, danger: true },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
  ];

  return (
    <div className="w-[272px] flex flex-col h-screen sticky top-0" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.2)' }}>
            <TreePine className="w-6 h-6" style={{ color: '#c8956c' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              SMARTRAVEL
            </h1>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(200, 149, 108, 0.6)' }}>{t('brand.tagline')}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg" style={{ background: 'linear-gradient(135deg, #c8956c, #dbb896)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-lg border'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                  style={isActive ? {
                    background: 'rgba(200, 149, 108, 0.15)',
                    borderColor: 'rgba(200, 149, 108, 0.2)',
                    boxShadow: '0 4px 12px rgba(200, 149, 108, 0.1)'
                  } : {}}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#c8956c]' : ''} ${'danger' in item && item.danger ? 'text-red-400' : ''}`} />
                  <span className={`font-medium text-sm ${'danger' in item && item.danger && !isActive ? 'text-red-400' : ''}`}>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#c8956c', boxShadow: '0 0 8px rgba(200, 149, 108, 0.5)' }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Language Toggle + Logout */}
      <div className="p-3 border-t border-white/8 space-y-1">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[#c8956c]/70 hover:bg-[#c8956c]/10 hover:text-[#c8956c] transition-all duration-200"
        >
          <Languages className="w-5 h-5" />
          <span className="font-medium text-sm">{language === 'en' ? 'മലയാളം' : 'English'}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}
