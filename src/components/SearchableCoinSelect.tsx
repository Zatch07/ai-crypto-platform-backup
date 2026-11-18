import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check, ChevronDown, Coins } from 'lucide-react';
import { COMPREHENSIVE_COINS, CryptoCoin } from '@/data/cryptoList';

interface SearchableCoinSelectProps {
  selectedCoinId: string;
  onSelectCoin: (coin: CryptoCoin) => void;
  coins?: CryptoCoin[];
  label?: string;
}

export function SearchableCoinSelect({
  selectedCoinId,
  onSelectCoin,
  coins = COMPREHENSIVE_COINS,
  label = 'Select Cryptocurrency',
}: SearchableCoinSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCoin =
    coins.find((c) => c.id === selectedCoinId) || coins[0];

  const filteredCoins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return coins;
    return coins.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [coins, searchQuery]);

  const handleSelect = (coin: CryptoCoin) => {
    onSelectCoin(coin);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Main Selected Coin Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-gray-950/80 hover:border-gray-700 text-left transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center font-bold text-yellow-400 text-xs">
            {selectedCoin.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{selectedCoin.name}</span>
              <span className="text-[10px] text-gray-400 font-mono">({selectedCoin.symbol})</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              ${selectedCoin.currentPrice >= 1 ? selectedCoin.currentPrice.toLocaleString() : selectedCoin.currentPrice.toFixed(6)}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Searchable Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl p-2.5 backdrop-blur-xl">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 60+ coins (e.g. SUI, PEPE, SOL)..."
              className="pl-8 bg-gray-900 border-gray-800 text-white text-xs h-8 focus:border-yellow-500"
            />
          </div>

          {/* Scrollable list */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredCoins.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500">
                No coin found matching "{searchQuery}".
              </div>
            ) : (
              filteredCoins.map((coin) => {
                const isSelected = coin.id === selectedCoinId;
                return (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleSelect(coin)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-yellow-500/10 border border-yellow-500/30 text-white'
                        : 'hover:bg-gray-900 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white w-14 truncate">
                        {coin.symbol}
                      </span>
                      <span className="text-gray-400 text-[11px] truncate max-w-[140px]">
                        {coin.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-300">
                        ${coin.currentPrice >= 1 ? coin.currentPrice.toLocaleString() : coin.currentPrice.toFixed(6)}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
