'use client';

import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { badgesService, type Badge } from '@/services/badges';
import { motion } from 'framer-motion';
import { Trophy, Lock, Loader2, Star } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  travel: 'Travel', social: 'Social', engagement: 'Engagement', safety: 'Safety',
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  travel: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600' },
  social: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600' },
  engagement: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600' },
  safety: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600' },
};

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: badgesService.getAll,
  });

  const badges = data?.badges || [];
  const totalBadges = data?.total || 0;
  const unlockedCount = data?.unlocked || 0;
  const overallProgress = totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;

  // Group badges by category
  const groupedBadges = badges.reduce((acc, badge) => {
    const cat = badge.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[1300px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <Trophy className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              YOUR JOURNEY
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Achievements
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/40 text-lg max-w-xl">
              Unlock badges by exploring Kerala. Every trip, review, and plan brings you closer to mastery.
            </motion.p>
          </div>
        </section>

        {/* Overall Progress */}
        <section className="px-6 md:px-16 lg:px-24 -mt-2 mb-8">
          <div className="max-w-[1300px] mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="border border-[#e8e0d6] rounded-2xl p-6 flex items-center gap-6" style={{ background: '#ffffff' }}>
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e8e0d6" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none"
                    stroke="#c8956c" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - overallProgress / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#1b3a2d]">{overallProgress}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1b3a2d]">
                  {unlockedCount} of {totalBadges} Badges Unlocked
                </h3>
                <p className="text-[#8a8a8a] text-sm mt-1">Keep traveling and exploring to unlock more achievements!</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {[...Array(totalBadges)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                    i < unlockedCount ? 'bg-[#c8956c] shadow-sm shadow-[#c8956c]/30' : 'bg-[#e8e0d6]'
                  }`} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Badges */}
        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[1300px] mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8956c]" />
              </div>
            ) : (
              Object.entries(groupedBadges).map(([category, categoryBadges]) => {
                const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.travel;

                return (
                  <div key={category} className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <span className="text-[#8a8a8a] text-sm">
                        {categoryBadges.filter(b => b.unlocked).length}/{categoryBadges.length} unlocked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryBadges.map((badge, i) => (
                        <motion.div key={badge.slug}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                          className={`border rounded-2xl p-5 transition-all relative overflow-hidden ${
                            badge.unlocked
                              ? 'border-[#c8956c]/30 hover:border-[#c8956c]/50 hover:shadow-lg hover:shadow-[#c8956c]/5'
                              : 'border-[#e8e0d6] opacity-70'
                          }`}
                          style={{ background: badge.unlocked ? '#ffffff' : '#faf8f5' }}
                        >
                          {/* Unlocked glow */}
                          {badge.unlocked && (
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
                              style={{ background: 'radial-gradient(circle, #c8956c, transparent)' }} />
                          )}

                          <div className="flex items-start gap-4 relative">
                            {/* Emoji / Lock */}
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
                              badge.unlocked ? 'bg-[#c8956c]/10' : 'bg-[#f5f0ea]'
                            }`}>
                              {badge.unlocked ? (
                                <span>{badge.emoji}</span>
                              ) : (
                                <Lock className="w-5 h-5 text-[#c8c0b6]" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-semibold ${badge.unlocked ? 'text-[#1b3a2d]' : 'text-[#8a8a8a]'}`}>
                                  {badge.name}
                                </h3>
                                {badge.unlocked && (
                                  <Star className="w-4 h-4 text-[#c8956c] fill-[#c8956c]" />
                                )}
                              </div>
                              <p className="text-sm text-[#8a8a8a] mt-0.5">{badge.description}</p>

                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-[#8a8a8a]">
                                    {badge.current}/{badge.threshold}
                                  </span>
                                  {badge.unlocked && (
                                    <span className="text-xs font-bold text-[#c8956c]">Unlocked ✓</span>
                                  )}
                                </div>
                                <div className="w-full h-2 bg-[#f5f0ea] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${badge.progress}%` }}
                                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${
                                      badge.unlocked
                                        ? 'bg-gradient-to-r from-[#c8956c] to-[#dbb896]'
                                        : 'bg-[#d4cdc5]'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
