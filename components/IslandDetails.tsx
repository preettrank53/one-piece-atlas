import React from 'react';
import { motion } from 'framer-motion';
import {
  Anchor,
  Target,
  BookOpen,
  Users,
  Tv,
  Wind,
  Snowflake,
  Sparkles,
  Flame,
  Map as MapIcon,
} from 'lucide-react';
import type { Island, CrewMember, Bounty } from '../utils/islandData';

interface IslandDetailsProps {
  island: Island | null;
  currentEpisode: number;
  currentBounty: Bounty;
  currentCrew: CrewMember[];
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  snow: <Snowflake className="w-4 h-4 text-blue-300" />,
  bubbles: <Sparkles className="w-4 h-4 text-cyan-300" />,
  sakura: <Flame className="w-4 h-4 text-pink-300" />,
};

const VISUAL_ICONS: Record<string, React.ReactNode> = {
  village: <MapIcon className="w-4 h-4" />,
  fort: <MapIcon className="w-4 h-4" />,
  ship: <MapIcon className="w-4 h-4" />,
  city: <MapIcon className="w-4 h-4" />,
  mountain: <MapIcon className="w-4 h-4" />,
  peaks: <MapIcon className="w-4 h-4" />,
  desert_city: <MapIcon className="w-4 h-4" />,
  cloud_temple: <MapIcon className="w-4 h-4" />,
  water_city: <MapIcon className="w-4 h-4" />,
  judicial_tower: <MapIcon className="w-4 h-4" />,
  mangrove: <MapIcon className="w-4 h-4" />,
  fortress: <MapIcon className="w-4 h-4" />,
  colosseum: <MapIcon className="w-4 h-4" />,
  elephant: <MapIcon className="w-4 h-4" />,
  pagoda: <MapIcon className="w-4 h-4" />,
  lab: <MapIcon className="w-4 h-4" />,
};

export const IslandDetails: React.FC<IslandDetailsProps> = ({
  island,
  currentEpisode: _currentEpisode,
  currentBounty,
  currentCrew,
}) => {
  if (!island) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MapIcon className="w-20 h-20 mb-6 mx-auto animate-pulse" />
          <p className="text-xl font-black uppercase tracking-[0.4em]">
            Setting Sail
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Select an island to view details
          </p>
        </motion.div>
      </div>
    );
  }

  const episodeRange =
    island.episodes.length > 0
      ? `${island.episodes[0]}${island.episodes[1] ? ` - ${island.episodes[1]}` : '+'}`
      : 'N/A';

  return (
    <motion.div
      key={island.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Island Header */}
      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050b1a] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-8 z-20 text-center">
          <div>
            <span className="text-[10px] uppercase font-black text-red-500 tracking-[0.4em] mb-4 block">
              Log Entry
            </span>
            <h2 className="text-5xl font-black mb-2 tracking-tighter">
              {island.name}
            </h2>
            <div className="flex items-center justify-center gap-3 opacity-60">
              <Anchor className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold uppercase">{island.sea}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arc and Episode Info */}
      <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <Tv className="w-5 h-5 text-purple-500" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Arc
            </p>
            <p className="text-lg font-black">{island.arc}</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Episodes
          </p>
          <p className="text-sm font-bold text-slate-300">{episodeRange}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
          <Target className="w-6 h-6 text-amber-500 mb-4" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Active Bounty
          </p>
          <p className="text-2xl font-black">
            {currentBounty.amount.toLocaleString()}฿
          </p>
        </div>
        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
          <BookOpen className="w-6 h-6 text-red-500 mb-4" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Poneglyphs
          </p>
          <p className="text-2xl font-black">
            {island.hasPoneglyph ? 'SECURED' : 'NONE'}
          </p>
        </div>
      </div>

      {/* Weather and Visual Type */}
      {(island.weather || island.visual) && (
        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-4">
            {island.weather && (
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Weather
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {WEATHER_ICONS[island.weather]}
                    <span className="text-sm font-bold capitalize">
                      {island.weather}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {island.visual && (
              <div className="flex items-center gap-2">
                {VISUAL_ICONS[island.visual] || (
                  <MapIcon className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Type
                  </p>
                  <span className="text-sm font-bold capitalize">
                    {island.visual.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Characters */}
      {island.characters && island.characters.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <Users className="w-4 h-4 text-blue-500" /> Key Characters
          </h4>
          <div className="flex flex-wrap gap-2">
            {island.characters.map(character => (
              <span
                key={character}
                className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:border-blue-500/30 transition-all cursor-default"
              >
                {character}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Crew */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
          <Users className="w-4 h-4 text-blue-500" /> Active Crew Members
        </h4>
        <div className="flex flex-wrap gap-2">
          {currentCrew.map(member => (
            <span
              key={member.name}
              className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:border-blue-500/30 transition-all cursor-default"
            >
              {member.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
