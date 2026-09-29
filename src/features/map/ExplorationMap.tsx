import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker, StyleSpecification, GeoJSONSource } from 'maplibre-gl';
import { configureMapLibreWorker } from '../../services/map/maplibreWorker';

// Configure official Vite worker integration once before Map instances are created
configureMapLibreWorker();

import { useGameStore } from '../../store/useGameStore';
import { StreetSegment, Place, NPC } from '../../types/game';
import { Compass, Navigation, Footprints, Plus, Minus, Eye, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';

interface ExplorationMapProps {
  onSelectNPC?: (npc: NPC) => void;
  onSelectStreet?: (street: StreetSegment) => void;
}

export const ExplorationMap: React.FC<ExplorationMapProps> = ({ onSelectNPC, onSelectStreet }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const playerMarkerRef = useRef<Marker | null>(null);
  const npcMarkersRef = useRef<Marker[]>([]);
  const placeMarkersRef = useRef<Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  const {
    currentLocation,
    streets,
    places,
    npcs,
    activeSpawn,
    settings,
    isSimulatingWalk,
    toggleSimulatedWalk,
    updateLocation,
    setSelectedNPCForChat,
    setSelectedStreetForModal,
  } = useGameStore();

  const currentLocationRef = useRef(currentLocation);
  currentLocationRef.current = currentLocation;

  const t = getTranslation(settings.language);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [followPlayer, setFollowPlayer] = useState(true);

  // Helper to format GeoJSON features with geometric progress
  const getStreetFeatures = () => {
    return streets.map((s) => {
      const pct = s.discoveryPercent || 0;
      let label = '';
      if (pct >= 70) {
        label = s.name;
      } else if (pct > 0) {
        label = `${s.name} (${pct}%)`;
      }

      return {
        type: 'Feature' as const,
        id: s.id,
        properties: {
          id: s.id,
          name: s.name,
          discovered: s.discovered,
          discoveryPercent: pct,
          label,
          district: s.district,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: s.coordinates,
        },
      };
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const style: StyleSpecification = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
        'streets-source': {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: getStreetFeatures(),
          },
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 20,
        },
        // Layer 1: Undiscovered streets (Fog of war - dark subtle dashed line)
        {
          id: 'streets-undiscovered',
          type: 'line',
          source: 'streets-source',
          filter: ['==', 'discoveryPercent', 0],
          paint: {
            'line-color': '#1e293b',
            'line-width': 4.5,
            'line-dasharray': [2, 1.5],
            'line-opacity': 0.65,
          },
        },
        // Layer 2: Partially explored streets (in-progress traversal)
        {
          id: 'streets-progress-glow',
          type: 'line',
          source: 'streets-source',
          filter: ['all', ['>', 'discoveryPercent', 0], ['<', 'discoveryPercent', 70]],
          paint: {
            'line-color': '#f59e0b',
            'line-width': 6,
            'line-blur': 2,
            'line-opacity': 0.6,
          },
        },
        {
          id: 'streets-progress-core',
          type: 'line',
          source: 'streets-source',
          filter: ['all', ['>', 'discoveryPercent', 0], ['<', 'discoveryPercent', 70]],
          paint: {
            'line-color': '#fbbf24',
            'line-width': 3.5,
            'line-dasharray': [3, 1],
            'line-opacity': 0.9,
          },
        },
        // Layer 3: Fully Discovered streets halo/glow
        {
          id: 'streets-discovered-glow',
          type: 'line',
          source: 'streets-source',
          filter: ['>=', 'discoveryPercent', 70],
          paint: {
            'line-color': '#06b6d4',
            'line-width': 9,
            'line-blur': 4,
            'line-opacity': 0.55,
          },
        },
        // Layer 4: Fully Discovered streets core
        {
          id: 'streets-discovered-core',
          type: 'line',
          source: 'streets-source',
          filter: ['>=', 'discoveryPercent', 70],
          paint: {
            'line-color': '#22d3ee',
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        },
        // Layer 5: Street labels for explored or in-progress streets
        {
          id: 'streets-labels',
          type: 'symbol',
          source: 'streets-source',
          filter: ['>', 'discoveryPercent', 0],
          layout: {
            'symbol-placement': 'line',
            'text-field': ['get', 'label'],
            'text-size': 11,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-offset': [0, -0.6],
          },
          paint: {
            'text-color': '#f8fafc',
            'text-halo-color': '#090d16',
            'text-halo-width': 2,
          },
        },
      ],
    };

    try {
      const validLon = typeof currentLocation.longitude === 'number' && !isNaN(currentLocation.longitude) ? currentLocation.longitude : 24.7535;
      const validLat = typeof currentLocation.latitude === 'number' && !isNaN(currentLocation.latitude) ? currentLocation.latitude : 59.4370;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: style,
        center: [validLon, validLat],
        zoom: 16.2,
        pitch: 35,
        bearing: 0,
        attributionControl: false,
      });

      map.on('load', () => {
        // Tap on street to view details
        const handleStreetClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (e.features && e.features[0]) {
            const stId = e.features[0].properties?.id;
            const found = streets.find((s) => s.id === stId);
            if (found) {
              setSelectedStreetForModal(found);
              if (onSelectStreet) onSelectStreet(found);
            }
          }
        };

        map.on('click', 'streets-discovered-core', handleStreetClick);
        map.on('click', 'streets-progress-core', handleStreetClick);
        map.on('click', 'streets-undiscovered', handleStreetClick);

        setMapLoaded(true);
        setMapError(null);
      });

      map.on('error', (e) => {
        console.warn('MapLibre runtime event error:', e);
      });

      mapRef.current = map;
    } catch (err: unknown) {
      console.error('Failed to initialize MapLibre map:', err);
      setMapError(err instanceof Error ? err.message : 'Map initialization failed');
    }

    return () => {
      playerMarkerRef.current?.remove();
      playerMarkerRef.current = null;
      npcMarkersRef.current.forEach((m) => m.remove());
      npcMarkersRef.current = [];
      placeMarkersRef.current.forEach((m) => m.remove());
      placeMarkersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // Update Streets data on discovery
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('streets-source') as GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: getStreetFeatures(),
      });
    }
  }, [streets, mapLoaded]);

  // Create & Update Player + Companion Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (!playerMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer';

      el.innerHTML = `
        <div class="absolute w-14 h-14 rounded-full bg-cyan-500/20 animate-pulse-ring pointer-events-none"></div>
        <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping pointer-events-none"></div>
        
        <div class="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 border-2 border-white shadow-lg shadow-cyan-500/50">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>

        <div class="absolute -top-6 -right-6 z-20 flex flex-col items-center animate-companion-idle pointer-events-auto">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-200 flex items-center justify-center shadow-md shadow-orange-500/40 text-xs">
            🐾
          </div>
          <span class="text-[9px] font-bold text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Pip</span>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(mapRef.current);

      playerMarkerRef.current = marker;
    } else {
      playerMarkerRef.current.setLngLat([currentLocation.longitude, currentLocation.latitude]);
    }

    if (followPlayer && mapRef.current) {
      mapRef.current.easeTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        duration: 800,
      });
    }
  }, [currentLocation, followPlayer]);

  // Create & Update NPC Markers
  useEffect(() => {
    if (!mapRef.current) return;

    npcMarkersRef.current.forEach((m) => m.remove());
    npcMarkersRef.current = [];

    const currentHour = new Date().getHours();

    npcs.forEach((npc) => {
      const slot = npc.schedule.find(
        (s) => currentHour >= s.startHour && currentHour < s.endHour
      ) || npc.schedule[0];
      const isActive = activeSpawn?.npcId === npc.id;

      const el = document.createElement('div');
      el.className = 'group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-115 active:scale-95';
      el.innerHTML = `
        <div class="flex items-center gap-1 px-1.5 py-0.5 mb-1 rounded-full ${
          isActive
            ? 'bg-amber-950/90 border border-amber-400 text-amber-200 ring-2 ring-amber-400/40 animate-pulse'
            : 'bg-slate-900/90 border border-purple-500/40 text-purple-200'
        } text-[10px] font-medium shadow-md whitespace-nowrap">
          <span>${npc.avatar}</span>
          <span>${npc.name}</span>
          ${isActive ? '<span class="text-[9px] text-amber-300 font-extrabold ml-0.5">★</span>' : ''}
        </div>
        <div class="relative flex items-center justify-center">
          ${
            isActive
              ? '<div class="absolute w-12 h-12 rounded-full bg-amber-400/30 animate-ping pointer-events-none"></div>'
              : ''
          }
          <div class="w-8 h-8 rounded-full ${
            isActive
              ? 'bg-gradient-to-tr from-amber-500 to-orange-600 border-2 border-amber-200 shadow-amber-500/50'
              : 'bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-purple-300 shadow-purple-600/40'
          } flex items-center justify-center shadow-lg text-base">
            ${npc.avatar}
          </div>
        </div>
        <div class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-purple-400'} mt-0.5"></div>
      `;

      el.addEventListener('click', () => {
        setSelectedNPCForChat(npc);
        if (onSelectNPC) onSelectNPC(npc);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([slot.longitude, slot.latitude])
        .addTo(mapRef.current!);

      npcMarkersRef.current.push(marker);
    });
  }, [npcs, activeSpawn, mapLoaded]);

  // Create & Update Place Markers
  useEffect(() => {
    if (!mapRef.current) return;

    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = [];

    places.forEach((place) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer transition-transform hover:scale-110';
      const isDiscovered = place.discovered;

      el.innerHTML = `
        <div class="w-7 h-7 rounded-full flex items-center justify-center border ${
          isDiscovered
            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/30'
            : 'bg-slate-900/80 border-slate-700 text-slate-500 opacity-60'
        } text-sm">
          ${isDiscovered ? place.icon || '📍' : '❓'}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .addTo(mapRef.current!);

      placeMarkersRef.current.push(marker);
    });
  }, [places, mapLoaded]);

  // Simulated walking loop (smoothly walks along street trajectories in demo mode)
  useEffect(() => {
    if (!isSimulatingWalk) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const prev = currentLocationRef.current;
      const latDelta = Math.sin(step * 0.15) * 0.00012 + 0.00008;
      const lonDelta = Math.cos(step * 0.15) * 0.00015;

      const nextLoc = {
        latitude: prev.latitude + latDelta,
        longitude: prev.longitude + lonDelta,
        accuracy: 4,
        speed: 1.4, // ~5 km/h
        heading: (step * 8) % 360,
        timestamp: Date.now(),
        isSimulated: true,
      };

      updateLocation(nextLoc);
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulatingWalk, updateLocation]);

  const handleRecenter = () => {
    setFollowPlayer(true);
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 16.5,
        duration: 800,
      });
    }
  };

  const handleZoom = (delta: number) => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      zoom: mapRef.current.getZoom() + delta,
      duration: 300,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0d14]">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Error Fallback UI */}
      {mapError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0d14]/90 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
          <h3 className="text-base font-bold text-white mb-1">Kaart pole saadaval (Map unavailable)</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            Proovi uuesti (Retry)
          </button>
        </div>
      )}

      {/* Floating HUD Controls */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2.5">
        <button
          onClick={handleRecenter}
          className={`w-11 h-11 rounded-2xl game-glass-panel flex items-center justify-center transition-all ${
            followPlayer ? 'text-cyan-400 border-cyan-500/40 shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
          title="Tsentreeri asukohale"
        >
          <Navigation className={`w-5 h-5 ${followPlayer ? 'fill-cyan-400' : ''}`} />
        </button>

        <button
          onClick={toggleSimulatedWalk}
          className={`w-11 h-11 rounded-2xl game-glass-panel flex items-center justify-center transition-all ${
            isSimulatingWalk
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
              : 'text-slate-400 hover:text-white'
          }`}
          title={isSimulatingWalk ? 'Peata kõnd' : 'Simuleeri kõndi'}
        >
          <Footprints className="w-5 h-5" />
        </button>

        <div className="flex flex-col rounded-2xl game-glass-panel overflow-hidden">
          <button
            onClick={() => handleZoom(1)}
            className="w-11 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-white/10" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-11 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSimulatingWalk && (
        <div className="absolute top-20 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Kõndimise simulatsioon aktiivne (~5 km/h)
        </div>
      )}
    </div>
  );
};
