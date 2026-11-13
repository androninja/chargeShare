import { useState } from 'react';
import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  Lock,
  LockOpen,
  Pause,
  Play,
  ShieldCheck,
  Square,
  Zap,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

function formatDuration(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

const UPI_METHODS = ['UPI · Google Pay', 'UPI · PhonePe', 'BHIM UPI', 'UPI · Paytm'];

export function LiveSessionView() {
  const {
    activeSession,
    startQuickDemoSession,
    toggleCableLock,
    toggleSessionPause,
    updateTargetSoc,
    stopAndPaySession,
    setActiveTab,
  } = useMarketplace();

  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [upiMethod, setUpiMethod] = useState(UPI_METHODS[0]);

  if (!activeSession) {
    return (
      <section className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 pb-24 md:pb-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
            <BatteryCharging className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#0F172A]">
            No Active Charging Session
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Reserve a verified community or fast DC bay from the Discover map, or launch an instant
            live telemetry simulation to inspect real-time kW delivery, cable lock controls, and UPI
            billing.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startQuickDemoSession}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Start Live Telemetry Session</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-5 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Browse Chargers on Map
            </button>
          </div>
        </div>
      </section>
    );
  }

  const socPercent = Math.min(100, Math.max(0, activeSession.currentSoc));
  const ringRadius = 62;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (socPercent / 100) * ringCircumference;

  // Build SVG polyline points for power delivery curve
  const history = activeSession.powerHistory;
  const maxChartKw = Math.max(activeSession.maxPowerKw, 10);
  const chartPoints = history
    .map((sample, idx) => {
      const x = history.length === 1 ? 50 : (idx / (history.length - 1)) * 280 + 10;
      const y = 92 - (sample.kw / maxChartKw) * 76;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const estCo2Saved = (activeSession.energyDeliveredKwh * 0.82).toFixed(1);
  const isTargetReached = activeSession.currentSoc >= activeSession.targetSoc;

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 pb-24 md:pb-10">
      {/* Top Session Identity & Live Connection Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" />
            <span>
              {isTargetReached
                ? 'Target SoC Reached · Ready to Unplug'
                : activeSession.isPaused || !activeSession.cableLocked
                  ? 'Session Paused'
                  : 'Live Telematics Stream'}
            </span>
            <span aria-hidden="true" className="text-[#CBD5E1]">
              ·
            </span>
            <span className="text-[#475569]">{activeSession.connectorType}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A]">
            {activeSession.stationName}
          </h1>
          <p className="text-xs text-[#475569]">
            {activeSession.locality} · Host: {activeSession.hostName} · Vehicle:{' '}
            {activeSession.vehicleModel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Electric Blue Cable/Plug Lock Interactive Control */}
          <button
            type="button"
            onClick={toggleCableLock}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeSession.cableLocked
                ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                : 'border-[#CBD5E1] bg-white text-[#334155]'
            }`}
          >
            {activeSession.cableLocked ? (
              <Lock className="h-4 w-4 text-[#2563EB]" />
            ) : (
              <LockOpen className="h-4 w-4 text-[#64748B]" />
            )}
            <span>{activeSession.cableLocked ? 'Plug Locked' : 'Plug Unlocked'}</span>
          </button>

          <button
            type="button"
            onClick={toggleSessionPause}
            disabled={!activeSession.cableLocked || isTargetReached}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 cursor-pointer"
          >
            {activeSession.isPaused ? (
              <>
                <Play className="h-4 w-4 text-[#059669]" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-[#475569]" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#059669] px-4 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Stop & Pay via UPI</span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Telemetry Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 5 Columns: Battery SoC Ring & Target Slider */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">
              Battery State of Charge
            </h2>
            <span className="font-mono text-xs font-medium text-[#475569] tabular-nums">
              {activeSession.batteryCapacityKwh} kWh pack
            </span>
          </div>

          <div className="my-6 flex items-center justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <svg className="h-44 w-44 -rotate-90" viewBox="0 0 150 150">
                <circle
                  cx="75"
                  cy="75"
                  r={ringRadius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="12"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={ringRadius}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="font-mono text-3xl font-bold text-[#0F172A] tabular-nums">
                  {activeSession.currentSoc.toFixed(1)}%
                </div>
                <div className="mt-0.5 text-xs font-medium text-[#475569] tabular-nums">
                  Target {activeSession.targetSoc}%
                </div>
              </div>
            </div>
          </div>

          {/* Target SoC Limit Slider */}
          <div className="border-t border-[#F1F5F9] pt-4">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="soc-slider" className="font-semibold text-[#0F172A]">
                Auto-Stop Target Limit
              </label>
              <span className="font-mono font-bold text-[#2563EB] tabular-nums">
                {activeSession.targetSoc}%
              </span>
            </div>
            <input
              id="soc-slider"
              type="range"
              min={50}
              max={100}
              step={5}
              value={activeSession.targetSoc}
              onChange={(e) => updateTargetSoc(Number(e.target.value))}
              className="mt-2 w-full accent-[#2563EB] cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[#64748B] tabular-nums">
              <span>50%</span>
              <span>80% (Optimal)</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Real-Time Metrics + SVG Power Curve */}
        <div className="lg:col-span-7 space-y-6">
          {/* 4-Metric Telemetry Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="text-xs font-medium text-[#64748B]">Live Power</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                {activeSession.livePowerKw.toFixed(1)}
                <span className="ml-1 text-xs font-semibold text-[#64748B]">kW</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="text-xs font-medium text-[#64748B]">Delivered</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                {activeSession.energyDeliveredKwh.toFixed(2)}
                <span className="ml-1 text-xs font-semibold text-[#64748B]">kWh</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="text-xs font-medium text-[#64748B]">Duration</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#0F172A] tabular-nums">
                {formatDuration(activeSession.elapsedSeconds)}
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="text-xs font-medium text-[#64748B]">Running Cost</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                ₹{activeSession.runningCostInr.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Power Delivery Curve Chart */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2563EB]" />
                <h2 className="font-display text-base font-semibold text-[#0F172A]">
                  Real-Time Power Curve (kW)
                </h2>
              </div>
              <span className="font-mono text-xs text-[#059669] font-semibold tabular-nums">
                {estCo2Saved} kg CO₂ saved
              </span>
            </div>

            <div className="mt-4 h-44 w-full">
              <svg viewBox="0 0 300 105" className="h-full w-full" aria-label="Live power delivery chart">
                <line x1="10" y1="20" x2="290" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="10" y1="56" x2="290" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="10" y1="92" x2="290" y2="92" stroke="#E2E8F0" strokeWidth="1" />

                <text x="10" y="16" fontSize="7" fill="#64748B">
                  {maxChartKw} kW
                </text>
                <text x="10" y="52" fontSize="7" fill="#64748B">
                  {(maxChartKw / 2).toFixed(0)} kW
                </text>

                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints}
                  />
                )}
              </svg>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-xs text-[#475569] tabular-nums">
              <span>Rate: ₹{activeSession.pricePerKwh.toFixed(2)} / kWh</span>
              <span>Start SoC: {activeSession.startSoc}% → Current: {activeSession.currentSoc.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Settlement Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Complete session and pay via UPI"
            className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
              <ShieldCheck className="h-4 w-4" />
              <span>Instant UPI Settlement & GST Receipt</span>
            </div>
            <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
              Complete Charging Session
            </h3>
            <p className="mt-1 text-xs text-[#475569]">
              {activeSession.stationName} · {activeSession.energyDeliveredKwh.toFixed(2)} kWh delivered
            </p>

            <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2 text-xs tabular-nums">
              <div className="flex justify-between text-[#475569]">
                <span>Energy Charge</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  ₹{activeSession.runningCostInr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Platform Fee</span>
                <span className="font-mono font-medium text-[#0F172A]">₹15.00</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>GST (18% on Fee)</span>
                <span className="font-mono font-medium text-[#0F172A]">₹2.70</span>
              </div>
              <div className="flex justify-between border-t border-[#E2E8F0] pt-2 text-sm font-bold text-[#0F172A]">
                <span>Total Payable</span>
                <span className="font-mono text-base">
                  ₹{(activeSession.runningCostInr + 17.7).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-[#0F172A]">Choose Payment Method</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {UPI_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setUpiMethod(method)}
                    className={`h-9 rounded-lg border px-3 text-xs font-medium cursor-pointer ${
                      upiMethod === method
                        ? 'border-[#059669] bg-[#ECFDF5] font-semibold text-[#047857]'
                        : 'border-[#E2E8F0] bg-white text-[#334155]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="h-10 flex-1 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Keep Charging
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutOpen(false);
                  stopAndPaySession(upiMethod);
                }}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#059669] text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Pay & Unlock Cable</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
