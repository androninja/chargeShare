import React, { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { CITY_MAP_META } from '../data/seedData';
import { useMarketplace } from '../context/MarketplaceContext';
import { CityId, ConnectorType } from '../types/marketplace';

const AMENITY_OPTIONS = [
  'Covered Driveway',
  'CCTV Guarded',
  '24x7 Gate Access',
  'Restroom',
  'Solar Canopy',
  'Two-Wheeler Friendly',
];

export function AddChargerModal() {
  const {
    user,
    userProfile,
    authBusy,
    isAddChargerOpen,
    setAddChargerOpen,
    addNewCharger,
    city,
    setActiveTab,
  } = useMarketplace();

  const [name, setName] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityId>(city);
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [hostName, setHostName] = useState(
    userProfile?.displayName ?? user?.displayName ?? 'Community Host',
  );
  const [connectorType, setConnectorType] = useState<ConnectorType>('Type 2');
  const [powerKw, setPowerKw] = useState(7.4);
  const [pricePerKwh, setPricePerKwh] = useState(17.0);
  const [instantBook, setInstantBook] = useState(true);
  const [amenities, setAmenities] = useState<string[]>(['Covered Driveway', 'CCTV Guarded']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAddChargerOpen) {
      setSelectedCity(city);
      const preferredName = userProfile?.displayName || user?.displayName;
      if (preferredName) {
        setHostName(preferredName);
      }
    }
  }, [isAddChargerOpen, city, userProfile?.displayName, user?.displayName]);

  if (!isAddChargerOpen) return null;

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !locality.trim()) {
      setError('Please enter both a station title and neighborhood locality.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await addNewCharger({
        name: name.trim(),
        city: selectedCity,
        locality: locality.trim(),
        address:
          address.trim() ||
          `${locality.trim()}, ${CITY_MAP_META[selectedCity].name}`,
        hostName: hostName.trim() || user?.displayName || 'Community Host',
        connectorType,
        powerKw,
        pricePerKwh,
        amenities,
        instantBook,
      });

      if (created) {
        setName('');
        setLocality('');
        setAddress('');
        setError('');
        setActiveTab('discover');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="List a new community EV charger"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_32px_-4px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <div className="text-xs font-semibold text-[#059669]">chargeShare Host Onboarding</div>
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              List Your Private EV Charger
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAddChargerOpen(false)}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="volt-scroll flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#B91C1C]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="charger-name" className="block text-xs font-semibold text-[#0F172A]">
              Station Title
            </label>
            <input
              id="charger-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GreenPark Villa 7.4kW Wallbox"
              className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="charger-city" className="block text-xs font-semibold text-[#0F172A]">
                City Grid
              </label>
              <select
                id="charger-city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as CityId)}
                className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                {(Object.keys(CITY_MAP_META) as CityId[]).map((cId) => (
                  <option key={cId} value={cId}>
                    {CITY_MAP_META[cId].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="charger-locality"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Locality / Area
              </label>
              <input
                id="charger-locality"
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g., Jayanagar 4th Block"
                className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="host-name" className="block text-xs font-semibold text-[#0F172A]">
                Host Display Name
              </label>
              <input
                id="host-name"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="connector-type" className="block text-xs font-semibold text-[#0F172A]">
                Connector Standard
              </label>
              <select
                id="connector-type"
                value={connectorType}
                onChange={(e) => {
                  const next = e.target.value as ConnectorType;
                  setConnectorType(next);
                  if (next === 'CCS2') setPowerKw(25);
                  else if (next === 'Type 2') setPowerKw(7.4);
                  else setPowerKw(3.3);
                }}
                className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="Type 2">Type 2 (AC Wallbox)</option>
                <option value="CCS2">CCS2 (DC Fast Charge)</option>
                <option value="15A Socket">15A Socket (3-Pin EV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="power-kw" className="block text-xs font-semibold text-[#0F172A]">
                Output Rating
              </label>
              <div className="relative mt-1">
                <input
                  id="power-kw"
                  type="number"
                  step="0.1"
                  min="1.5"
                  max="120"
                  value={powerKw}
                  onChange={(e) => setPowerKw(Math.max(1.5, Number(e.target.value) || 3.3))}
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] pr-10 pl-3 font-mono text-sm font-semibold text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-[#64748B]">
                  kW
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="tariff-inr" className="block text-xs font-semibold text-[#0F172A]">
                Tariff Rate
              </label>
              <div className="relative mt-1">
                <input
                  id="tariff-inr"
                  type="number"
                  step="0.5"
                  min="6"
                  max="45"
                  value={pricePerKwh}
                  onChange={(e) => setPricePerKwh(Math.max(6, Number(e.target.value) || 15))}
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] pr-14 pl-3 font-mono text-sm font-semibold text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-[#64748B]">
                  ₹/kWh
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="charger-address" className="block text-xs font-semibold text-[#0F172A]">
              Street Address (Optional)
            </label>
            <input
              id="charger-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/plot number, landmark, pincode"
              className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-[#0F172A]">Site Amenities</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((item) => {
                const checked = amenities.includes(item);
                return (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] px-2.5 py-2 text-xs text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(item)}
                      className="h-4 w-4 rounded accent-[#059669]"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div>
              <div className="text-xs font-semibold text-[#0F172A]">Enable Instant Book</div>
              <div className="text-[11px] text-[#64748B]">
                Drivers can unlock the bay immediately without manual approval
              </div>
            </div>
            <input
              type="checkbox"
              checked={instantBook}
              onChange={(e) => setInstantBook(e.target.checked)}
              className="h-4 w-4 accent-[#059669]"
            />
          </label>

          {!user && (
            <p className="text-[11px] text-[#475569]">
              You&apos;ll sign in with Google to publish this charger live to the network.
            </p>
          )}

          <div className="flex gap-3 border-t border-[#F1F5F9] pt-4">
            <button
              type="button"
              onClick={() => setAddChargerOpen(false)}
              className="h-10 flex-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || authBusy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#059669] text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-60 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>{submitting || authBusy ? 'Publishing...' : 'Publish Charger Pin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
