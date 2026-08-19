'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Restaurant } from '@/lib/types';

// Fix Leaflet's default icon issue in Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ restaurants }: { restaurants: Restaurant[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (restaurants.length > 0) {
      const bounds = L.latLngBounds([]);
      let hasValidCoords = false;
      
      restaurants.forEach(r => {
        if (r.Latitude && r.Longitude && (r.Latitude !== 0 || r.Longitude !== 0)) {
          bounds.extend([r.Latitude, r.Longitude]);
          hasValidCoords = true;
        }
      });
      
      if (hasValidCoords) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [restaurants, map]);
  
  return null;
}

interface MapProps {
  restaurants: Restaurant[];
}

export default function Map({ restaurants }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl" />;

  // Default center if no data
  const center = restaurants.length > 0 
    ? [restaurants[0].Latitude, restaurants[0].Longitude] as [number, number]
    : [28.6139, 77.2090] as [number, number]; // Default to Delhi

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer center={center} zoom={10} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater restaurants={restaurants} />
        <MarkerClusterGroup chunkedLoading>
          {restaurants.map((restaurant) => {
            // Some records might have invalid lat/long (0,0 or null)
            if (!restaurant.Latitude || !restaurant.Longitude || (restaurant.Latitude === 0 && restaurant.Longitude === 0)) return null;
            
            return (
              <Marker
                key={restaurant["Restaurant ID"]}
                position={[restaurant.Latitude, restaurant.Longitude]}
                icon={customIcon}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-sm mb-1">{restaurant["Restaurant Name"]}</h3>
                    <p className="text-xs text-slate-600 mb-2">{restaurant.Locality}, {restaurant.City}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="font-semibold">Cuisine:</span>
                      <span className="truncate" title={restaurant.Cuisines}>{restaurant.Cuisines}</span>
                      <span className="font-semibold">Rating:</span>
                      <span className="flex items-center gap-1">
                        {restaurant["Aggregate rating"]} 
                        <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor: restaurant["Rating color"]}}></span>
                      </span>
                      <span className="font-semibold">Price Range:</span>
                      <span>{'$'.repeat(restaurant["Price range"])}</span>
                      <span className="font-semibold">Avg Cost:</span>
                      <span>{restaurant.Currency} {restaurant["Average Cost for two"]}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
