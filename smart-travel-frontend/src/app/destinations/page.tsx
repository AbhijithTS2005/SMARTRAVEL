'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { preferencesService } from '@/services/preferences';
import locationAnalysisService, { LocationAnalysis } from '@/services/locationAnalysis';
import { destinationsService } from '@/services/destinations';
import LocationAnalysisDrawer from '@/components/LocationAnalysisDrawer';
import SearchOverlay from '@/components/SearchOverlay';
import { Info } from 'lucide-react';
import type { Destination } from '@/types';

const DestinationMap = dynamic(() => import('@/components/DestinationMap'), { ssr: false });

export default function DestinationsPage() {
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [analysisData, setAnalysisData] = useState<LocationAnalysis | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesService.getPreferences(),
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ['all-destinations'],
    queryFn: async () => {
      try {
        const response = await destinationsService.getDestinations({ limit: 500 });
        const data = response.data?.destinations || [];
        setAllDestinations(data);
        setFilteredDestinations(data);
        return data;
      } catch (error) {
        console.error('Error fetching destinations:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const districts = Array.from(new Set(allDestinations.map((d: Destination) => d.district))).sort();

  const handleDistrictFilter = (district: string) => {
    setSelectedDistrict(district);
    let filtered = allDestinations;
    if (district) filtered = filtered.filter((dest: Destination) => dest.district === district);
    setFilteredDestinations(filtered);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!preferences) {
      setAnalysisError('Please set your travel preferences first to get personalized recommendations.');
      setIsAnalysisOpen(true);
      return;
    }
    setClickedLocation({ lat, lng });
    setIsAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisData(null);
    try {
      const analysis = await locationAnalysisService.analyzeLocation({ latitude: lat, longitude: lng });
      setAnalysisData(analysis);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      if (error.response?.data?.error === 'preferences_not_set') {
        setAnalysisError('Please set your travel preferences first to get personalized recommendations.');
      } else if (error.response?.data?.message) {
        setAnalysisError(error.response.data.message);
      } else {
        setAnalysisError('Failed to analyze location. Please try again.');
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSelectDestination = (destination: Destination) => {
    setMapCenter([destination.latitude, destination.longitude]);
    handleMapClick(destination.latitude, destination.longitude);
  };

  const handleSelectGlobalLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    handleMapClick(lat, lng);
  };

  const handleCloseAnalysis = () => {
    setIsAnalysisOpen(false);
    setClickedLocation(null);
    setAnalysisError(null);
    setAnalysisData(null);
  };

  return (
    <ProtectedRoute>
      <div className="h-screen relative" style={{ background: '#f5f0ea' }}>
        <TopNav />

        <main className="h-full w-full relative">
          <SearchOverlay
            destinations={filteredDestinations}
            onSelectDestination={handleSelectDestination}
            onSelectLocation={handleSelectGlobalLocation}
          />

          <div className="absolute top-20 right-6 z-10">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none transition backdrop-blur-xl shadow-xl text-sm font-medium"
              style={{ background: 'rgba(245, 240, 234, 0.9)', borderColor: 'rgba(0,0,0,0.08)', color: '#fff' }}
            >
              <option value="">All Districts</option>
              {districts.map((district: string) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {!preferences && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 backdrop-blur-xl rounded-xl shadow-lg px-6 py-4 max-w-lg border"
              style={{ background: 'rgba(200, 149, 108, 0.1)', borderColor: 'rgba(200, 149, 108, 0.3)' }}>
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-[#c8956c] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white text-sm">Set Your Preferences First</p>
                  <p className="text-xs text-white/50">
                    To get personalized recommendations, please set your travel preferences.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DestinationMap
            onMapClick={handleMapClick}
            clickedLocation={clickedLocation}
            destinations={filteredDestinations}
            center={mapCenter}
          />

          <LocationAnalysisDrawer
            isOpen={isAnalysisOpen}
            onClose={handleCloseAnalysis}
            analysis={analysisData}
            isLoading={analysisLoading}
            error={analysisError}
            locationCoords={clickedLocation}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
