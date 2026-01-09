import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { filterIslands } from '../utils/islandData';
import type { Island } from '../utils/islandData';

interface SearchBarProps {
  islands: Island[];
  onSelectIsland: (island: Island) => void;
  onClose?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  islands,
  onSelectIsland,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredIslands = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return filterIslands(islands, { searchTerm });
  }, [islands, searchTerm]);

  const handleSelect = (island: Island) => {
    onSelectIsland(island);
    setSearchTerm('');
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search islands, arcs, characters..."
          className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && filteredIslands.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto custom-scrollbar z-50">
          {filteredIslands.map(island => (
            <button
              key={island.id}
              onClick={() => handleSelect(island)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="font-black text-white mb-1">{island.name}</div>
              <div className="text-xs text-slate-400 font-bold">
                {island.sea} • {island.arc} •
                {island.episodes.length > 0 ? (
                  <>
                    Ep. {island.episodes[0]}
                    {island.episodes[1] ? `-${island.episodes[1]}` : '+'}
                  </>
                ) : (
                  ' N/A'
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
