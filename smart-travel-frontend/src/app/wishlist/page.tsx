'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { wishlistService, type WishlistItem } from '@/services/wishlist';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: (destinationId: number) => wishlistService.toggle(destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
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
              <Heart className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              YOUR BUCKET LIST
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Wishlist
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg max-w-xl">
              Destinations you&apos;ve saved for your next adventure.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 md:px-16 lg:px-24 -mt-2 mb-12">
          <div className="max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Saved', value: items.length, color: 'from-[#c8956c] to-[#dbb896]' },
              { label: 'Districts', value: [...new Set(items.map(i => i.destination?.district).filter(Boolean))].length, color: 'from-emerald-500 to-green-500' },
              { label: 'Types', value: [...new Set(items.map(i => i.destination?.primary_type).filter(Boolean))].length, color: 'from-blue-500 to-cyan-500' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                className="border border-[#e8e0d6] rounded-2xl p-5" style={{ background: '#ffffff' }}>
                <p className="text-[#8a8a8a] text-xs font-bold tracking-[0.2em] uppercase mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent font-display`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Content */}
        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[1300px] mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8956c]" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 border border-[#e8e0d6] rounded-2xl" style={{ background: '#ffffff' }}>
                <Heart className="w-16 h-16 mx-auto mb-4 text-[#e8e0d6]" />
                <h3 className="text-lg font-semibold mb-2 text-[#1b3a2d]">No saved destinations yet</h3>
                <p className="text-[#8a8a8a] text-sm mb-6">Browse destinations and tap the heart icon to save them here.</p>
                <Link href="/destinations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition-all">
                  Explore Destinations <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {items.map((item: WishlistItem, i: number) => {
                    const dest = item.destination;
                    if (!dest) return null;
                    const imageUrl = dest.images?.[0];

                    return (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="bg-white rounded-2xl overflow-hidden border border-[#e8e0d6] hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-2 transition-all duration-500 group">
                          <Link href={`/destinations/${dest.id}`}>
                            <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1b3a2d, #2d6a4f)' }}>
                              {imageUrl && (
                                <Image src={imageUrl} alt={dest.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                              <div className="absolute bottom-3 left-3 z-10">
                                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
                                  {dest.primary_type?.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div>
                                <Link href={`/destinations/${dest.id}`}>
                                  <h3 className="font-bold text-lg mb-1 text-[#1a1a1a] font-display hover:text-[#c8956c] transition-colors">{dest.name}</h3>
                                </Link>
                                <p className="text-sm text-[#7a7265] flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" /> {dest.district}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleMutation.mutate(dest.id)}
                                disabled={toggleMutation.isPending}
                                className="p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-all"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-sm text-[#8a8a8a]">
                              <span>₹{dest.avg_budget_min?.toLocaleString()} - ₹{dest.avg_budget_max?.toLocaleString()}</span>
                            </div>
                            <Link href={`/destinations/${dest.id}`}
                              className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#c8956c] group-hover:gap-3 transition-all">
                              View Details <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
