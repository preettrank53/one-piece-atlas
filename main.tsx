import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Map, Anchor } from 'lucide-react';
import { ScrollMap } from './components/ScrollMap';
import { EpisodeControls } from './components/EpisodeControls';
import { useEpisodeNavigation } from './hooks/useEpisodeNavigation';
import { ONE_PIECE_DATA } from './data/onePieceData';
import { getIslandById } from './utils/islandData';
import type { Island } from './utils/islandData';

const App = () => {
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null);
  const [selectedVoyage, setSelectedVoyage] = useState('strawhats');

  // Episode navigation
  const [currentEpisode, setCurrentEpisode] = useState(1116);
  const {
    nextEpisode,
    previousEpisode,
    jumpToEpisode,
    isPlaying,
    togglePlay,
    stop,
    playSpeed,
    setPlaySpeed,
    arcs,
  } = useEpisodeNavigation({
    initialEpisode: currentEpisode,
    onEpisodeChange: setCurrentEpisode,
  });

  const activeIslands = useMemo(() => {
    return ONE_PIECE_DATA.islands as Island[];
  }, []);

  const selectedIsland = useMemo(
    () => getIslandById(ONE_PIECE_DATA.islands as Island[], selectedIslandId),
    [selectedIslandId]
  );

  return (
    <div className="relative w-full h-screen bg-[#0d0a07] overflow-hidden font-sans text-white">
      {/* Scroll Map */}
      <ScrollMap
        islands={activeIslands}
        selectedVoyage={selectedVoyage}
        onIslandClick={island => setSelectedIslandId(island.id)}
        selectedIslandId={selectedIslandId}
      />

      {/* Top Bar - Brand & Voyage Selector */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        {/* Brand */}
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-900/80 backdrop-blur-md rounded-xl border border-amber-700/50 flex items-center justify-center shadow-xl">
            <Map className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-wide text-amber-100"
              style={{ fontFamily: "'Times New Roman', serif" }}
            >
              Grand Line Atlas
            </h1>
            <p className="text-xs text-amber-600/80 tracking-widest uppercase">
              Captain&apos;s Navigation Chart
            </p>
          </div>
        </div>

        {/* Voyage Selector */}
        <div className="pointer-events-auto flex gap-2 bg-stone-900/80 backdrop-blur-md p-1.5 rounded-full border border-amber-900/30">
          {['strawhats', 'law', 'ace'].map(v => (
            <button
              key={v}
              onClick={() => setSelectedVoyage(v)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedVoyage === v
                  ? 'bg-amber-700 text-amber-100 shadow-lg'
                  : 'text-amber-400/60 hover:bg-amber-900/30'
              }`}
            >
              {v === 'strawhats'
                ? 'Straw Hats'
                : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Episode Controls */}
      <EpisodeControls
        currentEpisode={currentEpisode}
        onEpisodeChange={setCurrentEpisode}
        nextEpisode={nextEpisode}
        previousEpisode={previousEpisode}
        jumpToEpisode={jumpToEpisode}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        stop={stop}
        playSpeed={playSpeed}
        setPlaySpeed={setPlaySpeed}
        arcs={arcs}
      />

      {/* Island Details Panel */}
      {selectedIsland && (
        <div className="absolute top-1/2 right-6 -translate-y-1/2 w-80 bg-stone-900/95 backdrop-blur-xl border border-amber-900/40 rounded-2xl p-6 shadow-2xl z-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2
                className="text-2xl font-bold text-amber-100 leading-none"
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                {selectedIsland.name}
              </h2>
              <p className="text-xs text-amber-600/70 uppercase tracking-widest mt-1">
                {selectedIsland.sea}
              </p>
            </div>
            <button
              onClick={() => setSelectedIslandId(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 text-amber-300/70 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-1 bg-stone-800/60 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-600/60 mb-1">
                  Arc
                </p>
                <p className="text-sm font-bold text-amber-100">
                  {selectedIsland.arc}
                </p>
              </div>
              <div className="flex-1 bg-stone-800/60 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-600/60 mb-1">
                  Episodes
                </p>
                <p className="text-sm font-bold text-amber-100">
                  {selectedIsland.episodes.length > 0 ? (
                    <>
                      {selectedIsland.episodes[0]}
                      {selectedIsland.episodes[1]
                        ? ` - ${selectedIsland.episodes[1]}`
                        : ''}
                    </>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>

            {selectedIsland.hasPoneglyph && (
              <div className="p-3 bg-amber-900/30 border border-amber-700/40 rounded-xl flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Poneglyph Location
                </span>
              </div>
            )}

            {/* Characters */}
            {selectedIsland.characters &&
              selectedIsland.characters.length > 0 && (
                <div className="pt-4 border-t border-stone-700/50">
                  <p className="text-[10px] uppercase tracking-widest text-amber-600/60 mb-3">
                    Key Figures
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIsland.characters.map((char, i) => {
                      const icons: Record<string, string> = {
                        Luffy: '👒',
                        Zoro: '⚔️',
                        Nami: '🗺️',
                        Usopp: '🎯',
                        Sanji: '🍳',
                        Chopper: '🩺',
                        Robin: '📚',
                        Franky: '🔧',
                        Brook: '🎻',
                        Jinbe: '🦈',
                        Shanks: '🍺',
                        Ace: '🔥',
                        Mihawk: '🗡️',
                        Smoker: '💨',
                        Dragon: '🐉',
                        Crocodile: '🐊',
                        Vivi: '👑',
                        Law: '💉',
                        Whitebeard: '🌊',
                        Doflamingo: '🦩',
                      };
                      const icon = icons[char] || '⭐';
                      return (
                        <div
                          key={char}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-stone-800 to-stone-800/60 rounded-lg text-sm font-medium text-amber-200 border border-stone-600/50 shadow-lg"
                          style={{
                            animation: `fadeIn 0.3s ease-out ${i * 0.08}s backwards`,
                          }}
                        >
                          <span className="text-lg">{icon}</span>
                          <span>{char}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Floating Hints */}
      <div className="absolute bottom-28 left-6 flex items-center gap-2 text-amber-700/50 text-xs pointer-events-none">
        <Anchor className="w-4 h-4" />
        <span>Drag to pan • Scroll to zoom</span>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(React.createElement(App));
}
