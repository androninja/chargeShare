import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bike,
  Car,
  ExternalLink,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  AdvancedMarker,
  APILoadingStatus,
  CollisionBehavior,
  Map as GoogleMap,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { CITY_MAP_META } from '../data/seedData';
import { ChargerStation, CityId, VehicleCategoryFilter } from '../types/marketplace';

interface GoogleCityMapProps {
  city: CityId;
  stations: ChargerStation[];
  selectedStationId: string | null;
  vehicleFilter: VehicleCategoryFilter;
  onVehicleFilterChange: (filter: VehicleCategoryFilter) => void;
  onSelectStation: (stationId: string) => void;
  onOpenBooking: (stationId: string) => void;
}

function formatPowerKw(kw: number): string {
  return Number.isInteger(kw) ? String(kw) : kw.toFixed(1);
}

const MAP_ID = 'chargeshare-city-map';

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (process.env.GOOGLE_MAPS_API_KEY as string | undefined) ||
  '';

function MapCameraController({
  city,
  selectedStationId,
  stations,
  recenterSignal,
  userLocation,
  focusUserSignal,
}: {
  city: CityId;
  selectedStationId: string | null;
  stations: ChargerStation[];
  recenterSignal: number;
  userLocation: { lat: number; lng: number } | null;
  focusUserSignal: number;
}) {
  const map = useMap(MAP_ID);
  const meta = CITY_MAP_META[city];
  const prevCityRef = useRef<CityId>(city);

  useEffect(() => {
    if (!map) return;
    prevCityRef.current = city;
    map.panTo(meta.center);
    map.setZoom(meta.zoom);
  }, [map, city, meta.center, meta.zoom, recenterSignal]);

  useEffect(() => {
    if (!map || !selectedStationId) return;
    if (prevCityRef.current !== city) return;
    const match = stations.find((s) => s.id === selectedStationId && s.city === city);
    if (match) {
      map.panTo(match.coordinates);
    }
  }, [map, city, selectedStationId, stations]);

  useEffect(() => {
    if (!map || !userLocation || focusUserSignal === 0) return;
    map.panTo(userLocation);
    map.setZoom(14);
  }, [map, userLocation, focusUserSignal]);

  return null;
}

function MapUnavailableCard({
  city,
  reason,
}: {
  city: CityId;
  reason: 'missing_key' | 'load_error';
}) {
  const meta = CITY_MAP_META[city];
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
        <MapPin className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-[#0F172A]">
        {reason === 'missing_key'
          ? 'Google Maps API key not configured'
          : `Unable to load ${meta.name} Google Map`}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#475569]">
        {reason === 'missing_key'
          ? 'Configure VITE_GOOGLE_MAPS_API_KEY to view live community charger locations on Google Maps. You can still browse and book stations from the list.'
          : 'Check your network connection or Maps API key restrictions, or continue browsing verified chargers in the station list.'}
      </p>
    </div>
  );
}

function GoogleCityMapInner({
  city,
  stations,
  selectedStationId,
  vehicleFilter,
  onVehicleFilterChange,
  onSelectStation,
  onOpenBooking,
}: GoogleCityMapProps) {
  const meta = CITY_MAP_META[city];
  const apiStatus = useApiLoadingStatus();
  const map = useMap(MAP_ID);

  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [focusUserSignal, setFocusUserSignal] = useState(0);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? stations[0] ?? null,
    [stations, selectedStationId],
  );

  // Order pins north-to-south so southern markers overlap northern ones naturally
  const orderedStations = useMemo(
    () => [...stations].sort((a, b) => b.coordinates.lat - a.coordinates.lat),
    [stations],
  );

  const handleZoomIn = () => {
    if (!map) return;
    const current = map.getZoom() ?? meta.zoom;
    map.setZoom(Math.min(18, current + 1));
  };

  const handleZoomOut = () => {
    if (!map) return;
    const current = map.getZoom() ?? meta.zoom;
    map.setZoom(Math.max(10, current - 1));
  };

  const handleRecenterCity = () => {
    setGeoMessage(null);
    setRecenterSignal((n) => n + 1);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Location services unavailable in this browser.');
      return;
    }
    setLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setFocusUserSignal((n) => n + 1);
      },
      () => {
        setLocating(false);
        setGeoMessage('Location permission denied — showing city corridor.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return <MapUnavailableCard city={city} reason="load_error" />;
  }

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#EEF2F6]">
      {/* Top-left City Corridor Header + Vehicle Type Toggle */}
      <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-64px)] flex-col items-start gap-2">
        <div className="pointer-events-none rounded-xl border border-[#E2E8F0] bg-white/95 px-3.5 py-2 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="font-display text-xs font-semibold text-[#0F172A]">{meta.name} Grid</div>
          <div className="text-[11px] text-[#475569]">{meta.corridorLabel}</div>
        </div>

        <div
          role="group"
          aria-label="Filter chargers by vehicle type"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white/95 p-1 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => onVehicleFilterChange('all')}
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              vehicleFilter === 'all'
                ? 'bg-[#059669] text-white'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>All Chargers</span>
          </button>
          <button
            type="button"
            onClick={() => onVehicleFilterChange('2w')}
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              vehicleFilter === '2w'
                ? 'bg-[#059669] text-white'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Bike className="h-3 w-3" />
            <span>2-Wheeler</span>
          </button>
          <button
            type="button"
            onClick={() => onVehicleFilterChange('4w')}
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              vehicleFilter === '4w'
                ? 'bg-[#059669] text-white'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Car className="h-3 w-3" />
            <span>4-Wheeler</span>
          </button>
        </div>
      </div>

      {/* Top-right Map Zoom, Locate Me & Recenter Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in map"
          title="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out map"
          title="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC] cursor-pointer"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          aria-label="Center map on my location"
          title="Locate me"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#2563EB] shadow-sm transition-colors hover:bg-[#EFF6FF] disabled:opacity-60 cursor-pointer"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
        </button>
        <button
          type="button"
          onClick={handleRecenterCity}
          aria-label={`Recenter on ${meta.name}`}
          title={`Recenter ${meta.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] shadow-sm transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {geoMessage && (
        <div className="absolute top-28 left-3 z-10 rounded-lg border border-[#E2E8F0] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#475569] shadow-sm">
          {geoMessage}
        </div>
      )}

      {(apiStatus === APILoadingStatus.LOADING || apiStatus === APILoadingStatus.NOT_LOADED) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#F8FAFC]/70">
          <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#475569] shadow-sm">
            Loading {meta.name} map...
          </div>
        </div>
      )}

      {/* Interactive Google Map Viewport */}
      <GoogleMap
        id={MAP_ID}
        mapId="DEMO_MAP_ID"
        defaultCenter={meta.center}
        defaultZoom={meta.zoom}
        gestureHandling="greedy"
        clickableIcons={false}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="h-full w-full"
      >
        <MapCameraController
          city={city}
          selectedStationId={selectedStationId}
          stations={stations}
          recenterSignal={recenterSignal}
          userLocation={userLocation}
          focusUserSignal={focusUserSignal}
        />

        {/* User Geolocation Pulse Dot (when granted) */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            anchorLeft="-50%"
            anchorTop="-50%"
            zIndex={800}
            title="Your current location"
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute h-6 w-6 rounded-full bg-[#2563EB]/25 animate-ping" />
              <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-[#2563EB] shadow-md" />
            </div>
          </AdvancedMarker>
        )}

        {/* EV Charging Station Price-Tag Advanced Markers */}
        {orderedStations.map((station) => {
          const isSelected = station.id === selectedStation?.id;
          const isHovered = station.id === hoveredStationId;

          const pinTheme = isSelected
            ? 'bg-[#2563EB] text-white border-[#1D4ED8] scale-110 shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
            : station.status === 'available'
              ? 'bg-white text-[#0F172A] border-[#059669] hover:bg-[#ECFDF5]'
              : station.status === 'high_demand'
                ? 'bg-white text-[#B45309] border-[#D97706] hover:bg-[#FFFBEB]'
                : station.status === 'occupied'
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#2563EB]'
                  : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]';

          const iconColor = isSelected
            ? 'text-white'
            : station.status === 'available'
              ? 'text-[#059669]'
              : station.status === 'high_demand'
                ? 'text-[#D97706]'
                : station.status === 'occupied'
                  ? 'text-[#2563EB]'
                  : 'text-[#64748B]';

          return (
            <AdvancedMarker
              key={station.id}
              position={station.coordinates}
              anchorLeft="-50%"
              anchorTop="-100%"
              zIndex={isSelected ? 1000 : isHovered ? 900 : 10}
              collisionBehavior={
                isSelected
                  ? CollisionBehavior.REQUIRED
                  : CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
              }
              onClick={() => onSelectStation(station.id)}
              title={`${station.name} · ${formatPowerKw(station.powerKw)} kW ${station.isFastDc ? 'DC' : 'AC'} · ₹${station.pricePerKwh.toFixed(0)}/kWh`}
            >
              <div
                onMouseEnter={() => setHoveredStationId(station.id)}
                onMouseLeave={() => setHoveredStationId(null)}
                className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-bold shadow-[0_4px_12px_rgba(15,23,42,0.16)] transition-transform duration-150 tabular-nums whitespace-nowrap cursor-pointer ${pinTheme}`}
              >
                <Zap className={`h-3 w-3 shrink-0 ${iconColor}`} />
                <span>{formatPowerKw(station.powerKw)} kW</span>
              </div>
            </AdvancedMarker>
          );
        })}
      </GoogleMap>

      {/* Bottom Selected Station Quick-Action Float Card */}
      {selectedStation ? (
        <div className="absolute right-3 bottom-3 left-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white/95 p-3 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569]">
              <Navigation className="h-3 w-3 shrink-0 text-[#2563EB]" />
              <span className="truncate">
                {selectedStation.locality} · {selectedStation.distanceKm.toFixed(1)} km away
              </span>
            </div>
            <div className="mt-0.5 font-display text-sm font-semibold text-[#0F172A] truncate">
              {selectedStation.name}
            </div>
            <div className="text-xs text-[#475569] tabular-nums">
              {selectedStation.connectorType} · {formatPowerKw(selectedStation.powerKw)} kW{' '}
              {selectedStation.isFastDc ? 'DC' : 'AC'} ·{' '}
              <span className="font-mono font-semibold text-[#0F172A]">
                ₹{selectedStation.pricePerKwh.toFixed(2)}/kWh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.coordinates.lat},${selectedStation.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open directions to ${selectedStation.name}`}
              title="Directions in Google Maps"
              className="hidden sm:inline-flex h-10 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#334155] transition-colors hover:border-[#94A3B8] hover:text-[#0F172A]"
            >
              <span>Route</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
            </a>
            <button
              type="button"
              disabled={selectedStation.status === 'maintenance'}
              onClick={() => onOpenBooking(selectedStation.id)}
              className={`h-10 rounded-lg px-4 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStation.status === 'maintenance'
                  ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#059669] text-white hover:bg-[#047857]'
              }`}
            >
              {selectedStation.status === 'maintenance' ? 'Offline' : 'Inspect & Book'}
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute right-3 bottom-3 left-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white/95 p-3 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="text-xs text-[#475569]">
            No {vehicleFilter === '2w' ? '2-wheeler' : vehicleFilter === '4w' ? '4-wheeler' : ''} chargers match your current filters in {meta.name}.
          </div>
          {vehicleFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onVehicleFilterChange('all')}
              className="h-8 shrink-0 rounded-lg bg-[#059669] px-3 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GoogleCityMap(props: GoogleCityMapProps) {
  if (!MAPS_API_KEY) {
    return <MapUnavailableCard city={props.city} reason="missing_key" />;
  }
  return <GoogleCityMapInner {...props} />;
}
