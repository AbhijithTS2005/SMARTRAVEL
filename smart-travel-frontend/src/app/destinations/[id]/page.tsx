'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import { destinationsService } from '@/services/destinations';
import { travelPlansService } from '@/services/travelPlans';
import { interactionService } from '@/services/interactions';
import type { Destination } from '@/types';
import { 
  Loader2, MapPin, ArrowLeft, IndianRupee, Users, Cloud, Droplets, ThermometerSun,
  Wind, Calendar, Compass, Lightbulb, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation, Heart } from 'lucide-react';

interface LiveWeather {
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  description: string;
  wind_speed: number | null;
  aqi_value?: number | null;
  aqi_status?: string;
}

interface DisasterAlert {
  id: number;
  alert_type: string;
  severity: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);
  const [travelTips, setTravelTips] = useState<string[]>([]);
  const [bestTimeToVisit, setBestTimeToVisit] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nearbyData, setNearbyData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [peopleAlsoLike, setPeopleAlsoLike] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nearbyPhotos, setNearbyPhotos] = useState<Record<number, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [palPhotos, setPalPhotos] = useState<Record<number, any>>({});

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planSuccess, setPlanSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await destinationsService.getDestination(Number(id));
        setDestination(response.data);
        if (response.live_weather) setLiveWeather(response.live_weather);
        if (response.travel_tips) setTravelTips(response.travel_tips);
        if (response.best_time_to_visit) setBestTimeToVisit(response.best_time_to_visit);
        if (response.data?.disaster_alerts) setAlerts(response.data.disaster_alerts);
        interactionService.trackView(Number(id));
        
        try {
          const photosData = await destinationsService.getDestinationPhotos(Number(id));
          if (photosData?.photos?.length > 0) setPhotos(photosData.photos);
        } catch { console.log('Using fallback images'); }

        try {
          const nearby = await destinationsService.getNearbyRecommendations(Number(id));
          setNearbyData(nearby);
          if (nearby?.destinations?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const photosMap: Record<number, any> = {};
            await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              nearby.destinations.map(async (dest: any) => {
                try {
                  const photoData = await destinationsService.getDestinationPhotos(dest.id);
                  if (photoData?.photos?.length > 0) photosMap[dest.id] = photoData.photos[0];
                } catch { /* skip */ }
              })
            );
            setNearbyPhotos(photosMap);
          }
        } catch { console.log('Nearby recommendations unavailable'); }

        try {
          const palData = await destinationsService.getPeopleAlsoLike(Number(id));
          setPeopleAlsoLike(palData);
          if (palData?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const photosMap: Record<number, any> = {};
            await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              palData.map(async (dest: any) => {
                try {
                  const photoData = await destinationsService.getDestinationPhotos(dest.id);
                  if (photoData?.photos?.length > 0) photosMap[dest.id] = photoData.photos[0];
                } catch { /* skip */ }
              })
            );
            setPalPhotos(photosMap);
          }
        } catch { console.log('People Also Like unavailable'); }
      } catch (err) {
        console.error('Error fetching destination:', err);
        setError('Failed to load destination details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleCreatePlan = async () => {
    if (!planStartDate || !planEndDate) { setPlanError('Please select both start and end dates'); return; }
    if (planEndDate < planStartDate) { setPlanError('End date must be after start date'); return; }
    setPlanLoading(true); setPlanError('');
    try {
      await travelPlansService.create({ destination_id: destination!.id, start_date: planStartDate, end_date: planEndDate });
      interactionService.trackLetsGo(destination!.id);
      setPlanSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPlanError(error.response?.data?.message || 'Failed to create travel plan');
    } finally { setPlanLoading(false); }
  };

  const getAllImages = useCallback((dest: Destination): string[] => {
    const images: string[] = [];
    for (const photo of photos) {
      const url = photo?.large || photo?.medium || photo?.original;
      if (url) images.push(url);
    }
    if (dest.images?.length > 0) {
      for (const img of dest.images) { if (img && !images.includes(img)) images.push(img); }
    }
    return images;
  }, [photos]);

  useEffect(() => {
    if (!destination) return;
    const allImages = getAllImages(destination);
    if (allImages.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % allImages.length), 5000);
    return () => clearInterval(timer);
  }, [destination, getAllImages]);

  const getPhotoAttribution = () => photos.length > 0 && photos[0]?.attribution ? photos[0].attribution : null;
  const formatBudget = (min: number, max: number) => `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;

  const getCrowdLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      adventure: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      hill_station: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      beach: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      nature: 'bg-green-500/10 text-green-400 border-green-500/20',
      cultural: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      wildlife: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return colors[type] || 'bg-white/5 text-white/40 border-white/10';
  };

  const getSeasonIcon = (season: string) => {
    const s = season.toLowerCase();
    if (s.includes('summer')) return '☀️';
    if (s.includes('winter')) return '❄️';
    if (s.includes('monsoon')) return '🌧️';
    if (s.includes('spring')) return '🌸';
    if (s.includes('autumn') || s.includes('fall')) return '🍂';
    return '🌤️';
  };

  const getAqiColor = (value: number) => {
    if (value <= 50) return 'text-green-400';
    if (value <= 100) return 'text-yellow-400';
    if (value <= 150) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // --- States ---
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
          <TopNav />
          <main className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#c8956c] animate-spin mx-auto mb-4" />
              <p className="text-[#8a8a8a]">Loading destination details...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !destination) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
          <TopNav />
          <main className="flex items-center justify-center min-h-screen p-8">
            <div className="rounded-2xl border border-[#e8e0d6] p-8 max-w-md text-center" style={{ background: '#ffffff' }}>
              <h2 className="text-2xl font-bold text-[#1b3a2d] mb-4">Destination Not Found</h2>
              <p className="text-[#5a5a5a] mb-6">{error || 'The destination you are looking for does not exist.'}</p>
              <button onClick={() => router.back()} className="px-6 py-3 bg-[#c8956c] text-white rounded-full font-medium hover:bg-[#b5845e] transition">Go Back</button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const allImages = getAllImages(destination);
  const cardClass = "rounded-2xl border border-[#e8e0d6] p-6 mb-8";
  const cardStyle = { background: '#ffffff' };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: '#f5f0ea' }}>
        <TopNav />
        
        <main className="overflow-y-auto">
          {/* Hero */}
          <div className="relative h-[60vh] md:h-[70vh] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2419, #1b3a2d)' }}>
            {allImages.map((img, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                <Image src={img} alt={`${destination.name} - View ${index + 1}`} fill className="object-cover" unoptimized onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b3a2d] via-black/40 to-transparent" />

            {allImages.length > 1 && (
              <>
                <button onClick={() => setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentSlide((prev) => (prev + 1) % allImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/70'}`} />
                  ))}
                </div>
              </>
            )}

            {getPhotoAttribution() && (
              <div className="absolute bottom-2 right-2 z-10 bg-black/50 text-white/70 px-2 py-0.5 rounded text-[10px]">📷 {getPhotoAttribution()}</div>
            )}

            <Link href="/dashboard" className="absolute top-24 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl text-white rounded-full font-medium hover:bg-black/60 transition">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <div className="absolute bottom-0 left-0 right-0 p-8 z-[5]">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getTypeColor(destination.primary_type)}`}>
                    {destination.primary_type.replace('_', ' ').toUpperCase()}
                  </span>
                  {destination.crowd_level && (
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getCrowdLevelColor(destination.crowd_level)}`}>
                      {destination.crowd_level.toUpperCase()} CROWD
                    </span>
                  )}
                </div>
                <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg">{destination.name}</h1>
                <div className="flex items-center gap-2 text-white/70 text-lg">
                  <MapPin className="w-5 h-5" /> <span>{destination.district}, Kerala</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto p-8">
            {/* Alert Banners */}
            {alerts.length > 0 && (
              <div className="mb-8 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-3 rounded-xl p-4 border ${getSeverityColor(alert.severity)}`}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm uppercase">{alert.alert_type}</span>
                        <span className="text-xs font-medium opacity-70">• {alert.severity}</span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Info Cards */}
            <div className={`grid gap-6 mb-8 ${liveWeather ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              <div className={cardClass} style={cardStyle}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
                    <IndianRupee className="w-6 h-6 text-[#c8956c]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#6a6a6a]">Average Budget</h3>
                    <p className="text-2xl font-bold text-[#1b3a2d]">{formatBudget(destination.avg_budget_min, destination.avg_budget_max)}</p>
                  </div>
                </div>
                <p className="text-sm text-[#8a8a8a]">Estimated cost per person for a trip</p>
              </div>

              <div className={cardClass} style={cardStyle}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(45, 106, 79, 0.1)' }}>
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#6a6a6a]">Popularity Score</h3>
                    <p className="text-2xl font-bold text-[#1b3a2d]">{destination.popularity_score}/100</p>
                  </div>
                </div>
                <p className="text-sm text-[#8a8a8a]">Based on visitor ratings and reviews</p>
              </div>

              {liveWeather && (
                <div className={cardClass} style={cardStyle}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <ThermometerSun className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#6a6a6a]">Right Now</h3>
                      <p className="text-2xl font-bold text-[#1b3a2d]">{liveWeather.temperature}°C</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-[#6a6a6a]">
                    <div className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5" /><span className="capitalize">{liveWeather.description}</span></div>
                    <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /><span>{liveWeather.humidity}%</span></div>
                    {liveWeather.wind_speed != null && (
                      <div className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /><span>{liveWeather.wind_speed} m/s</span></div>
                    )}
                    {liveWeather.aqi_value != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">AQI</span>
                        <span className={`font-semibold ${getAqiColor(liveWeather.aqi_value)}`}>{liveWeather.aqi_value} ({liveWeather.aqi_status})</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Best Time + Tips */}
            {(bestTimeToVisit || travelTips.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {bestTimeToVisit && (
                  <div className={cardClass} style={cardStyle}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.1)' }}><Calendar className="w-6 h-6 text-[#c8956c]" /></div>
                      <h2 className="text-xl font-bold text-[#1b3a2d]">Best Time to Visit</h2>
                    </div>
                    <p className="text-lg font-semibold text-[#c8956c]">{bestTimeToVisit}</p>
                    <p className="text-sm text-[#8a8a8a] mt-2">Based on current weather patterns and seasonal data</p>
                  </div>
                )}
                {travelTips.length > 0 && (
                  <div className={cardClass} style={cardStyle}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(45, 106, 79, 0.1)' }}><Lightbulb className="w-6 h-6 text-emerald-400" /></div>
                      <h2 className="text-xl font-bold text-[#1b3a2d]">Travel Tips</h2>
                    </div>
                    <ul className="space-y-2">
                      {travelTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#5a5a5a]"><span className="text-[#c8956c] mt-0.5 font-bold">•</span><span>{tip}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {destination.description && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-2xl font-bold text-[#1b3a2d] mb-4">About {destination.name}</h2>
                <p className="text-[#5a5a5a] leading-relaxed">{destination.description}</p>
              </div>
            )}

            {/* Climate */}
            {destination.climateData && destination.climateData.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-2xl font-bold text-[#1b3a2d] mb-6">Climate & Weather</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {destination.climateData.map((climate) => (
                    <div key={climate.id} className="border border-[#e8e0d6] rounded-xl p-4 hover:border-[#c8956c]/30 transition">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getSeasonIcon(climate.season)}</span>
                        <h3 className="font-bold text-lg text-[#1b3a2d]">{climate.season}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><ThermometerSun className="w-4 h-4 text-orange-400" /><span className="text-sm text-[#8a8a8a]">Temp:</span><span className="text-sm font-semibold text-[#1b3a2d]">{climate.avg_temp_min}°C - {climate.avg_temp_max}°C</span></div>
                        <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /><span className="text-sm text-[#8a8a8a]">Rainfall:</span><span className="text-sm font-semibold text-[#1b3a2d]">{climate.rainfall_mm} mm</span></div>
                        <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-[#8a8a8a]" /><span className="text-sm text-[#8a8a8a]">AQI:</span><span className="text-sm font-semibold text-[#1b3a2d]">{climate.avg_aqi}</span></div>
                        <div className="flex items-center gap-2"><Cloud className="w-4 h-4 text-[#8a8a8a]" /><span className="text-sm text-[#6a6a6a]">{climate.weather_condition}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {destination.activities && destination.activities.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-2xl font-bold text-[#1b3a2d] mb-6">Things to Do</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {destination.activities.map((activity) => (
                    <div key={activity.id} className="border border-[#e8e0d6] rounded-xl p-4 hover:border-[#c8956c]/30 transition">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.1)' }}><Compass className="w-5 h-5 text-[#c8956c]" /></div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#1b3a2d] mb-1">{activity.activity_name}</h3>
                          <span className="inline-block px-2 py-0.5 bg-[#c8956c]/10 text-[#c8956c] text-xs font-medium rounded mb-2">{activity.activity_type}</span>
                          <p className="text-sm text-[#6a6a6a]">{activity.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className={cardClass} style={cardStyle}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.1)' }}><MapPin className="w-6 h-6 text-[#c8956c]" /></div>
                <h2 className="text-xl font-bold text-[#1b3a2d]">Location</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm text-[#6a6a6a]">
                  <p><span className="font-medium text-[#5a5a5a]">District:</span> {destination.district}</p>
                  <p className="mt-1"><span className="font-medium text-[#5a5a5a]">Coordinates:</span> {destination.latitude}°N, {destination.longitude}°E</p>
                </div>
                <a href={`https://www.google.com/maps?q=${destination.latitude},${destination.longitude}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8956c] text-white text-sm font-semibold rounded-full hover:bg-[#b5845e] transition">
                  <ExternalLink className="w-4 h-4" /> Open in Google Maps
                </a>
              </div>
            </div>

            {/* Gallery */}
            {photos.length > 1 && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-2xl font-bold text-[#1b3a2d] mb-6">Gallery</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {photos.slice(1).map((photo, index) => (
                    <div key={index} className="relative h-48 rounded-xl overflow-hidden group" style={{ background: 'linear-gradient(135deg, #1b3a2d, #0f2419)' }}>
                      {(photo?.medium || photo?.large) ? (
                        <Image src={photo.medium || photo.large} alt={`${destination.name} - View ${index + 1}`} fill className="object-cover group-hover:scale-110 transition duration-300" unoptimized onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Recommendations */}
            {nearbyData && nearbyData.destinations && nearbyData.destinations.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg ${nearbyData.is_match ? 'bg-emerald-500/10' : 'bg-[#c8956c]/10'}`}>
                    <Navigation className={`w-6 h-6 ${nearbyData.is_match ? 'text-emerald-400' : 'text-[#c8956c]'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1b3a2d]">{nearbyData.label}</h2>
                    <p className="text-sm text-[#8a8a8a]">{nearbyData.is_match ? 'Explore more destinations near this location' : 'These nearby destinations better match your preferences'}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {nearbyData.destinations.map((dest: any) => {
                    const nearbyPhoto = nearbyPhotos[dest.id];
                    const photoUrl = nearbyPhoto?.medium || nearbyPhoto?.large || (dest.images && dest.images[0]);
                    return (
                      <Link key={dest.id} href={`/destinations/${dest.id}`} className="border border-[#e8e0d6] rounded-xl p-4 hover:border-[#c8956c]/30 transition group">
                        <div className="relative h-32 rounded-lg overflow-hidden mb-3" style={{ background: 'linear-gradient(135deg, #1b3a2d, #0f2419)' }}>
                          {photoUrl ? (
                            <Image src={photoUrl} alt={dest.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center"><span className="text-3xl font-bold text-white/30">{dest.name.charAt(0)}</span><p className="text-xs text-white/20 mt-1">{dest.primary_type.replace('_', ' ')}</p></div>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs font-semibold">📍 {dest.distance_km} km</div>
                        </div>
                        <h3 className="font-bold text-[#1b3a2d] group-hover:text-[#c8956c] transition">{dest.name}</h3>
                        <p className="text-sm text-[#8a8a8a]">{dest.district}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">{dest.primary_type.replace('_', ' ')}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* People Also Like */}
            {peopleAlsoLike && peopleAlsoLike.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 149, 108, 0.1)' }}><Heart className="w-6 h-6 text-[#c8956c]" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1b3a2d]">People Also Like</h2>
                    <p className="text-sm text-[#8a8a8a]">Travelers who visited {destination.name} also enjoyed these places</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {peopleAlsoLike.map((dest: any) => (
                    <Link key={dest.id} href={`/destinations/${dest.id}`} className="border border-[#e8e0d6] rounded-xl p-4 hover:border-[#c8956c]/30 transition group">
                      <div className="relative h-32 rounded-lg overflow-hidden mb-3" style={{ background: 'linear-gradient(135deg, #1b3a2d, #0f2419)' }}>
                        {(() => {
                          const palPhoto = palPhotos[dest.id];
                          const photoUrl = palPhoto?.medium || palPhoto?.large || (dest.images && dest.images[0]);
                          return photoUrl ? (
                            <Image src={photoUrl} alt={dest.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : null;
                        })()}
                        <div className="absolute top-2 right-2 bg-[#c8956c]/80 text-white px-2 py-0.5 rounded-full text-xs font-semibold">👥 {dest.co_occurrence_score}% match</div>
                      </div>
                      <h3 className="font-bold text-[#1b3a2d] group-hover:text-[#c8956c] transition">{dest.name}</h3>
                      <p className="text-sm text-[#8a8a8a]">{dest.district}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-[#c8956c]/10 text-[#c8956c] text-xs font-medium rounded">{dest.primary_type.replace('_', ' ')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button onClick={() => setShowPlanModal(true)}
                className="flex-1 min-w-[200px] px-6 py-4 bg-[#c8956c] text-white rounded-full font-semibold hover:bg-[#b5845e] transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                <Calendar className="w-5 h-5" /> Let&apos;s Go
              </button>
              <button onClick={() => router.back()}
                className="px-6 py-4 border border-[#e8e0d6] text-[#5a5a5a] rounded-full font-medium hover:text-[#1b3a2d] hover:border-[#c8956c]/30 transition">
                Back to Destinations
              </button>
            </div>

            {/* Plan Modal */}
            {showPlanModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlanModal(false)}>
                <div className="rounded-2xl border border-[#e8e0d6] max-w-md w-full p-6 shadow-2xl" style={{ background: '#ffffff' }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-[#1b3a2d] mb-1">Plan Your Trip</h3>
                  <p className="text-sm text-[#8a8a8a] mb-5">Choose dates for your trip to <strong className="text-[#1b3a2d]">{destination.name}</strong></p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6a6a6a] mb-1">Start Date</label>
                      <input type="date" value={planStartDate} min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setPlanStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#e8e0d6] rounded-xl bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6a6a6a] mb-1">End Date</label>
                      <input type="date" value={planEndDate} min={planStartDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setPlanEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#e8e0d6] rounded-xl bg-white text-[#1b3a2d] focus:border-[#c8956c] focus:outline-none transition" />
                    </div>
                  </div>

                  {planError && <p className="text-red-400 text-sm mt-3">{planError}</p>}
                  {planSuccess && (
                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-emerald-400 text-sm font-medium">✅ Trip planned successfully!</p>
                      <Link href="/travel-plans" className="text-emerald-400 text-sm underline hover:text-emerald-300">View your travel plans →</Link>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => { setShowPlanModal(false); setPlanError(''); setPlanSuccess(false); }}
                      className="flex-1 px-4 py-2.5 border border-[#e8e0d6] text-[#5a5a5a] rounded-full font-medium hover:text-[#1b3a2d] hover:border-[#c8956c]/30 transition">Cancel</button>
                    <button onClick={handleCreatePlan} disabled={planLoading || planSuccess}
                      className="flex-1 px-4 py-2.5 bg-[#c8956c] text-white rounded-full font-medium hover:bg-[#b5845e] transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {planLoading ? 'Creating...' : planSuccess ? 'Done!' : 'Confirm Trip'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
