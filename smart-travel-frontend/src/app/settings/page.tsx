'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { preferencesService } from '@/services/preferences';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Thermometer, Cloud, DollarSign, Users, Activity, Save, Check, X, Settings } from 'lucide-react';

const CLIMATES = ['cold', 'moderate', 'hot'];
const TRAVEL_TYPES = ['adventure', 'hill_station', 'beach', 'nature', 'cultural', 'wildlife'];
const CROWD_PREFERENCES = ['crowded', 'less_crowded', 'any'];
const ACTIVITIES = ['trekking', 'boating', 'photography', 'camping', 'sightseeing', 'water_sports', 'wildlife_viewing'];

type PreferencesData = {
  preferred_min_temp: number;
  preferred_max_temp: number;
  climate_preference: string;
  min_budget: number;
  max_budget: number;
  travel_types: string[];
  crowd_preference: string;
  air_quality_sensitive: boolean;
  activities_interest: string[];
};

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  const [profileData] = useState({ name: user?.name || '', email: user?.email || '' });

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesService.getPreferences(),
  });

  const initialPreferences: PreferencesData = {
    preferred_min_temp: preferences?.preferred_min_temp ?? 18,
    preferred_max_temp: preferences?.preferred_max_temp ?? 28,
    climate_preference: preferences?.climate_preference ?? 'moderate',
    min_budget: preferences?.min_budget ?? 1000,
    max_budget: preferences?.max_budget ?? 10000,
    travel_types: preferences?.travel_types ?? [],
    crowd_preference: preferences?.crowd_preference ?? 'any',
    air_quality_sensitive: preferences?.air_quality_sensitive ?? false,
    activities_interest: preferences?.activities_interest ?? [],
  };

  const [preferencesData, setPreferencesData] = useState<PreferencesData>(initialPreferences);
  const preferencesKey = preferences?.preferred_min_temp;
  useEffect(() => {
    if (preferences) setPreferencesData(initialPreferences);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesKey]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: PreferencesData) => preferencesService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error: Error) => {
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setMessage({ type: 'error', text: msg || 'Failed to update preferences' });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handlePreferencesSubmit = (e: React.FormEvent) => { e.preventDefault(); updatePreferencesMutation.mutate(preferencesData); };
  const toggleArrayItem = (array: string[], item: string) => array.includes(item) ? array.filter(i => i !== item) : [...array, item];

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'password', name: 'Password', icon: Lock },
    { id: 'preferences', name: 'Travel Preferences', icon: Thermometer },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[1000px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <Settings className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              ACCOUNT
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Settings
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg">Manage your account and travel preferences.</motion.p>
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-24 pb-24">
          <div className="max-w-[1000px] mx-auto">
            {/* Tabs */}
            <div className="border-b border-[#e8e0d6] mb-8">
              <nav className="flex gap-1 -mb-px">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-4 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id ? 'border-[#c8956c] text-[#c8956c]' : 'border-transparent text-[#8a8a8a] hover:text-[#1b3a2d]'
                    }`}>
                    <tab.icon className="w-5 h-5" /> {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Messages */}
            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-5 rounded-2xl flex items-center gap-4 border ${
                  message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                {message.type === 'success' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                <span className="font-semibold">{message.text}</span>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-2 text-[#1b3a2d] font-display">Profile Information</h2>
                <p className="mb-6 text-[#8a8a8a] text-sm">View your account profile information</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Full Name</label>
                    <input type="text" value={profileData.name} disabled
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-[#f5f0ea]/50 text-[#1b3a2d] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Email Address</label>
                    <input type="email" value={profileData.email} disabled
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-[#f5f0ea]/50 text-[#1b3a2d] cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="max-w-2xl">
                <div className="p-5 rounded-2xl border border-[#c8956c]/20" style={{ background: 'rgba(200, 149, 108, 0.05)' }}>
                  <p className="text-sm text-[#c8956c]">Password change feature is currently disabled. Contact admin for assistance.</p>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold mb-2 text-[#1b3a2d] font-display">Travel Preferences</h2>
                <p className="mb-8 text-[#8a8a8a] text-sm">Set your preferences to get personalized destination recommendations.</p>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  {/* Temperature */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                        <Thermometer className="w-6 h-6 text-[#c8956c]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Temperature Range</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Minimum (°C)</label>
                        <input type="number" min="0" max="50" value={preferencesData.preferred_min_temp}
                          onChange={(e) => setPreferencesData({ ...preferencesData, preferred_min_temp: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Maximum (°C)</label>
                        <input type="number" min="0" max="50" value={preferencesData.preferred_max_temp}
                          onChange={(e) => setPreferencesData({ ...preferencesData, preferred_max_temp: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                      </div>
                    </div>
                  </div>

                  {/* Climate */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(45, 106, 79, 0.1)' }}>
                        <Cloud className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Preferred Climate</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {CLIMATES.map((climate) => (
                        <button key={climate} type="button" onClick={() => setPreferencesData({ ...preferencesData, climate_preference: climate })}
                          className={`p-4 rounded-xl border-2 transition font-medium capitalize ${
                            preferencesData.climate_preference === climate
                              ? 'border-[#c8956c] text-[#c8956c] bg-[#c8956c]/5' : 'border-[#e8e0d6] text-[#5a5550] hover:border-[#c8956c]/30'
                          }`}>
                          {climate}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(45, 106, 79, 0.1)' }}>
                        <DollarSign className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Budget Range (₹)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Minimum Budget</label>
                        <input type="number" min="0" step="500" value={preferencesData.min_budget}
                          onChange={(e) => setPreferencesData({ ...preferencesData, min_budget: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#8a8a8a]">Maximum Budget</label>
                        <input type="number" min="0" step="500" value={preferencesData.max_budget}
                          onChange={(e) => setPreferencesData({ ...preferencesData, max_budget: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                      </div>
                    </div>
                  </div>

                  {/* Travel Types */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                        <Activity className="w-6 h-6 text-[#c8956c]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Travel Types</h3>
                    </div>
                    <p className="text-sm mb-4 text-[#8a8a8a]">Select all that interest you</p>
                    <div className="grid grid-cols-3 gap-3">
                      {TRAVEL_TYPES.map((type) => (
                        <button key={type} type="button"
                          onClick={() => setPreferencesData({ ...preferencesData, travel_types: toggleArrayItem(preferencesData.travel_types, type) })}
                          className={`p-3 rounded-xl border-2 transition font-medium text-sm capitalize ${
                            preferencesData.travel_types.includes(type)
                              ? 'border-[#c8956c] text-[#c8956c] bg-[#c8956c]/5' : 'border-[#e8e0d6] text-[#5a5550] hover:border-[#c8956c]/30'
                          }`}>
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crowd */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(45, 106, 79, 0.1)' }}>
                        <Users className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Crowd Preference</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {CROWD_PREFERENCES.map((pref) => (
                        <button key={pref} type="button" onClick={() => setPreferencesData({ ...preferencesData, crowd_preference: pref })}
                          className={`p-4 rounded-xl border-2 transition font-medium capitalize ${
                            preferencesData.crowd_preference === pref
                              ? 'border-[#c8956c] text-[#c8956c] bg-[#c8956c]/5' : 'border-[#e8e0d6] text-[#5a5550] hover:border-[#c8956c]/30'
                          }`}>
                          {pref.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                        <Activity className="w-6 h-6 text-[#c8956c]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1b3a2d]">Activities of Interest</h3>
                    </div>
                    <p className="text-sm mb-4 text-[#8a8a8a]">What do you enjoy doing?</p>
                    <div className="grid grid-cols-3 gap-3">
                      {ACTIVITIES.map((activity) => (
                        <button key={activity} type="button"
                          onClick={() => setPreferencesData({ ...preferencesData, activities_interest: toggleArrayItem(preferencesData.activities_interest, activity) })}
                          className={`p-3 rounded-xl border-2 transition font-medium text-sm capitalize ${
                            preferencesData.activities_interest.includes(activity)
                              ? 'border-[#c8956c] text-[#c8956c] bg-[#c8956c]/5' : 'border-[#e8e0d6] text-[#5a5550] hover:border-[#c8956c]/30'
                          }`}>
                          {activity.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AQI */}
                  <div className="border border-[#e8e0d6] rounded-2xl p-6" style={{ background: '#ffffff' }}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={preferencesData.air_quality_sensitive}
                        onChange={(e) => setPreferencesData({ ...preferencesData, air_quality_sensitive: e.target.checked })}
                        className="w-5 h-5 rounded accent-[#c8956c]" />
                      <div>
                        <p className="font-medium text-[#1b3a2d]">I am sensitive to air quality</p>
                        <p className="text-sm text-[#8a8a8a]">Prioritize destinations with better air quality</p>
                      </div>
                    </label>
                  </div>

                  {/* Save */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#e8e0d6]">
                    <p className="text-sm text-[#8a8a8a]">These preferences power our intelligent recommendation system</p>
                    <button type="submit" disabled={updatePreferencesMutation.isPending}
                      className="flex items-center gap-2 px-8 py-3 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50">
                      <Save className="w-5 h-5" />
                      {updatePreferencesMutation.isPending ? 'Saving...' : 'Save All Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
