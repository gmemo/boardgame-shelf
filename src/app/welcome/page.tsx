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
              viewBox="0 0 64 64"
              fill="none"
              className="w-14 h-14 relative z-[1]"
            >
              {/* Meeple shape */}
              <path
                d="M32 8C29 8 27 10 27 13C27 15.5 28.5 17.5 30.5 18.3L26 24L18 22C16.5 21.7 15 22.5 14.5 24L12 32C11.5 33.5 12.5 35 14 35.3L20 36.5L18 52C17.5 54 19 56 21 56H43C45 56 46.5 54 46 52L44 36.5L50 35.3C51.5 35 52.5 33.5 52 32L49.5 24C49 22.5 47.5 21.7 46 22L38 24L33.5 18.3C35.5 17.5 37 15.5 37 13C37 10 35 8 32 8Z"
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
