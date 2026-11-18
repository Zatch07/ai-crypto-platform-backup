import { Bell } from 'lucide-react';
import { PriceAlertDialog } from '@/components/PriceAlertDialog';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

export function PriceAlertFloatingButton() {
  const { activeCount } = usePriceAlerts();

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50">
      <PriceAlertDialog
        trigger={
          <button
            type="button"
            aria-label="Price Alerts"
            className="relative flex items-center justify-center h-13 w-13 p-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-2xl shadow-yellow-500/50 border border-yellow-300/50 hover:scale-105 active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5 text-black" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md">
                {activeCount}
              </span>
            )}
          </button>
        }
      />
    </div>
  );
}
