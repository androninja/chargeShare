import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  BatteryCharging,
  CalendarClock,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { EV_VEHICLE_PRESETS, STATION_IMAGES } from '../data/seedData';
import { calculateBilling, useMarketplace } from '../context/MarketplaceContext';
import { Booking } from '../types/marketplace';
import { ResilientImage } from './ResilientImage';

const TIME_SLOTS = ['Now (Instant)', 'Today · 17:30', 'Today · 19:00', 'Tomorrow · 08:30'];
const DURATION_PRESETS = [15, 30, 60, 90];

export function BookingDrawer() {
  const {
    user,
    userProfile,
    authBusy,
    chargers,
    drawerStationId,
    closeBookingDrawer,
    createBooking,
    startChargingFromBooking,
    setActiveTab,
  } = useMarketplace();

  const station = chargers.find((c) => c.id === drawerStationId) ?? null;

  const [vehicleModel, setVehicleModel] = useState(EV_VEHICLE_PRESETS[0].name);
  const [scheduledSlot, setScheduledSlot] = useState(TIME_SLOTS[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setConfirmedBooking(null);
    setSubmitting(false);
    if (station) {
      setDurationMinutes(station.isFastDc ? 30 : 60);
      setScheduledSlot(TIME_SLOTS[0]);
      if (
        userProfile?.evVehicle &&
        EV_VEHICLE_PRESETS.some((v) => v.name === userProfile.evVehicle)
      ) {
        setVehicleModel(userProfile.evVehicle);
      }
    }
  }, [station?.id, userProfile?.evVehicle]);

  if (!station) return null;

  const selectedVehicle =
    EV_VEHICLE_PRESETS.find((v) => v.name === vehicleModel) ?? EV_VEHICLE_PRESETS[0];

  // Effective charging power is constrained by both the charger output and the vehicle's max acceptance rate
  const effectivePowerKw = Math.min(station.powerKw, selectedVehicle.maxAcceptKw);
  // Apply realistic ~92% average charging curve efficiency across the session window
  const rawEstimatedKwh = (durationMinutes / 60) * effectivePowerKw * 0.92;
  const estimatedKwh = Number(
    Math.max(0.5, Math.min(selectedVehicle.batteryKwh, rawEstimatedKwh)).toFixed(2),
  );
  const approxChargePercent = Math.min(
    100,
    Math.round((estimatedKwh / selectedVehicle.batteryKwh) * 100),
  );
  const isVehicleLimited = station.powerKw > selectedVehicle.maxAcceptKw;

  const billing = calculateBilling(estimatedKwh, station.pricePerKwh);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await createBooking({
        stationId: station.id,
        vehicleModel,
        scheduledSlot,
        targetKwh: estimatedKwh,
      });
      if (created) {
        setConfirmedBooking(created);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40 backdrop-blur-[2px]">
      <div
        className="fixed inset-0"
        onClick={closeBookingDrawer}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Book charging slot at ${station.name}`}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-[0_12px_32px_-4px_rgba(15,23,42,0.18)]"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[#059669]">
              {station.instantBook ? 'Instant Confirmation Available' : 'Host Approval Required'}
            </div>
            <h2 className="font-display text-lg font-bold text-[#0F172A] truncate">
              {station.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeBookingDrawer}
            aria-label="Close booking drawer"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="volt-scroll flex-1 overflow-y-auto px-5 py-5">
          {/* Station Photo */}
          <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
            <ResilientImage
              src={station.imageUrl}
              alt={`${station.name} EV charging bay`}
              fallbackTitle={station.name}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          {/* Address & Host Row */}
          <div className="mt-4 flex items-start justify-between gap-4 border-b border-[#F1F5F9] pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                <span>{station.address}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <ResilientImage
                  src={station.hostAvatarUrl ?? STATION_IMAGES.hostPortrait}
                  alt={station.hostName}
                  className="h-8 w-8 rounded-full border border-[#E2E8F0] object-cover"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1 font-semibold text-[#0F172A]">
                    <span>Hosted by {station.hostName}</span>
                    {station.hostVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-[#059669]" />
                    )}
                  </div>
                  <div className="text-[#64748B] tabular-nums">
                    Since {station.hostSince} · ★ {station.hostRating.toFixed(1)} ({station.reviewCount} reviews)
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="font-mono text-xl font-bold text-[#0F172A] tabular-nums">
                ₹{station.pricePerKwh.toFixed(2)}
              </div>
              <div className="text-xs text-[#64748B]">per kWh</div>
            </div>
          </div>

          {/* Technical Specs & Effective Vehicle Rate */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-b border-[#F1F5F9] pb-4 text-center">
            <div className="rounded-lg bg-[#F8FAFC] p-2.5">
              <div className="text-[11px] font-medium text-[#64748B]">Connector</div>
              <div className="mt-0.5 text-sm font-semibold text-[#0F172A]">
                {station.connectorType}
              </div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] p-2.5">
              <div className="text-[11px] font-medium text-[#64748B]">Bay Output</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                {station.powerKw} kW {station.isFastDc ? 'DC' : 'AC'}
              </div>
            </div>
            <div className="rounded-lg bg-[#ECFDF5] p-2.5">
              <div className="text-[11px] font-medium text-[#047857]">Est. Charge</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-[#047857] tabular-nums">
                +~{approxChargePercent}%
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569]">
            {station.amenities.map((amenity, i) => (
              <span key={amenity} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-[#CBD5E1]">·</span>}
                <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          {/* Confirmed State vs Booking Form */}
          {confirmedBooking ? (
            <div className="mt-6 rounded-xl border border-[#059669]/30 bg-[#ECFDF5] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    {confirmedBooking.status === 'confirmed'
                      ? 'Slot Reserved & Bay Unlocked'
                      : 'Request Sent to Host'}
                  </h3>
                  <p className="mt-1 text-xs text-[#334155]">
                    Booking ID <span className="font-mono font-semibold">{confirmedBooking.id}</span> ·{' '}
                    {confirmedBooking.scheduledSlot} · {durationMinutes} mins (+~{approxChargePercent}% /{' '}
                    {confirmedBooking.targetKwh} kWh)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {confirmedBooking.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => startChargingFromBooking(confirmedBooking.id)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Plug In &amp; Start Live Session</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeBookingDrawer();
                    setActiveTab('trips');
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  View in Trips
                </button>
              </div>
            </div>
          ) : (
            <form id="booking-form" onSubmit={handleConfirm} className="mt-5 space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label
                  htmlFor="vehicle-select"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Select EV Vehicle
                </label>
                <select
                  id="vehicle-select"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                >
                  {EV_VEHICLE_PRESETS.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.batteryKwh} kWh · max {v.maxAcceptKw} kW)
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selection */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                  <CalendarClock className="h-3.5 w-3.5 text-[#475569]" />
                  <span>Arrival Slot</span>
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledSlot(slot)}
                      className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
                        scheduledSlot === slot
                          ? 'border-[#059669] bg-[#059669]/10 font-semibold text-[#047857]'
                          : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#94A3B8]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes of Charging Input */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="charging-minutes-input"
                    className="text-xs font-semibold text-[#0F172A]"
                  >
                    Charging Duration
                  </label>
                  <div className="flex items-center gap-1.5">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDurationMinutes(preset)}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums cursor-pointer ${
                          durationMinutes === preset
                            ? 'border-[#059669] bg-[#ECFDF5] text-[#047857]'
                            : 'border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]'
                        }`}
                      >
                        {preset} min
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="charging-minutes-input"
                    type="number"
                    min={10}
                    max={480}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Math.max(10, Math.min(480, Number(e.target.value) || 10)))
                    }
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pr-14 pl-3 font-mono text-sm font-semibold text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/15"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-[#64748B]">
                    mins
                  </span>
                </div>
              </div>

              {/* Approximate Battery Charge Estimate Card */}
              <div className="rounded-xl border border-[#059669]/30 bg-[#ECFDF5]/60 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <BatteryCharging className="h-4 w-4 text-[#059669]" />
                    <span>Approx. Battery Added</span>
                  </div>
                  <span className="font-mono text-base font-bold text-[#047857] tabular-nums">
                    +~{approxChargePercent}%
                  </span>
                </div>

                {/* Progress Bar Preview */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#D1FAE5]">
                  <div
                    className="h-full rounded-full bg-[#059669] transition-all duration-300"
                    style={{ width: `${Math.max(4, approxChargePercent)}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#334155] tabular-nums">
                  <span>
                    {selectedVehicle.name} ({selectedVehicle.batteryKwh} kWh pack)
                  </span>
                  <span className="font-mono font-medium">
                    {effectivePowerKw.toFixed(1)} kW · ~{estimatedKwh.toFixed(1)} kWh
                  </span>
                </div>

                {isVehicleLimited && (
                  <div className="mt-1.5 text-[11px] font-medium text-[#2563EB]">
                    Adapted to your vehicle&apos;s {selectedVehicle.maxAcceptKw} kW max charge rate (bay supports {station.powerKw} kW).
                  </div>
                )}
              </div>

              {/* Transparent Billing Breakdown */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2 text-xs">
                <div className="font-semibold text-[#0F172A]">Transparent Cost Estimate</div>
                <div className="flex items-center justify-between text-[#475569] tabular-nums">
                  <span>
                    Est. Energy (~{estimatedKwh.toFixed(1)} kWh × ₹{station.pricePerKwh.toFixed(2)})
                  </span>
                  <span className="font-mono font-medium text-[#0F172A]">
                    ₹{billing.energyChargeInr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#475569] tabular-nums">
                  <span>chargeShare Platform Fee</span>
                  <span className="font-mono font-medium text-[#0F172A]">
                    ₹{billing.platformFeeInr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#475569] tabular-nums">
                  <span>GST (18% on Platform Fee)</span>
                  <span className="font-mono font-medium text-[#0F172A]">
                    ₹{billing.gstInr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2 text-sm font-bold text-[#0F172A] tabular-nums">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base">₹{billing.totalInr.toFixed(2)}</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Footer CTA */}
        {!confirmedBooking && (
          <div className="border-t border-[#E2E8F0] bg-white px-5 py-4 space-y-2">
            {!user && (
              <p className="text-center text-[11px] text-[#475569]">
                You&apos;ll sign in with Google to save your booking &amp; GST receipt.
              </p>
            )}
            <button
              type="submit"
              form="booking-form"
              disabled={submitting || authBusy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#059669] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#047857] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 cursor-pointer"
            >
              <Star className="h-4 w-4" />
              <span>
                {submitting || authBusy
                  ? 'Confirming...'
                  : station.instantBook
                    ? `Confirm ${durationMinutes} min Slot · ₹${billing.totalInr.toFixed(2)}`
                    : `Request ${durationMinutes} min Slot · ₹${billing.totalInr.toFixed(2)}`}
              </span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
