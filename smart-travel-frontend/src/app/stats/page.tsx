'use client';

import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { statsService } from '@/services/stats';
import { motion } from 'framer-motion';
import {
  BarChart3, Loader2, MapPin, Plane, CheckCircle, Eye, Heart,
  Star, Map, Compass, TrendingUp, Award
} from 'lucide-react';

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: statsService.getStats,
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[1300px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <BarChart3 className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              YOUR JOURNEY
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Travel Stats
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg max-w-xl">
              Your travel journey at a glance — trips, reviews, favorites, and more.
            </motion.p>
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8956c]" />
          </div>
        ) : stats ? (
          <>
            {/* Overview Cards */}
            <section className="px-6 md:px-16 lg:px-24 -mt-2 mb-12">
              <div className="max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Trips', value: stats.overview.total_trips, icon: Plane, color: 'from-[#1b3a2d] to-[#2d6a4f]' },
                  { label: 'Completed', value: stats.overview.trips_completed, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
                  { label: 'Planned', value: stats.overview.trips_planned, icon: Map, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Active', value: stats.overview.trips_active, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
                  { label: 'Viewed', value: stats.overview.destinations_viewed, icon: Eye, color: 'from-purple-500 to-violet-500' },
                  { label: 'Wishlisted', value: stats.overview.destinations_wishlisted, icon: Heart, color: 'from-pink-500 to-rose-500' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="border border-[#e8e0d6] rounded-2xl p-5 hover:shadow-lg transition-all"
                      style={{ background: '#ffffff' }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-r ${stat.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-[#1b3a2d] font-display">{stat.value}</p>
                      <p className="text-[#8a8a8a] text-xs font-bold tracking-[0.15em] uppercase mt-1">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Detailed Sections */}
            <section className="px-6 md:px-16 lg:px-24 pb-24">
              <div className="max-w-[1300px] mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Reviews Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="border border-[#e8e0d6] rounded-2xl p-6"
                  style={{ background: '#ffffff' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                      <Star className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1b3a2d]">Reviews</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-4xl font-bold text-[#1b3a2d] font-display">{stats.reviews.reviews_written}</p>
                      <p className="text-sm text-[#8a8a8a]">Reviews written</p>
                    </div>
                    {stats.reviews.avg_rating_given && (
                      <div className="pt-4 border-t border-[#e8e0d6]">
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-amber-500 font-display">{stats.reviews.avg_rating_given}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} size={16} className={`${i < Math.round(stats.reviews.avg_rating_given!) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#d4ccc2]'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[#8a8a8a]">Average rating given</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Favorites Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="border border-[#e8e0d6] rounded-2xl p-6"
                  style={{ background: '#ffffff' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(45, 106, 79, 0.1)' }}>
                      <Award className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1b3a2d]">Favorites</h3>
                  </div>
                  <div className="space-y-4">
                    {stats.preferences.favorite_type && (
                      <div>
                        <p className="text-sm text-[#8a8a8a] mb-1">Favorite Type</p>
                        <span className="inline-flex items-center gap-2 bg-[#c8956c]/10 text-[#c8956c] px-4 py-2 rounded-full font-semibold capitalize text-sm">
                          <Compass className="w-4 h-4" /> {stats.preferences.favorite_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {stats.preferences.favorite_district && (
                      <div className="pt-4 border-t border-[#e8e0d6]">
                        <p className="text-sm text-[#8a8a8a] mb-1">Favorite District</p>
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full font-semibold text-sm">
                          <MapPin className="w-4 h-4" /> {stats.preferences.favorite_district}
                        </span>
                      </div>
                    )}
                    {!stats.preferences.favorite_type && !stats.preferences.favorite_district && (
                      <p className="text-[#8a8a8a] text-sm">Plan some trips to see your favorites!</p>
                    )}
                  </div>
                </motion.div>

                {/* Districts Covered Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="border border-[#e8e0d6] rounded-2xl p-6"
                  style={{ background: '#ffffff' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <Map className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1b3a2d]">Districts Explored</h3>
                  </div>
                  <p className="text-4xl font-bold text-[#1b3a2d] font-display mb-4">{stats.preferences.districts_covered_count}</p>
                  {stats.preferences.districts_covered.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {stats.preferences.districts_covered.map((district) => (
                        <span key={district} className="bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold">
                          {district}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#8a8a8a] text-sm">Complete trips to track districts!</p>
                  )}
                </motion.div>

                {/* Activity Breakdown Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="border border-[#e8e0d6] rounded-2xl p-6 md:col-span-2 lg:col-span-3"
                  style={{ background: '#ffffff' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                      <TrendingUp className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1b3a2d]">Activity Breakdown</h3>
                  </div>
                  {Object.keys(stats.interactions).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(stats.interactions).map(([type, count], i) => {
                        const colors = ['from-[#c8956c] to-[#dbb896]', 'from-emerald-500 to-green-500', 'from-blue-500 to-cyan-500', 'from-purple-500 to-violet-500'];
                        return (
                          <motion.div key={type}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.2 + i * 0.05 }}
                            className="text-center p-4 rounded-2xl border border-[#e8e0d6]"
                          >
                            <p className={`text-3xl font-bold font-display bg-gradient-to-r ${colors[i % colors.length]} bg-clip-text text-transparent`}>{count}</p>
                            <p className="text-xs text-[#8a8a8a] font-bold uppercase tracking-wider mt-1 capitalize">{type.replace('_', ' ')}s</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[#8a8a8a] text-sm">Start exploring destinations to see your activity!</p>
                  )}
                </motion.div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
