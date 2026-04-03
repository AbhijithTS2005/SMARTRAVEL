'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { travelPlansService, type TravelPlan } from '@/services/travelPlans';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Shield, ShieldOff, CheckCircle, XCircle,
  Loader2, Plane, AlertTriangle, Clock, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function TravelPlansPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'planned' | 'active' | 'completed' | 'cancelled'>('all');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['travel-plans'],
    queryFn: travelPlansService.getAll,
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => travelPlansService.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['travel-plans'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => travelPlansService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['travel-plans'] }),
  });

  const toggleMonitoringMutation = useMutation({
    mutationFn: (id: number) => travelPlansService.toggleMonitoring(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['travel-plans'] }),
  });

  const filteredPlans = filter === 'all' ? plans : plans.filter((p: TravelPlan) => p.status === filter);

  const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    planned: { color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20', icon: Clock },
    active: { color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Plane },
    completed: { color: 'text-[#8a8a8a]', bg: 'bg-[#f5f0ea] border-[#e8e0d6]', icon: CheckCircle },
    cancelled: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Past';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days away`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[1300px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <Calendar className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              MANAGE YOUR TRIPS
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Travel Plans
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg max-w-xl">
              Manage your upcoming and past trips with live monitoring.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 md:px-16 lg:px-24 -mt-2 mb-12">
          <div className="max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Plans', value: plans.length, color: 'from-[#1b3a2d] to-[#2d6a4f]' },
              { label: 'Planned', value: plans.filter((p: TravelPlan) => p.status === 'planned').length, color: 'from-blue-500 to-cyan-500' },
              { label: 'Active', value: plans.filter((p: TravelPlan) => p.status === 'active').length, color: 'from-emerald-500 to-green-500' },
              { label: 'Completed', value: plans.filter((p: TravelPlan) => p.status === 'completed').length, color: 'from-[#8a8a8a] to-[#aaa]' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                className="border border-[#e8e0d6] rounded-2xl p-5" style={{ background: '#ffffff' }}>
                <p className="text-[#8a8a8a] text-xs font-bold tracking-[0.2em] uppercase mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent font-display`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Filters + List */}
        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[1300px] mx-auto">
            <div className="flex gap-2 mb-8 flex-wrap">
              {(['all', 'planned', 'active', 'completed', 'cancelled'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${
                    filter === f
                      ? 'text-white bg-[#c8956c] shadow-lg shadow-[#c8956c]/20'
                      : 'text-[#1b3a2d]/40 border border-[#e8e0d6] hover:text-[#1b3a2d] hover:border-[#c8956c]/30'
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8956c]" />
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-20 border border-[#e8e0d6] rounded-2xl" style={{ background: '#ffffff' }}>
                <Calendar className="w-16 h-16 mx-auto mb-4 text-[#e8e0d6]" />
                <h3 className="text-lg font-semibold mb-2 text-[#1b3a2d]">No travel plans found</h3>
                <p className="text-[#8a8a8a] text-sm mb-6">
                  {filter === 'all' ? 'Visit a destination and tap "Let\'s Go" to create your first plan!' : `No ${filter} plans at the moment.`}
                </p>
                <Link href="/destinations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition-all">
                  Explore Destinations <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map((plan: TravelPlan, i: number) => {
                  const config = statusConfig[plan.status] || statusConfig.planned;
                  const StatusIcon = config.icon;

                  return (
                    <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-[#e8e0d6] rounded-2xl overflow-hidden hover:border-[#c8956c]/30 transition-all"
                      style={{ background: '#ffffff' }}>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #1b3a2d, #2d6a4f)' }}>
                              <MapPin className="w-7 h-7 text-white/50" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-[#1b3a2d]">
                                {plan.destination?.name || plan.custom_location_name || 'Unknown Destination'}
                              </h3>
                              <p className="text-sm text-[#8a8a8a] mt-0.5">
                                {plan.destination
                                  ? `${plan.destination.state || ''}${plan.destination.country ? `, ${plan.destination.country}` : ''}`
                                  : plan.custom_location_name ? 'Custom Location' : ''}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-sm text-[#8a8a8a]">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(plan.start_date)} — {formatDate(plan.end_date)}
                                </div>
                                {plan.status === 'planned' && (
                                  <span className="text-sm font-semibold text-[#c8956c]">{getDaysUntil(plan.start_date)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${config.bg} ${config.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="capitalize">{plan.status}</span>
                          </div>
                        </div>

                        {(plan.status === 'planned' || plan.status === 'active') && (
                          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#e8e0d6]">
                            <button onClick={() => toggleMonitoringMutation.mutate(plan.id)}
                              disabled={toggleMonitoringMutation.isPending}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                                plan.monitoring_active
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'text-[#1b3a2d]/60 border border-[#e8e0d6] hover:text-[#1b3a2d] hover:border-[#c8956c]/30'
                              }`}>
                              {plan.monitoring_active ? (
                                <><Shield className="w-4 h-4" /> Monitoring Active</>
                              ) : (
                                <><ShieldOff className="w-4 h-4" /> Monitoring Off</>
                              )}
                            </button>
                            <button onClick={() => completeMutation.mutate(plan.id)}
                              disabled={completeMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                              <CheckCircle className="w-4 h-4" /> Mark Complete
                            </button>
                            <button onClick={() => { if (confirm('Are you sure you want to cancel this plan?')) cancelMutation.mutate(plan.id); }}
                              disabled={cancelMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition ml-auto">
                              <XCircle className="w-4 h-4" /> Cancel Plan
                            </button>
                          </div>
                        )}

                        {plan.monitoring_active && plan.status === 'planned' && (
                          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl text-sm text-[#c8956c] border border-[#c8956c]/20"
                            style={{ background: 'rgba(200, 149, 108, 0.05)' }}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>Weather & disaster alerts for this destination are being monitored.</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
