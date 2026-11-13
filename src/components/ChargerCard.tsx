import { BadgeCheck, Clock, Plug, ShieldAlert, Star, Wrench, Zap } from 'lucide-react';
import { ChargerStation } from '../types/marketplace';

interface ChargerCardProps {
  station: ChargerStation;
  isSelected: boolean;
  onSelect: () => void;
  onBook: () => void;
}

function getStatusMeta(status: ChargerStation['status']) {
  switch (status) {
    case 'available':
      return {
        label: 'Available',
        textClass: 'text-[#047857]',
        icon: <Zap className="h-3.5 w-3.5 text-[#059669]" />,
      };
    case 'occupied':
      return {
        label: 'In Session',
        textClass: 'text-[#1D4ED8]',
        icon: <Clock className="h-3.5 w-3.5 text-[#2563EB]" />,
      };
    case 'high_demand':
      return {
        label: 'High Demand',
        textClass: 'text-[#B45309]',
        icon: <ShieldAlert className="h-3.5 w-3.5 text-[#D97706]" />,
      };
    case 'maintenance':
      return {
        label: 'Maintenance',
        textClass: 'text-[#64748B]',
        icon: <Wrench className="h-3.5 w-3.5 text-[#64748B]" />,
      };
  }
}

export function ChargerCard({ station, isSelected, onSelect, onBook }: ChargerCardProps) {
  const statusMeta = getStatusMeta(station.status);

  return (
    <article
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border bg-white p-4 transition-colors duration-150 ${
        isSelected
          ? 'border-[#2563EB] ring-2 ring-[#2563EB]/15'
          : 'border-[#E2E8F0] hover:border-[#94A3B8]'
      }`}
    >
      {/* Top Split Row: Connector + Station & Verified Host on left | Tabular Price on right */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
            <Plug className="h-3.5 w-3.5 shrink-0 text-[#0F172A]" />
            <span>{station.connectorType}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{station.locality}</span>
          </div>

          <h3 className="mt-1 font-display text-base font-semibold text-[#0F172A] leading-snug truncate">
            {station.name}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#475569]">
            <span className="truncate">{station.hostName}</span>
            {station.hostVerified && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 text-[#059669]"
                aria-label="Verified host"
              />
            )}
          </div>
        </div>

        {/* Right: Tabular monetary rate in high-contrast slate */}
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-bold tracking-tight text-[#0F172A] tabular-nums">
            ₹{station.pricePerKwh.toFixed(2)}
          </div>
          <div className="text-[11px] font-medium text-[#64748B]">per kWh</div>
        </div>
      </div>

      {/* Bottom Strip: Unboxed metadata with typographic separators + explicit status text/icon */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] tabular-nums">
          <span className={`inline-flex items-center gap-1 font-semibold ${statusMeta.textClass}`}>
            {statusMeta.icon}
            {statusMeta.label}
          </span>
          <span aria-hidden="true" className="text-[#CBD5E1]">
            ·
          </span>
          <span>{station.distanceKm.toFixed(1)} km</span>
          <span aria-hidden="true" className="text-[#CBD5E1]">
            ·
          </span>
          <span className="font-medium text-[#0F172A]">
            {station.powerKw} kW {station.isFastDc ? 'DC' : 'AC'}
          </span>
          <span aria-hidden="true" className="text-[#CBD5E1]">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-[#0F172A]">
            <Star className="h-3.5 w-3.5 fill-[#D97706] text-[#D97706]" />
            {station.hostRating.toFixed(1)}
            <span className="text-[#64748B]">({station.reviewCount})</span>
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          disabled={station.status === 'maintenance'}
          className={`h-9 rounded-lg px-3.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
            station.status === 'maintenance'
              ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
              : 'bg-[#059669] text-white hover:bg-[#047857]'
          }`}
        >
          {station.status === 'maintenance' ? 'Offline' : 'Book Slot'}
        </button>
      </div>
    </article>
  );
}
