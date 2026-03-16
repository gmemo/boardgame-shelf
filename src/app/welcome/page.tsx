import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Dices, Trophy, WifiOff, ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '../../stores';

const FEATURES = [
  {
    icon: Library,
    title: 'Collection Tracking',
    description: 'Catalog your games with tags, ratings, complexity, and quick-rules notes.',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  {
    icon: Dices,
    title: 'Game Night Picker',
    description: 'Can\u2019t decide what to play? Let the smart picker choose for you.',
    accentClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  {
    icon: Trophy,
    title: 'Play Logging',
    description: 'Record sessions with players, winners, scores, and duration.',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  {
    icon: WifiOff,
    title: '100% Offline',
    description: 'All data stays on your device. No account, no cloud, no tracking.',
    accentClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 28 } },
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setPreferences } = usePreferencesStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleStart = () => {
    setPreferences({ hasSeenWelcome: true });
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (!hasScrolled) setHasScrolled(true);
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        setActiveCard(FEATURES.length - 1);
      } else {
        const cardWidth = el.offsetWidth * 0.78 + 12; // card width + gap
        const index = Math.round(el.scrollLeft / cardWidth);
        setActiveCard(Math.min(index, FEATURES.length - 1));
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasScrolled]);

  return (
    <div className="flex flex-col h-full relative overflow-y-auto">
      <div className="ambient-glow" />

      <motion.div
        className="flex flex-col items-center flex-1 relative z-[1] pt-16 pb-28"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="w-28 h-28 rounded-full glass depth-3 flex items-center justify-center relative">
            <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
            <svg
              viewBox="0 0 512 512"
              fill="none"
              className="w-14 h-14 relative z-[1]"
            >
              {/* Meeple shape */}
              <circle cx="256" cy="96" r="64" fill="currentColor" className="text-primary" />
              <path
                d="M200 152C168 164 40 212 28 252C16 292 68 316 120 282C142 268 156 258 164 252L172 282C168 296 166 310 166 310L132 432C128 460 164 468 172 444L232 366C242 354 252 350 256 350C260 350 270 354 280 366L340 444C348 468 384 460 380 432L346 310C346 310 344 296 340 282L348 252C356 258 370 268 392 282C444 316 496 292 484 252C472 212 344 164 312 152Z"
                fill="currentColor"
                className="text-primary"
              />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-[32px] font-black tracking-tight text-text-primary"
        >
          Meeply
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="text-text-secondary text-base mt-2 mb-10"
        >
          Your board game companion
        </motion.p>

        {/* Feature cards — horizontal scroll */}
        <motion.div variants={fadeUp} className="w-full">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-[11%] pb-4"
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-3xl depth-2 p-5 flex-shrink-0 snap-center"
                style={{ width: '78%' }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.bgClass} flex items-center justify-center mb-4`}
                >
                  <feature.icon size={24} className={feature.accentClass} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {FEATURES.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full bg-primary"
                animate={{
                  width: activeCard === i ? 24 : 6,
                  opacity: activeCard === i ? 1 : 0.3,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="mt-8"
          animate={{ opacity: hasScrolled ? 0 : 0.5, y: hasScrolled ? -10 : [0, 6, 0] }}
          transition={
            hasScrolled
              ? { duration: 0.3 }
              : { y: { repeat: Infinity, duration: 1.5 }, opacity: { duration: 0.3 } }
          }
        >
          <ChevronDown size={24} className="text-text-secondary" />
        </motion.div>
      </motion.div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-10 pb-8 pt-16 px-6 bg-gradient-to-t from-background from-50% to-transparent">
        <motion.button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-primary depth-3 text-background font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 28 }}
        >
          Get Started
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
  );
}
