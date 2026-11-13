import { useState } from 'react';
import {
  Check,
  Clock,
  LogIn,
  Plus,
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { CITY_MAP_META } from '../data/seedData';
import { useMarketplace } from '../context/MarketplaceContext';
import { ChargerStatus } from '../types/marketplace';

export function HostConsoleView() {
  const {
    user,
    authBusy,
    isAdmin,
    signInWithGoogle,
    chargers,
    bookings,
    toggleChargerStatus,
    updateChargerPrice,
    approveBooking,
    declineBooking,
    setAddChargerOpen,
    resetDemoData,
    setCity,
    setSelectedStationId,
    setActiveTab,
  } = useMarketplace();

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<string>('');

  const pendingApprovals = bookings.filter(
    (b) =>
      b.status === 'pending_approval' &&
      Boolean(user && (isAdmin || b.hostUid === user.uid)),
  );

  const totalEnergySupplied = chargers.reduce((acc, c) => acc + c.totalEnergyKwh, 0);
  const totalEarningsInr = chargers.reduce(
    (acc, c) => acc + c.totalEnergyKwh * c.pricePerKwh * 0.92,
    0,
  );
  const activeBaysCount = chargers.filter((c) => c.status !== 'maintenance').length;
  const avgRating =
    chargers.length > 0
      ? chargers.reduce((acc, c) => acc + c.hostRating, 0) / chargers.length
      : 4.9;

  const startEditPrice = (id: string, currentPrice: number) => {
    setEditingPriceId(id);
    setDraftPrice(currentPrice.toFixed(2));
  };

  const commitEditPrice = (id: string) => {
    const parsed = Number(draftPrice);
    if (!Number.isNaN(parsed) && parsed > 0) {
      void updateChargerPrice(id, parsed);
    }
    setEditingPriceId(null);
  };

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 pb-24 md:pb-10">
      {/* Header Row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A] md:text-3xl">
            Community Host Operations Console
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Monitor bay payouts, adjust per-kWh tariffs, and approve incoming driver requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user && (
            <button
              type="button"
              onClick={() => void resetDemoData()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Sync Seed Bays</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddChargerOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#059669] px-4 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Charging Bay</span>
          </button>
        </div>
      </div>

      {/* Auth Banner for Host Actions */}
      {!user && (
        <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-[#2563EB]/25 bg-[#EFF6FF] p-4 sm:flex-row sm:items-center">
          <div className="text-xs sm:text-sm text-[#0F172A]">
            <span className="font-semibold">Sign in as a Host:</span>{' '}
            <span className="text-[#475569]">
              Authenticate with Google to publish charging bays, adjust live tariffs, and approve driver bookings.
            </span>
          </div>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => void signInWithGoogle()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{authBusy ? 'Signing in...' : 'Sign In with Google'}</span>
          </button>
        </div>
      )}

      {/* 4-Column KPI Summary Strip */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Gross Network Payout</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            ₹{Math.round(totalEarningsInr).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs font-medium text-[#059669] tabular-nums">
            92% host share settled via UPI
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Energy Supplied</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            {totalEnergySupplied.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-medium text-[#64748B]">kWh</span>
          </div>
          <div className="mt-1 text-xs text-[#475569]">Across 4 Indian metro grids</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Online Charging Bays</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            {activeBaysCount} / {chargers.length}
          </div>
          <div className="mt-1 text-xs text-[#475569]">Real-time telemetry synced</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Average Host Rating</div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            <span>{avgRating.toFixed(2)}</span>
            <Star className="h-5 w-5 fill-[#D97706] text-[#D97706]" />
          </div>
          <div className="mt-1 text-xs text-[#475569]">Verified residential &amp; hub hosts</div>
        </div>
      </div>

      {/* Pending Driver Approval Requests */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#D97706]" />
          <h2 className="font-display text-lg font-semibold text-[#0F172A]">
            Pending Slot Requests ({pendingApprovals.length})
          </h2>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-5 text-sm text-[#475569]">
            {user
              ? 'All incoming driver requests for your bays have been processed. Instant-book stations confirm automatically.'
              : 'Sign in with Google to review incoming reservation requests for your listed charging bays.'}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-[#D97706]/35 bg-[#FFFBEB]/60 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#B45309]">
                    Approval Needed · {req.scheduledSlot}
                  </div>
                  <div className="mt-0.5 font-display text-base font-semibold text-[#0F172A] truncate">
                    {req.driverName} · {req.vehicleModel}
                  </div>
                  <div className="text-xs text-[#475569] tabular-nums">
                    {req.stationName} · {req.targetKwh} kWh · Est. ₹
                    {req.estimatedTotalInr.toFixed(2)}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void approveBooking(req.id)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#059669] px-3.5 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void declineBooking(req.id)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charger Fleet Operations Table */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-[#0F172A]">
          Charger Fleet &amp; Live Tariffs ({chargers.length})
        </h2>

        <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                <tr>
                  <th className="px-4 py-3">Station &amp; Locality</th>
                  <th className="px-4 py-3">Hardware</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Tariff (₹/kWh)</th>
                  <th className="px-4 py-3">Bay Status</th>
                  <th className="px-4 py-3 text-right">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {chargers.map((station) => {
                  const canManage = Boolean(
                    user && station.hostUid && (isAdmin || station.hostUid === user.uid),
                  );

                  return (
                    <tr key={station.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0F172A]">{station.name}</span>
                          {canManage ? (
                            <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[10px] font-semibold text-[#047857]">
                              Your Bay
                            </span>
                          ) : (
                            <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">
                              Network
                            </span>
                          )}
                        </div>
                        <div className="text-[#64748B]">
                          {CITY_MAP_META[station.city].name} · {station.locality}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#334155] tabular-nums">
                        <span className="font-medium text-[#0F172A]">{station.connectorType}</span>
                        {' · '}
                        {station.powerKw} kW {station.isFastDc ? 'DC' : 'AC'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#0F172A] tabular-nums">
                        {station.totalSessions}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canManage ? (
                          editingPriceId === station.id ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="6"
                                max="45"
                                value={draftPrice}
                                onChange={(e) => setDraftPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEditPrice(station.id);
                                  if (e.key === 'Escape') setEditingPriceId(null);
                                }}
                                autoFocus
                                className="h-8 w-20 rounded-md border border-[#2563EB] px-2 text-right font-mono text-xs font-semibold text-[#0F172A] tabular-nums focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => commitEditPrice(station.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#059669] text-white cursor-pointer"
                                aria-label="Save tariff"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditPrice(station.id, station.pricePerKwh)}
                              className="rounded-md border border-transparent px-2 py-1 font-mono font-bold text-[#0F172A] tabular-nums hover:border-[#CBD5E1] hover:bg-[#F8FAFC] cursor-pointer"
                              title="Click to adjust per-kWh tariff"
                            >
                              ₹{station.pricePerKwh.toFixed(2)}
                            </button>
                          )
                        ) : (
                          <span className="font-mono font-semibold text-[#475569] tabular-nums">
                            ₹{station.pricePerKwh.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <select
                            value={station.status}
                            onChange={(e) =>
                              void toggleChargerStatus(station.id, e.target.value as ChargerStatus)
                            }
                            aria-label={`Change status for ${station.name}`}
                            className={`h-8 rounded-lg border px-2.5 text-xs font-semibold focus:outline-none cursor-pointer ${
                              station.status === 'available'
                                ? 'border-[#059669]/40 bg-[#ECFDF5] text-[#047857]'
                                : station.status === 'occupied'
                                  ? 'border-[#2563EB]/40 bg-[#EFF6FF] text-[#1D4ED8]'
                                  : station.status === 'high_demand'
                                    ? 'border-[#D97706]/40 bg-[#FFFBEB] text-[#B45309]'
                                    : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            <option value="available">Available</option>
                            <option value="occupied">In Session</option>
                            <option value="high_demand">High Demand</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-semibold ${
                              station.status === 'available'
                                ? 'border-[#059669]/30 bg-[#ECFDF5] text-[#047857]'
                                : station.status === 'occupied'
                                  ? 'border-[#2563EB]/30 bg-[#EFF6FF] text-[#1D4ED8]'
                                  : station.status === 'high_demand'
                                    ? 'border-[#D97706]/30 bg-[#FFFBEB] text-[#B45309]'
                                    : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            {station.status === 'available'
                              ? 'Available'
                              : station.status === 'occupied'
                                ? 'In Session'
                                : station.status === 'high_demand'
                                  ? 'High Demand'
                                  : 'Maintenance'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setCity(station.city);
                            setSelectedStationId(station.id);
                            setActiveTab('discover');
                          }}
                          className="font-semibold text-[#2563EB] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Locate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
