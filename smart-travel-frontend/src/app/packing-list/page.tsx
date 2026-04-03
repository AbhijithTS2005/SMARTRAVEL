'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { packingListService } from '@/services/packingList';
import { destinationsService } from '@/services/destinations';
import { motion } from 'framer-motion';
import {
  Briefcase, Shirt, Droplets, Smartphone, CloudRain, Compass,
  Package, Loader2, Check, MapPin, Search
} from 'lucide-react';
import Image from 'next/image';

const ICON_MAP: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  shirt: Shirt,
  droplets: Droplets,
  smartphone: Smartphone,
  'cloud-rain': CloudRain,
  compass: Compass,
};

export default function PackingListPage() {
  const [selectedDestId, setSelectedDestId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('packingChecked');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const { data: destData } = useQuery({
    queryKey: ['destinations-for-packing'],
    queryFn: () => destinationsService.getDestinations({ limit: 100 }),
  });

  const { data: packingData, isLoading: packingLoading } = useQuery({
    queryKey: ['packing-list', selectedDestId],
    queryFn: () => packingListService.generate(selectedDestId!),
    enabled: !!selectedDestId,
  });

  const destinations = destData?.data?.destinations || [];
  const filteredDests = destinations.filter((d: { name: string }) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCheck = (categoryKey: string, itemIndex: number) => {
    const key = `${selectedDestId}_${categoryKey}_${itemIndex}`;
    const updated = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('packingChecked', JSON.stringify(updated));
    }
  };

  const isChecked = (categoryKey: string, itemIndex: number) => {
    return checkedItems[`${selectedDestId}_${categoryKey}_${itemIndex}`] || false;
  };

  const categories = packingData ? Object.entries(packingData.packing_list) : [];
  const totalItems = categories.reduce((sum, [, cat]) => sum + cat.items.length, 0);
  const checkedCount = categories.reduce((sum, [key, cat]) =>
    sum + cat.items.filter((_, i) => isChecked(key, i)).length, 0
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24" style={{ background: 'linear-gradient(180deg, #1b3a2d 0%, #264f3d 100%)' }}>
          <div className="max-w-[1300px] mx-auto">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[#c8956c] text-xs font-bold tracking-[0.35em] uppercase mb-4">
              <Package className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
              SMART PACKING
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl text-white leading-[1.1] mb-4">
              Packing List
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-white/30 text-lg max-w-xl">
              AI-generated packing checklist based on destination weather, terrain, and activities.
            </motion.p>
          </div>
        </section>

        <section className="px-6 md:px-16 lg:px-24 pb-24 mt-8">
          <div className="max-w-[1300px] mx-auto">
            {/* Destination Selector */}
            {!selectedDestId ? (
              <div>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c4bdb3]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search destinations..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#e8e0d6] bg-white text-[#1b3a2d] placeholder-[#c4bdb3] focus:border-[#c8956c] focus:outline-none transition text-lg"
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDests.slice(0, 12).map((dest: { id: number; name: string; district: string; primary_type: string; images?: string[] }, i: number) => (
                    <motion.button
                      key={dest.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedDestId(dest.id)}
                      className="text-left border border-[#e8e0d6] rounded-2xl overflow-hidden hover:border-[#c8956c]/40 hover:shadow-lg transition-all group"
                      style={{ background: '#ffffff' }}
                    >
                      <div className="relative h-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1b3a2d, #2d6a4f)' }}>
                        {dest.images?.[0] && (
                          <Image src={dest.images[0]} alt={dest.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#1b3a2d] mb-1">{dest.name}</h3>
                        <p className="text-sm text-[#8a8a8a] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {dest.district}
                        </p>
                        <span className="inline-block mt-2 text-xs text-[#c8956c] font-semibold capitalize bg-[#c8956c]/10 px-2.5 py-1 rounded-full">
                          {dest.primary_type?.replace('_', ' ')}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : packingLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#c8956c] mx-auto mb-4" />
                  <p className="text-[#8a8a8a] text-sm">Generating your smart packing list...</p>
                </div>
              </div>
            ) : packingData ? (
              <div>
                {/* Destination header + progress */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <button onClick={() => setSelectedDestId(null)}
                      className="text-sm text-[#c8956c] font-medium mb-2 hover:underline flex items-center gap-1">
                      ← Change Destination
                    </button>
                    <h2 className="text-2xl font-bold text-[#1b3a2d] font-display">{packingData.destination.name}</h2>
                    <p className="text-sm text-[#8a8a8a] capitalize">{packingData.destination.primary_type?.replace('_', ' ')} · {packingData.destination.district}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#c8956c] font-display">{checkedCount}/{totalItems}</p>
                    <p className="text-xs text-[#8a8a8a] font-medium uppercase tracking-wider">Packed</p>
                    <div className="w-32 h-2 bg-[#e8e0d6] rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #c8956c, #dbb896)' }}
                        initial={{ width: 0 }}
                        animate={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="grid md:grid-cols-2 gap-6">
                  {categories.map(([key, category], catIdx) => {
                    const IconComponent = ICON_MAP[category.icon] || Package;
                    const catChecked = category.items.filter((_, i) => isChecked(key, i)).length;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.08 }}
                        className="border border-[#e8e0d6] rounded-2xl overflow-hidden"
                        style={{ background: '#ffffff' }}
                      >
                        <div className="px-6 py-4 border-b border-[#e8e0d6] flex items-center justify-between" style={{ background: 'rgba(200, 149, 108, 0.03)' }}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                              <IconComponent className="w-5 h-5 text-[#c8956c]" />
                            </div>
                            <h3 className="font-semibold text-[#1b3a2d]">{category.label}</h3>
                          </div>
                          <span className="text-xs text-[#8a8a8a] font-medium">{catChecked}/{category.items.length}</span>
                        </div>
                        <div className="p-4">
                          <ul className="space-y-1.5">
                            {category.items.map((item, itemIdx) => {
                              const checked = isChecked(key, itemIdx);
                              return (
                                <li key={itemIdx}>
                                  <button
                                    onClick={() => toggleCheck(key, itemIdx)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                      checked ? 'bg-emerald-50' : 'hover:bg-[#f5f0ea]'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                      checked ? 'bg-emerald-500 border-emerald-500' : 'border-[#d4ccc2]'
                                    }`}>
                                      {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-sm transition-all ${checked ? 'text-[#8a8a8a] line-through' : 'text-[#1b3a2d]'}`}>
                                      {item}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
