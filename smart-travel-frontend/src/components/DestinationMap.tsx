'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { Destination } from '@/types';

// Fix for default marker icons in Next.js
const iconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete iconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface DestinationMapProps {
  onMapClick: (lat: number, lng: number) => void;
  clickedLocation: { lat: number; lng: number } | null;
  destinations?: Destination[];
  center?: [number, number]; // New prop for programmatic centering
}

// Simple blue marker for clicked location
const createClickedMarker = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: pulse 1.5s ease-in-out infinite;
      "></div>
    `,
    className: 'clicked-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Green marker for destinations
const createDestinationMarker = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      "></div>
    `,
    className: 'destination-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Map controller for programmatic centering
function MapController({ center }: { center?: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, {
        duration: 1.5
      });
    }
  }, [center, map]);

  return null;
}

export default function DestinationMap({
  onMapClick,
  clickedLocation,
  destinations = [],
  center,
}: DestinationMapProps) {
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[10.8505, 76.2711]} // Center of Kerala
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={18}
        />

        <ZoomControl position="bottomright" />

        <MapClickHandler onMapClick={onMapClick} />
        <MapController center={center} />
        
        {/* Destination markers */}
        {destinations.map((dest: Destination) => (
          <Marker
            key={dest.id}
            position={[dest.latitude, dest.longitude]}
            icon={createDestinationMarker()}
            title={dest.name}
          />
        ))}

        {/* Show temporary marker at clicked location */}
        {clickedLocation && (
          <Marker
            position={[clickedLocation.lat, clickedLocation.lng]}
            icon={createClickedMarker()}
          />
        )}
      </MapContainer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
        }

        .clicked-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
