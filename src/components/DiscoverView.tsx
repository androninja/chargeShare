import { useMemo, useState } from 'react';
import { ChevronDown, List, Map as MapIcon, MapPin, Search, SlidersHorizontal, Zap } from 'lucide-react';
import { CITY_MAP_META, matchesVehicleCategory } from '../data/seedData';
import { useMarketplace } from '../context/MarketplaceContext';
import { CityId, ConnectorType, VehicleCategoryFilter } from '../types/marketplace';
import { ChargerCard } from './ChargerCard';
import { GoogleCityMap } from './GoogleCityMap';

const CITIES: CityId[] = ['bengaluru', 'mumbai', 'delhi-ncr', 'pune'];
const CONNECTORS: Array<'All' | ConnectorType> = ['All', 'CCS2', 'Type 2', '15A Socket'];

export function DiscoverView() {
  const {
    city,
    setCity,
    chargers,
    selectedStationId,
    setSelectedStationId,
    openBookingDrawer,
    activeSession,
    setActiveTab,
  } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState('');
  const [connectorFilter, setConnectorFilter] = useState<'All' | ConnectorType>('All');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleCategoryFilter>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFastDc, setOnlyFastDc] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'power'>('distance');
  const [mobilePane, setMobilePane] = useState<'list' | 'map'>('list');

  const cityStations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chargers
      .filter((c) => c.city === city)
      .filter((c) => matchesVehicleCategory(c, vehicleFilter))
      .filter((c) => (connectorFilter === 'All' ? true : c.connectorType === connectorFilter))
      .filter((c) => (onlyAvailable ? c.status === 'available' : true))
      .filter((c) => (onlyFastDc ? c.isFastDc : true))
      .filter((c) =>
        q
          ? c.name.toLowerCase().includes(q) ||
            c.locality.toLowerCase().includes(q) ||
            c.hostName.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        if (sortBy === 'price') return a.pricePerKwh - b.pricePerKwh;
        if (sortBy === 'power') return b.powerKw - a.powerKw;
        return a.distanceKm - b.distanceKm;
      });
  }, [chargers, city, vehicleFilter, connectorFilter, onlyAvailable, onlyFastDc, searchQuery, sortBy]);

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-5 md:px-8 md:py-6 pb-20 md:pb-8">
      {/* Live Active Session Resume Strip (only shown when a real session is running) */}
      {activeSession && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2563EB]/30 bg-[#EFF6FF] px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Zap className="h-4 w-4 text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">
              Charging live at {activeSession.stationName}
            </span>
            <span className="hidden sm:inline text-[#475569] tabular-nums">
              · {activeSession.currentSoc.toFixed(1)}% SoC · {activeSession.livePowerKw.toFixed(1)} kW
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className="h-8 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer whitespace-nowrap"
          >
            Open Live Telemetry
          </button>
        </div>
      )}

      {/* Workspace Intro + Top-Right Location Dropdown */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl text-balance">
            Find Verified Community & Fast EV Chargers
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Book neighborhood home wallboxes or solar fast-charge bays with transparent ₹/kWh pricing.
          </p>
        </div>

        {/* Location Dropdown Select */}
        <div className="flex justify-end shrink-0">
          <div className="relative inline-flex items-center">
            <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-[#059669]" />
            <select
              id="city-location-select"
              value={city}
              onChange={(e) => setCity(e.target.value as CityId)}
              aria-label="Select city location"
              className="h-10 appearance-none rounded-lg border border-[#CBD5E1] bg-white pr-9 pl-9 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15 cursor-pointer"
            >
              {CITIES.map((cId) => (
                <option key={cId} value={cId}>
                  {CITY_MAP_META[cId].name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[#64748B]" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${CITY_MAP_META[city].name} localities or hosts...`}
            aria-label="Search charging stations"
            className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pr-3 pl-9 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Connector Filter Buttons */}
          {CONNECTORS.map((conn) => {
            const active = connectorFilter === conn;
            return (
              <button
                key={conn}
                type="button"
                onClick={() => setConnectorFilter(conn)}
                className={`h-9 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'border-[#059669] bg-[#059669]/10 text-[#047857] font-semibold'
                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#94A3B8]'
                }`}
              >
                {conn}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setOnlyAvailable((v) => !v)}
            className={`h-9 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              onlyAvailable
                ? 'border-[#059669] bg-[#059669]/10 text-[#047857] font-semibold'
                : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#94A3B8]'
            }`}
          >
            Available Now
          </button>

          <button
            type="button"
            onClick={() => setOnlyFastDc((v) => !v)}
            className={`h-9 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              onlyFastDc
                ? 'border-[#059669] bg-[#059669]/10 text-[#047857] font-semibold'
                : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#94A3B8]'
            }`}
          >
            Fast DC (25kW+)
          </button>

          <div className="flex items-center gap-1.5 pl-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'power')}
              aria-label="Sort stations"
              className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            >
              <option value="distance">Nearest first</option>
              <option value="price">Lowest ₹/kWh</option>
              <option value="power">Highest kW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile View Mode Toggle (List vs Map) */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane('list')}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
            mobilePane === 'list'
              ? 'border-[#0F172A] bg-[#0F172A] text-white'
              : 'border-[#E2E8F0] bg-white text-[#334155]'
          }`}
        >
          <List className="h-4 w-4" />
          <span>Stations ({cityStations.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('map')}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
            mobilePane === 'map'
              ? 'border-[#2563EB] bg-[#2563EB] text-white'
              : 'border-[#E2E8F0] bg-white text-[#334155]'
          }`}
        >
          <MapIcon className="h-4 w-4" />
          <span>Interactive Map</span>
        </button>
      </div>

      {/* 12-Column Split Screen: 6 cols Charger Listings + 6 cols Sticky Vector City Map */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 6 Columns: Charger Listings */}
        <div
          className={`lg:col-span-6 space-y-3 ${
            mobilePane === 'list' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#475569] tabular-nums">
            <span>
              Showing <strong className="text-[#0F172A]">{cityStations.length}</strong> charging
              stations in {CITY_MAP_META[city].name}
            </span>
            {(vehicleFilter !== 'all' || connectorFilter !== 'All' || onlyAvailable || onlyFastDc || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setVehicleFilter('all');
                  setConnectorFilter('All');
                  setOnlyAvailable(false);
                  setOnlyFastDc(false);
                }}
                className="font-semibold text-[#059669] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {cityStations.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#475569]">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-[#0F172A]">
                No chargers match those filters
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Try clearing the vehicle type, Fast DC, or connector filter to see nearby verified host bays.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setVehicleFilter('all');
                  setConnectorFilter('All');
                  setOnlyAvailable(false);
                  setOnlyFastDc(false);
                }}
                className="mt-4 h-9 rounded-lg bg-[#059669] px-4 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
              >
                Show All {CITY_MAP_META[city].name} Bays
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cityStations.map((station) => (
                <ChargerCard
                  key={station.id}
                  station={station}
                  isSelected={station.id === selectedStationId}
                  onSelect={() => setSelectedStationId(station.id)}
                  onBook={() => openBookingDrawer(station.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 6 Columns: Sticky Interactive Google Map */}
        <div
          className={`lg:col-span-6 ${
            mobilePane === 'map' ? 'block h-[500px]' : 'hidden lg:block'
          }`}
        >
          <div className="h-full lg:sticky lg:top-20 lg:h-[calc(100vh-140px)] lg:min-h-[540px]">
            <GoogleCityMap
              city={city}
              stations={cityStations}
              selectedStationId={selectedStationId}
              vehicleFilter={vehicleFilter}
              onVehicleFilterChange={setVehicleFilter}
              onSelectStation={(id) => setSelectedStationId(id)}
              onOpenBooking={(id) => openBookingDrawer(id)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
