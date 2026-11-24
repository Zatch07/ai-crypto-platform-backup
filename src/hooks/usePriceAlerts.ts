import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { COMPREHENSIVE_COINS } from '@/data/cryptoList';

export interface PriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

const STORAGE_KEY = 'coin_rich_price_alerts';

// Fallback prices for all 60+ supported coins if CoinGecko is throttled
const DEFAULT_COIN_PRICES: Record<string, number> = COMPREHENSIVE_COINS.reduce(
  (acc, c) => {
    acc[c.id] = c.currentPrice;
    return acc;
  },
  {} as Record<string, number>
);

export const POPULAR_ALERT_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', defaultPrice: 67200 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', defaultPrice: 3150 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', defaultPrice: 158 },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', defaultPrice: 590 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', defaultPrice: 0.58 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', defaultPrice: 0.12 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', defaultPrice: 0.43 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', defaultPrice: 27.5 },
];

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Load alerts from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      } else {
        // Pre-seed an example alert so users immediately see how it works
        const sampleAlerts: PriceAlert[] = [
          {
            id: 'sample-btc-alert',
            coinId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            targetPrice: 70000,
            condition: 'ABOVE',
            createdAt: new Date().toISOString(),
            triggered: false,
          },
          {
            id: 'sample-eth-alert',
            coinId: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            targetPrice: 3000,
            condition: 'BELOW',
            createdAt: new Date().toISOString(),
            triggered: false,
          },
        ];
        setAlerts(sampleAlerts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleAlerts));
      }
    } catch (e) {
      console.error('Failed to parse price alerts from localStorage:', e);
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
    }
  };

  // Request browser desktop notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Desktop notifications are not supported in your browser.');
      return 'denied';
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      toast.success('Desktop notifications enabled! You will be alerted even if this tab is in the background.');
      new Notification('CryptoTracker Price Alerts', {
        body: 'Alert notifications are now active!',
        icon: '/favicon.ico',
      });
    } else {
      toast.warning('Desktop notifications were denied. In-app notifications will still work.');
    }
    return perm;
  };

  // Add a new alert
  const addAlert = (
    coinId: string,
    symbol: string,
    name: string,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW'
  ) => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      coinId,
      symbol: symbol.toUpperCase(),
      name,
      targetPrice,
      condition,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    const updated = [newAlert, ...alerts];
    saveAlerts(updated);
    toast.success(`Alert created: ${symbol.toUpperCase()} ${condition === 'ABOVE' ? '≥' : '≤'} $${targetPrice.toLocaleString()}`);
  };

  // Delete an alert
  const removeAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    saveAlerts(updated);
    toast.info('Alert removed.');
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    saveAlerts([]);
    toast.info('All alerts cleared.');
  };

  // Periodic price evaluation against active alerts
  const checkPricesAgainstAlerts = useCallback(async () => {
    const pendingAlerts = alerts.filter(a => !a.triggered);
    if (pendingAlerts.length === 0) return;

    try {
      const coinIds = Array.from(new Set(pendingAlerts.map(a => a.coinId))).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
      );
      
      let priceData: Record<string, { usd: number }> = {};
      if (res.ok) {
        priceData = await res.json();
      }

      let updatedAny = false;
      const updated = alerts.map(alert => {
        if (alert.triggered) return alert;

        const currentPrice = priceData[alert.coinId]?.usd ?? DEFAULT_COIN_PRICES[alert.coinId];
        if (!currentPrice) return alert;

        const conditionMet =
          (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

        if (conditionMet) {
          updatedAny = true;
          const msg = `${alert.name} (${alert.symbol}) is now $${currentPrice.toLocaleString()}! Target was ${alert.condition === 'ABOVE' ? '≥' : '≤'} $${alert.targetPrice.toLocaleString()}`;
          
          // In-app banner toast
          toast.success(`🚨 PRICE ALERT TRIGGERED!`, {
            description: msg,
            duration: 10000,
          });

          // Native browser desktop notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`🚨 Crypto Alert: ${alert.symbol}`, {
              body: msg,
              icon: '/favicon.ico',
            });
          }

          return {
            ...alert,
            triggered: true,
            triggeredAt: new Date().toISOString(),
          };
        }
        return alert;
      });

      if (updatedAny) {
        saveAlerts(updated);
      }
    } catch (e) {
      console.warn('Price alert check throttled or failed:', e);
    }
  }, [alerts]);

  // Run price check every 30 seconds
  useEffect(() => {
    checkPricesAgainstAlerts();
    const interval = setInterval(checkPricesAgainstAlerts, 30000);
    return () => clearInterval(interval);
  }, [checkPricesAgainstAlerts]);

  const activeCount = alerts.filter(a => !a.triggered).length;

  return {
    alerts,
    activeCount,
    permission,
    requestNotificationPermission,
    addAlert,
    removeAlert,
    clearAllAlerts,
    checkPricesAgainstAlerts,
  };
}
