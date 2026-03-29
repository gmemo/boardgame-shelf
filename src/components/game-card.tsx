import { useNavigate } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import type { BoardGame } from '../types';
import { useTagStore, SYSTEM_TAG_IDS } from '../stores';
import ComplexityDots from './ui/complexity-dots';

interface GameCardProps {
  game: BoardGame;
  disableNav?: boolean;
}

export default function GameCard({ game, disableNav = false }: GameCardProps) {
  const navigate = useNavigate();
  const { tags } = useTagStore();

  const isFavorite = game.tagIds.includes(SYSTEM_TAG_IDS.FAVORITE);

  const displayTags = game.tagIds
    .filter((id) => id !== SYSTEM_TAG_IDS.NEW && id !== SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY && id !== SYSTEM_TAG_IDS.FAVORITE)
    .slice(0, 2)
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean);

  const extraTagCount = Math.max(
    0,
    game.tagIds.filter((id) => id !== SYSTEM_TAG_IDS.NEW && id !== SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY && id !== SYSTEM_TAG_IDS.FAVORITE).length - 2,
  );

  return (
    <button
      onClick={() => !disableNav && navigate(`/game/${game.id}`)}
      className="glass rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] card-active-glow depth-1 flex flex-col w-full"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] max-h-32 bg-surface overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-text-secondary/15">
              {game.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {isFavorite && (
          <span className="absolute top-2 right-2 text-danger text-sm drop-shadow">&#9829;</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {game.name}
        </h3>

        <div className="flex items-center gap-3 text-text-secondary">
          <span className="inline-flex items-center gap-1 text-xs">
            <Users size={12} />
            {game.minPlayers === game.maxPlayers
              ? game.minPlayers
              : `${game.minPlayers}-${game.maxPlayers}`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <Clock size={12} />
            {game.playTimeMinutes}m
          </span>
          <ComplexityDots value={game.complexity} size="sm" />
        </div>

        {displayTags.length > 0 && (
          <div className="flex gap-1 mt-0.5 overflow-hidden">
            {displayTags.map((tag) => (
              <span
                key={tag!.id}
                className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-text-secondary truncate"
              >
                {tag!.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-text-secondary">
                +{extraTagCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
