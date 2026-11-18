import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellRing,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  usePriceAlerts,
} from '@/hooks/usePriceAlerts';
import { COMPREHENSIVE_COINS, CryptoCoin } from '@/data/cryptoList';
import { SearchableCoinSelect } from '@/components/SearchableCoinSelect';

interface PriceAlertDialogProps {
  trigger?: React.ReactNode;
}

export function PriceAlertDialog({ trigger }: PriceAlertDialogProps = {}) {
  const {
    alerts,
    activeCount,
    permission,
    requestNotificationPermission,
    addAlert,
    removeAlert,
    clearAllAlerts,
  } = usePriceAlerts();

  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('70000');
  const [open, setOpen] = useState(false);

  const selectedCoin =
    COMPREHENSIVE_COINS.find((c) => c.id === selectedCoinId) ||
    COMPREHENSIVE_COINS[0];

  const handleSelectCoin = (coin: CryptoCoin) => {
    setSelectedCoinId(coin.id);
    const defaultTarget =
      condition === 'ABOVE'
        ? Math.round(coin.currentPrice * 1.05 * 100) / 100
        : Math.round(coin.currentPrice * 0.95 * 100) / 100;
    setTargetPrice(defaultTarget.toString());
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    addAlert(
      selectedCoin.id,
      selectedCoin.symbol,
      selectedCoin.name,
      priceNum,
      condition
    );
  };

  const setOffsetPercentage = (pct: number) => {
    const newPrice = Math.round(selectedCoin.currentPrice * (1 + pct / 100) * 100) / 100;
    setTargetPrice(newPrice.toString());
    if (pct > 0) setCondition('ABOVE');
    else setCondition('BELOW');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="relative border-gray-800 bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white px-3 flex items-center gap-1.5 transition-all"
          >
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline text-xs font-medium">Alerts</span>
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm shadow-red-500/50">
                {activeCount}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-gray-950 border border-gray-800 text-white shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Price Alerts Engine
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Receive instant in-app alerts and native desktop push notifications.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Desktop notification banner if not enabled */}
        {permission !== 'granted' && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-yellow-500/30 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-yellow-400">Enable Desktop Push:</span> Get notified even when this browser tab is minimized.
            </div>
            <Button
              size="sm"
              onClick={requestNotificationPermission}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs h-7 px-3 shrink-0"
            >
              Enable
            </Button>
          </div>
        )}

        {/* Create Alert Form */}
        <form onSubmit={handleCreateAlert} className="space-y-4 pt-2">
          {/* Searchable Coin Selector (60+ Coins) */}
          <SearchableCoinSelect
            selectedCoinId={selectedCoinId}
            onSelectCoin={handleSelectCoin}
            label="1. Select Cryptocurrency (60+ Available)"
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Condition selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                2. Condition
              </label>
              <div className="flex rounded-lg border border-gray-800 bg-gray-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    condition === 'ABOVE'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Rises Above (≥)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    condition === 'BELOW'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Drops Below (≤)</span>
                </button>
              </div>
            </div>

            {/* Target price input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                3. Target Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">$</span>
                <Input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Target price"
                  className="pl-7 bg-gray-900 border-gray-800 text-white text-xs h-9 focus:border-yellow-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">Presets:</span>
            <button
              type="button"
              onClick={() => setOffsetPercentage(5)}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800"
            >
              +5%
            </button>
            <button
              type="button"
              onClick={() => setOffsetPercentage(10)}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-emerald-400 hover:bg-gray-800"
            >
              +10%
            </button>
            <button
              type="button"
              onClick={() => setOffsetPercentage(-5)}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-red-400 hover:bg-gray-800"
            >
              -5%
            </button>
            <button
              type="button"
              onClick={() => setOffsetPercentage(-10)}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-red-400 hover:bg-gray-800"
            >
              -10%
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold text-xs h-9"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Set Live Price Alert
          </Button>
        </form>

        {/* Current Alerts List */}
        <div className="mt-6 pt-4 border-t border-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Active Alerts ({alerts.length})
            </h4>
            {alerts.length > 0 && (
              <button
                type="button"
                onClick={clearAllAlerts}
                className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No active price alerts. Choose a coin above to set one.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    alert.triggered
                      ? 'border-gray-800 bg-gray-900/30 opacity-60'
                      : 'border-gray-800/80 bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        alert.condition === 'ABOVE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {alert.condition === 'ABOVE' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {alert.symbol}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {alert.condition === 'ABOVE' ? '≥' : '≤'} $
                          {alert.targetPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        {alert.triggered ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Triggered</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span>Monitoring live...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAlert(alert.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
