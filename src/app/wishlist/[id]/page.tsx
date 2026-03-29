import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlistStore, useGameStore, useTagStore } from '../../../stores';
import Button from '../../../components/ui/button';
import IconButton from '../../../components/ui/icon-button';
import ConfirmDialog from '../../../components/ui/confirm-dialog';
import ComplexityDots from '../../../components/ui/complexity-dots';
import { useState } from 'react';

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, deleteItem } = useWishlistStore();
  const { games, addGame } = useGameStore();
  const { tags } = useTagStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const item = items.find((i) => i.id === id);
  if (!item) return <Navigate to="/wishlist" replace />;

  const linkedGame = item.linkedGameId ? games.find((g) => g.id === item.linkedGameId) : null;

  const handleAddToCollection = () => {
    if (item.type === 'expansion' && item.linkedGameId) {
      const parent = games.find((g) => g.id === item.linkedGameId);
      if (parent) {
        const expansionEntry = { id: crypto.randomUUID(), name: item.name, owned: true };
        useGameStore.getState().updateGame(parent.id, {
          expansions: [...parent.expansions, expansionEntry],
        });
        deleteItem(item.id);
        navigate(`/game/${parent.id}`);
        return;
      }
    }
    // Treat as game (or expansion with no linked game)
    const newGame = addGame({
      name: item.name,
      description: '',
      minPlayers: item.minPlayers ?? 1,
      maxPlayers: item.maxPlayers ?? 4,
      playTimeMinutes: item.playTimeMinutes ?? 60,
      complexity: item.complexity ?? 3,
      rating: null,
      imageUrl: item.imageUrl,
      notes: item.notes,
      quickRulesNotes: item.quickRulesNotes,
      tagIds: item.tagIds,
      expansions: [],
    });
    deleteItem(item.id);
    navigate(`/game/${newGame.id}`);
  };

  const handleDelete = () => {
    deleteItem(item.id);
    navigate('/wishlist', { replace: true });
  };

  const itemTags = item.tagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-full">
      <div className="ambient-glow" />

      <motion.div
        initial={{ scale: 0.82, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex flex-col flex-1 relative z-[1]"
      >
        {/* Top action bar */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <IconButton onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </IconButton>
          <div className="flex-1" />
          <IconButton onClick={() => navigate(`/wishlist/${item.id}/edit`)}>
            <Pencil size={18} />
          </IconButton>
          <IconButton onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 size={18} />
          </IconButton>
        </div>

        {/* Hero image */}
        {item.imageUrl && (
          <div className="px-4 mb-4">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] depth-2">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 pb-32">
          {/* Name + type badge */}
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold text-text-primary flex-1">{item.name}</h1>
            <span
              className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full mt-1 ${
                item.type === 'expansion' ? 'glass-pill text-text-secondary' : 'bg-primary/20 text-primary'
              }`}
            >
              {item.type === 'expansion' ? 'Expansion' : 'Game'}
            </span>
          </div>

          {linkedGame && (
            <p className="text-sm text-text-secondary -mt-2">For: {linkedGame.name}</p>
          )}

          {/* Game details section */}
          {(item.minPlayers != null || item.maxPlayers != null || item.playTimeMinutes != null || item.complexity != null) && (
            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Game Details</h2>
              <div className="flex flex-wrap gap-4">
                {(item.minPlayers != null || item.maxPlayers != null) && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Players</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.minPlayers === item.maxPlayers
                        ? item.minPlayers
                        : `${item.minPlayers ?? '?'}–${item.maxPlayers ?? '?'}`}
                    </p>
                  </div>
                )}
                {item.playTimeMinutes != null && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Play Time</p>
                    <p className="text-sm font-semibold text-text-primary">{item.playTimeMinutes}m</p>
                  </div>
                )}
                {item.complexity != null && (
                  <div>
                    <p className="text-[10px] text-text-secondary">Complexity</p>
                    <ComplexityDots value={item.complexity} size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase info */}
          {(item.price || item.store || item.link) && (
            <div className="glass rounded-2xl p-4 flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Purchase Info</h2>
              {item.price && <p className="text-sm text-text-primary">{item.price}</p>}
              {item.store && <p className="text-sm text-text-secondary">{item.store}</p>}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline break-all"
                >
                  {item.link}
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Notes</h2>
              <p className="text-sm text-text-primary leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Quick notes */}
          {item.quickRulesNotes && (
            <div className="glass-light rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Quick Note</h2>
              <p className="text-sm text-text-primary leading-relaxed">{item.quickRulesNotes}</p>
            </div>
          )}

          {/* Tags */}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {itemTags.map((tag) => (
                <span key={tag!.id} className="rounded-full glass-pill px-3 py-1 text-xs text-text-secondary">
                  {tag!.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] glass-strong z-10">
        <Button className="w-full" size="lg" onClick={handleAddToCollection}>
          <ArrowRight size={18} />
          Add to Collection
        </Button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${item.name}?`}
        description="This will permanently remove this wishlist item."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
