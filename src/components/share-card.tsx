// src/components/share-card.tsx
import { forwardRef } from 'react';
import type { BoardGame, PlayLog } from '../types';

interface ShareCardGameProps {
  variant: 'game';
  game: BoardGame;
}

interface ShareCardSessionProps {
  variant: 'session';
  gameName: string;
  log: PlayLog;
}

type ShareCardProps = ShareCardGameProps | ShareCardSessionProps;

// Fixed 1080×1080px flat card — no glass, no backdrop-filter (html-to-image compatibility)
// Positioned offscreen via style prop on the wrapping div in the caller
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => {
  if (props.variant === 'game') {
    const { game } = props;
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0c0c10', color: '#f0f0f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Image — upper 60% */}
        <div style={{ flex: '0 0 648px', overflow: 'hidden', position: 'relative' }}>
          {game.imageUrl ? (
            <img src={game.imageUrl} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' }}>
              <span style={{ fontSize: 200, fontWeight: 700, color: 'rgba(255,255,255,0.08)' }}>
                {game.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Accent band */}
        <div style={{ height: 6, backgroundColor: 'var(--band-color, #6366f1)' }} />
        {/* Info */}
        <div style={{ flex: 1, padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>{game.name}</p>
            <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
              {game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}–${game.maxPlayers}`} players · {game.playTimeMinutes} min
            </p>
          </div>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>Meeply</p>
        </div>
      </div>
    );
  }

  // Session variant
  const { gameName, log } = props;
  const dateFormatted = (() => {
    const [y, m, d] = log.date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0c0c10', color: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 56px', textAlign: 'center' }}
    >
      <p style={{ fontSize: 36, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Just played</p>
      <p style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, margin: '0 0 48px' }}>{gameName}</p>
      {log.winnerName && (
        <>
          <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Winner</p>
          <p style={{ fontSize: 56, fontWeight: 700, color: '#6366f1', marginBottom: 48 }}>{log.winnerName}</p>
        </>
      )}
      {log.playerNames.length > 0 && (
        <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)', marginBottom: 48 }}>
          {log.playerNames.join(' · ')}
        </p>
      )}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.25)' }}>{dateFormatted}</p>
        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.25)' }}>Meeply</p>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
