import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Leaf,
  LogIn,
  MapPin,
  Receipt as ReceiptIcon,
  X,
  Zap,
} from 'lucide-react';
import { EV_VEHICLE_PRESETS } from '../data/seedData';
import { useMarketplace } from '../context/MarketplaceContext';
import { Receipt } from '../types/marketplace';

function formatShortDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export function TripsView() {
  const {
    user,
    authBusy,
    signInWithGoogle,
    bookings,
    receipts,
    cancelBooking,
    startChargingFromBooking,
    setActiveTab,
    setSelectedStationId,
    setCity,
  } = useMarketplace();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const activeBookings = bookings.filter(
    (b) =>
      (b.status === 'confirmed' || b.status === 'pending_approval' || b.status === 'in_session') &&
      (!user || b.driverUid === user.uid),
  );

  const totalEnergy = receipts.reduce((acc, r) => acc + r.energyKwh, 0);
  const totalSpent = receipts.reduce((acc, r) => acc + r.totalPaidInr, 0);
  const totalCo2 = receipts.reduce((acc, r) => acc + r.co2SavedKg, 0);

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 pb-24 md:pb-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] md:text-3xl">
          Trips &amp; Tax Receipts
        </h1>
        <p className="mt-1 text-sm text-[#475569]">
          Manage upcoming charging reservations and inspect itemized GST invoices.
        </p>
      </div>

      {!user && (
        <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-[#2563EB]/25 bg-[#EFF6FF] p-4 sm:flex-row sm:items-center">
          <div className="text-xs sm:text-sm text-[#0F172A]">
            <span className="font-semibold">Sync your charging history:</span>{' '}
            <span className="text-[#475569]">
              Sign in with Google to access your reservations and GST tax invoices from any device.
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

      {/* Lifetime Driver Summary Strip */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Total Energy Charged</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            {totalEnergy.toFixed(1)} <span className="text-sm font-medium text-[#64748B]">kWh</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="text-xs font-medium text-[#64748B]">Total Settled via UPI</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            ₹{totalSpent.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#047857]">
            <Leaf className="h-3.5 w-3.5" />
            <span>Estimated Tailpipe CO₂ Saved</span>
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#047857] tabular-nums">
            {totalCo2.toFixed(1)} <span className="text-sm font-medium">kg</span>
          </div>
        </div>
      </div>

      {/* Upcoming & Pending Reservations */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-[#0F172A]">
          Active Reservations ({activeBookings.length})
        </h2>

        {activeBookings.length === 0 ? (
          <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-6 text-center">
            <p className="text-sm text-[#475569]">No upcoming reservations scheduled.</p>
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="mt-3 h-9 rounded-lg bg-[#059669] px-4 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
            >
              Find a Charger
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeBookings.map((booking) => (
              <article
                key={booking.id}
                className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {booking.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 text-[#047857]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed
                          </span>
                        )}
                        {booking.status === 'pending_approval' && (
                          <span className="inline-flex items-center gap-1 text-[#B45309]">
                            <Clock className="h-3.5 w-3.5" />
                            Awaiting Host Approval
                          </span>
                        )}
                        {booking.status === 'in_session' && (
                          <span className="inline-flex items-center gap-1 text-[#2563EB]">
                            <Zap className="h-3.5 w-3.5" />
                            In Session
                          </span>
                        )}
                        <span className="text-[#CBD5E1]">·</span>
                        <span className="font-mono text-[#64748B]">{booking.id}</span>
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold text-[#0F172A]">
                        {booking.stationName}
                      </h3>
                      <p className="text-xs text-[#475569]">
                        {booking.locality} · {booking.scheduledSlot} · {booking.vehicleModel}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-mono text-base font-bold text-[#0F172A]">
                        ₹{booking.estimatedTotalInr.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {(() => {
                          const veh = EV_VEHICLE_PRESETS.find((v) => v.name === booking.vehicleModel);
                          const effKw = Math.min(booking.powerKw, veh?.maxAcceptKw ?? booking.powerKw);
                          const mins = Math.max(10, Math.round((booking.targetKwh / (effKw * 0.92)) * 60));
                          const pct = veh
                            ? Math.min(100, Math.round((booking.targetKwh / veh.batteryKwh) * 100))
                            : null;
                          return pct !== null ? `~${mins} min (+~${pct}%)` : `~${mins} min`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F1F5F9] pt-3">
                  {booking.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => startChargingFromBooking(booking.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#059669] px-3.5 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Start Charging</span>
                    </button>
                  )}
                  {booking.status === 'in_session' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('live')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Open Telemetry</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCity(booking.city);
                      setSelectedStationId(booking.stationId);
                      setActiveTab('discover');
                    }}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>View on Map</span>
                  </button>
                  {booking.status !== 'in_session' && (
                    <button
                      type="button"
                      onClick={() => cancelBooking(booking.id)}
                      className="ml-auto h-9 rounded-lg px-3 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Completed Sessions & GST Invoices */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-[#0F172A]">
          Completed Sessions & Receipts ({receipts.length})
        </h2>

        <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                <tr>
                  <th className="px-4 py-3">Invoice & Date</th>
                  <th className="px-4 py-3">Station & Connector</th>
                  <th className="px-4 py-3 text-right">Energy</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {receipts.map((rc) => (
                  <tr key={rc.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-[#0F172A]">
                        {rc.invoiceNumber}
                      </div>
                      <div className="text-[#64748B]">
                        {new Date(rc.sessionDateIso).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0F172A]">{rc.stationName}</div>
                      <div className="text-[#64748B]">
                        {rc.locality} · {rc.connectorType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                      {rc.energyKwh.toFixed(2)} kWh
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#475569] tabular-nums">
                      {formatShortDuration(rc.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#0F172A] tabular-nums">
                      ₹{rc.totalPaidInr.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(rc)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#059669]" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tax invoice ${selectedReceipt.invoiceNumber}`}
            className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5 text-[#059669]" />
                <div>
                  <div className="font-mono text-xs font-semibold text-[#059669]">
                    {selectedReceipt.invoiceNumber}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">
                    chargeShare GST Tax Receipt
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                aria-label="Close receipt modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 border-y border-[#F1F5F9] py-3 text-xs space-y-1 text-[#475569]">
              <div className="font-semibold text-[#0F172A]">{selectedReceipt.stationName}</div>
              <div>Host: {selectedReceipt.hostName} · {selectedReceipt.locality}</div>
              <div>
                Vehicle: {selectedReceipt.vehicleModel} ({selectedReceipt.connectorType})
              </div>
              <div>Payment: {selectedReceipt.paymentMethod}</div>
            </div>

            <div className="mt-4 space-y-2 text-xs tabular-nums">
              <div className="flex justify-between text-[#475569]">
                <span>
                  Energy Supplied ({selectedReceipt.energyKwh.toFixed(2)} kWh × ₹
                  {selectedReceipt.ratePerKwh.toFixed(2)})
                </span>
                <span className="font-mono font-medium text-[#0F172A]">
                  ₹{selectedReceipt.energyChargeInr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Platform Convenience Fee</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  ₹{selectedReceipt.platformFeeInr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>GST (18% on Fee)</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  ₹{selectedReceipt.gstInr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E2E8F0] pt-2.5 text-sm font-bold text-[#0F172A]">
                <span>Total Paid</span>
                <span className="font-mono text-base">
                  ₹{selectedReceipt.totalPaidInr.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="h-9 rounded-lg bg-[#059669] px-4 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
