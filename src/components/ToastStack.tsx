import { AlertTriangle, CheckCircle2, Info, X, Zap } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export function ToastStack() {
  const { toasts, dismissToast } = useMarketplace();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 bottom-18 z-50 flex w-full max-w-sm flex-col gap-2 md:bottom-5"
    >
      {toasts.map((toast) => {
        const icon =
          toast.tone === 'emerald' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" />
          ) : toast.tone === 'blue' ? (
            <Zap className="h-4 w-4 shrink-0 text-[#2563EB]" />
          ) : toast.tone === 'amber' ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-[#475569]" />
          );

        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.14)]"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#0F172A]">{toast.title}</div>
              {toast.description && (
                <div className="mt-0.5 text-xs text-[#475569]">{toast.description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
