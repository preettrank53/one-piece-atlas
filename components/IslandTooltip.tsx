import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Island } from '../utils/islandData';

interface IslandTooltipProps {
  island: Island | null;
  position: { x: number; y: number } | null;
}

export const IslandTooltip: React.FC<IslandTooltipProps> = ({
  island,
  position,
}) => {
  if (!island || !position) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: `${position.x + 15}px`,
          top: `${position.y - 10}px`,
        }}
      >
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-2xl">
          <div className="text-sm font-black text-white mb-1">
            {island.name}
          </div>
          <div className="text-xs text-slate-400 font-bold">
            {island.episodes.length > 0 ? (
              <>
                Ep. {island.episodes[0]}
                {island.episodes[1] ? ` - ${island.episodes[1]}` : '+'}
              </>
            ) : (
              'N/A'
            )}
          </div>
          <div className="text-xs text-amber-500 font-bold mt-1">
            {island.sea}
          </div>
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black/90 border-l border-b border-white/20 rotate-45" />
      </motion.div>
    </AnimatePresence>
  );
};
