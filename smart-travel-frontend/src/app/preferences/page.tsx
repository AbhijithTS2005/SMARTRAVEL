'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { preferencesService } from '@/services/preferences';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ThermometerSun, Map, Wind,
  ArrowRight, ArrowLeft, Check, TreePine
} from 'lucide-react';

const TRAVEL_TYPES = [
  { value: 'hill_station', label: 'Mountains', icon: '⛰️' },
  { value: 'beach', label: 'Beach', icon: '🏖️' },
  { value: 'nature', label: 'City', icon: '🏙️' },
  { value: 'cultural', label: 'Cultural', icon: '🛕' },
  { value: 'adventure', label: 'Sightseeing', icon: '👀' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
];

const CLIMATE_OPTIONS = [
  { value: 'cold', label: 'Cold Weather', icon: '❄️' },
  { value: 'moderate', label: 'Moderate', icon: '☁️' },
  { value: 'hot', label: 'Warm/Hot Weather', icon: '☀️' },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [minBudget, setMinBudget] = useState(5000);
  const [maxBudget, setMaxBudget] = useState(30000);
  const [minTemp, setMinTemp] = useState(15);
  const [maxTemp, setMaxTemp] = useState(30);
  const [climate, setClimate] = useState('moderate');
  const [travelTypes, setTravelTypes] = useState<string[]>([]);
  const [aqiSensitive, setAqiSensitive] = useState(false);
  const [crowdPreference, setCrowdPreference] = useState('any');

  const handleTravelTypeToggle = (type: string) => {
    setTravelTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleSubmit = async () => {
    if (travelTypes.length === 0) { setError('Please select at least one travel type'); return; }
    setError(''); setIsSubmitting(true);
    try {
      await preferencesService.savePreferences({
        travel_types: travelTypes, climate_preference: climate,
        min_budget: minBudget, max_budget: maxBudget,
        preferred_min_temp: minTemp, preferred_max_temp: maxTemp,
        crowd_preference: crowdPreference, air_quality_sensitive: aqiSensitive,
      });
      router.push('/dashboard');
    } catch { setError('Failed to save preferences. Please try again.'); setIsSubmitting(false); }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f5f0ea' }}>
        <div className="max-w-2xl w-full">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2.5 mb-10">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.2)' }}>
              <TreePine className="w-6 h-6 text-[#c8956c]" />
            </div>
            <span className="text-[#1b3a2d] text-xl font-bold tracking-[0.12em]">SMARTRAVEL</span>
          </motion.div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-[#1b3a2d] mb-3">Personalize Your Journey</h1>
            <p className="text-[#7a7265] text-lg">Help us understand your travel preferences for better recommendations</p>
          </motion.div>

          {/* Progress */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  s <= step ? 'text-white bg-[#c8956c]' : 'bg-[#1b3a2d]/5 text-[#7a7265] border border-[#e8e0d6]'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-[#1b3a2d]/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#c8956c] rounded-full" animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </motion.div>

          {/* Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-[#e8e0d6] p-8" style={{ background: '#ffffff' }}>
            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            <AnimatePresence mode="wait">
              {/* Step 1: Budget */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200, 149, 108, 0.15)' }}>
                      <DollarSign className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <div><h2 className="text-2xl font-bold text-[#1b3a2d]">Budget Range</h2><p className="text-[#7a7265]">How much do you plan to spend?</p></div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3d] mb-2">Minimum Budget: ₹{minBudget.toLocaleString()}</label>
                      <input type="range" min="1000" max="200000" step="1000" value={minBudget} onChange={(e) => setMinBudget(Number(e.target.value))}
                        className="w-full h-2 bg-[#e8e0d6] rounded-lg appearance-none cursor-pointer accent-[#c8956c]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3d] mb-2">Maximum Budget: ₹{maxBudget.toLocaleString()}</label>
                      <input type="range" min="1000" max="200000" step="1000" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}
                        className="w-full h-2 bg-[#e8e0d6] rounded-lg appearance-none cursor-pointer accent-[#c8956c]" />
                    </div>
                    <div className="p-4 rounded-xl border border-[#c8956c]/20" style={{ background: 'rgba(200, 149, 108, 0.05)' }}>
                      <p className="text-sm text-[#3d3d3d]"><strong className="text-[#c8956c]">Your Range:</strong> ₹{minBudget.toLocaleString()} - ₹{maxBudget.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Climate */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200, 149, 108, 0.15)' }}>
                      <ThermometerSun className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <div><h2 className="text-2xl font-bold text-[#1b3a2d]">Climate Preferences</h2><p className="text-[#7a7265]">What weather do you prefer?</p></div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3d] mb-3">Preferred Climate</label>
                      <div className="grid grid-cols-2 gap-3">
                        {CLIMATE_OPTIONS.map((option) => (
                          <button key={option.value} onClick={() => setClimate(option.value)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              climate === option.value ? 'border-[#c8956c] bg-[#c8956c]/5' : 'border-[#e8e0d6] hover:border-[#c8956c]/30'
                            }`}>
                            <div className="text-3xl mb-2">{option.icon}</div>
                            <div className={`font-medium ${climate === option.value ? 'text-[#c8956c]' : 'text-[#3d3d3d]'}`}>{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3d] mb-2">Temperature Range: {minTemp}°C - {maxTemp}°C</label>
                      <div className="space-y-4">
                        <input type="range" min="-10" max="45" value={minTemp} onChange={(e) => setMinTemp(Number(e.target.value))}
                          className="w-full h-2 bg-[#e8e0d6] rounded-lg appearance-none cursor-pointer accent-blue-400" />
                        <input type="range" min="-10" max="45" value={maxTemp} onChange={(e) => setMaxTemp(Number(e.target.value))}
                          className="w-full h-2 bg-[#e8e0d6] rounded-lg appearance-none cursor-pointer accent-[#c8956c]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Travel Types */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200, 149, 108, 0.15)' }}>
                      <Map className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <div><h2 className="text-2xl font-bold text-[#1b3a2d]">Travel Interests</h2><p className="text-[#7a7265]">Select all that apply</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {TRAVEL_TYPES.map((type) => (
                      <button key={type.value} onClick={() => handleTravelTypeToggle(type.value)}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          travelTypes.includes(type.value) ? 'border-[#c8956c] bg-[#c8956c]/5 scale-[0.97]' : 'border-[#e8e0d6] hover:border-[#c8956c]/30'
                        }`}>
                        <div className="text-4xl mb-2">{type.icon}</div>
                        <div className={`font-medium ${travelTypes.includes(type.value) ? 'text-[#c8956c]' : 'text-[#3d3d3d]'}`}>{type.label}</div>
                        {travelTypes.includes(type.value) && <Check className="w-5 h-5 text-[#c8956c] mx-auto mt-2" />}
                      </button>
                    ))}
                  </div>
                  {travelTypes.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl border border-[#c8956c]/20" style={{ background: 'rgba(200, 149, 108, 0.05)' }}>
                      <p className="text-sm text-[#3d3d3d]"><strong className="text-[#c8956c]">Selected:</strong> {travelTypes.join(', ')}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Environmental */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200, 149, 108, 0.15)' }}>
                      <Wind className="w-6 h-6 text-[#c8956c]" />
                    </div>
                    <div><h2 className="text-2xl font-bold text-[#1b3a2d]">Environmental Preferences</h2><p className="text-[#7a7265]">Air quality and crowds</p></div>
                  </div>
                  <div className="space-y-6">
                    <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer border border-[#e8e0d6] hover:border-white/20 transition"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div><div className="font-medium text-[#1b3a2d]">Air Quality Sensitive</div><div className="text-sm text-[#7a7265]">Prioritize destinations with good air quality</div></div>
                      <input type="checkbox" checked={aqiSensitive} onChange={(e) => setAqiSensitive(e.target.checked)} className="w-5 h-5 rounded accent-[#c8956c]" />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3d] mb-3">Crowd Preference</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[{ value: 'less_crowded', label: 'Low' }, { value: 'any', label: 'Moderate' }, { value: 'crowded', label: 'High' }].map((option) => (
                          <button key={option.value} onClick={() => setCrowdPreference(option.value)}
                            className={`p-4 rounded-xl border-2 transition-all font-medium ${
                              crowdPreference === option.value ? 'border-[#c8956c] bg-[#c8956c]/5 text-[#c8956c]' : 'border-[#e8e0d6] text-[#3d3d3d] hover:border-[#c8956c]/30'
                            }`}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-6 py-3 border border-[#e8e0d6] text-[#7a7265] rounded-full hover:text-[#1b3a2d] hover:border-[#c8956c]/30 transition">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(step + 1)}
                  className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition shadow-lg">
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition disabled:opacity-50 shadow-lg">
                  {isSubmitting ? 'Saving...' : 'Complete'} <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
