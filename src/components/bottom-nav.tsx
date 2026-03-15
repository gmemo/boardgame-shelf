import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Library, Dices, BarChart3, Settings, Search, Home, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavStore, useCollectionFilterStore } from '../stores';
import TagFilterBar from './tag-filter-bar';

const tabs = [
  { path: '/', label: 'Collection', icon: Library },
  { path: '/plays', label: 'Plays', icon: Dices },
  { path: '/stats', label: 'Stats', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveTab } = useNavStore();
  const {
    search,
    tagIds,
    isSearchOpen,
    setSearch,
    setSearchOpen,
    closeSearch,
    toggleTagFilter,
  } = useCollectionFilterStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isCollectionTab = location.pathname === '/';
  const hasActiveFilters = search !== '' || tagIds.length > 0;
  const searchActive = isSearchOpen && isCollectionTab;

  // Auto-close search when navigating away from collection
  useEffect(() => {
    if (!isCollectionTab && isSearchOpen) {
      closeSearch();
    }
  }, [isCollectionTab, isSearchOpen, closeSearch]);

  // Sync local search with store
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isSearchOpen]);

  const handleSearchChange = (v: string) => {
    setLocalSearch(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearch(v), 300);
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearch('');
    inputRef.current?.focus();
  };

  // Flex values as CSS strings — animated via CSS transitions
  const navFlex = searchActive ? '0 0 52px' : '1 1 0%';
  const searchFlex = searchActive ? '1 1 0%' : '0 0 48px';
  const transition = `flex 0.35s ${EASE}`;

  return (
    <>
      {/* Tag filter panel — slides up above nav when search is open */}
      <AnimatePresence>
        {searchActive && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
            className="fixed bottom-[calc(4.5rem+max(0.75rem,env(safe-area-inset-bottom)))] left-4 right-4 z-40 glass-strong rounded-2xl px-4 py-3"
          >
            <TagFilterBar selectedIds={tagIds} onToggle={toggleTagFilter} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar — flex container: nav pill + search area */}
      <div className="fixed bottom-0 left-4 right-4 mb-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex items-center gap-2 h-14">

        {/* Nav pill — full width normally, shrinks to home button when search active */}
        <nav
          style={{ flex: navFlex, transition }}
          className="glass-strong rounded-2xl h-full nav-glow overflow-hidden relative"
        >
          {/* Tabs */}
          <div
            style={{
              opacity: searchActive ? 0 : 1,
              transition: `opacity 0.15s ease`,
            }}
            className={`flex items-center justify-around w-full h-full ${searchActive ? 'pointer-events-none' : ''}`}
          >
            {tabs.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    setActiveTab(path);
                    navigate(path);
                  }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors whitespace-nowrap ${
                    active ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Home button — overlaid, visible when search active */}
          <div
            style={{
              opacity: searchActive ? 1 : 0,
              transition: `opacity 0.15s ease`,
            }}
            className={`absolute inset-0 flex items-center justify-center ${!searchActive ? 'pointer-events-none' : ''}`}
          >
            <button
              onClick={() => closeSearch()}
              className="flex items-center justify-center w-full h-full text-primary active:scale-90 transition-transform"
            >
              <Home size={20} strokeWidth={2} />
            </button>
          </div>
        </nav>

        {/* Search area — round button normally, stretches to full bar when active */}
        {isCollectionTab && (
          <div
            style={{ flex: searchFlex, transition }}
            className="h-full overflow-hidden relative"
          >
            {/* Round search button — visible when collapsed */}
            <div
              style={{
                opacity: searchActive ? 0 : 1,
                transition: `opacity 0.12s ease`,
              }}
              className={`absolute inset-0 flex items-center justify-center ${searchActive ? 'pointer-events-none' : ''}`}
            >
              <button
                onClick={() => setSearchOpen(true)}
                className="relative flex items-center justify-center w-12 h-12 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors active:scale-90"
              >
                <Search size={18} strokeWidth={1.5} />
                {hasActiveFilters && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Search input bar — visible when expanded */}
            <div
              style={{
                opacity: searchActive ? 1 : 0,
                transition: `opacity 0.2s ease ${searchActive ? '0.1s' : '0s'}`,
              }}
              className={`glass-strong rounded-2xl w-full h-full flex items-center gap-2 px-3 ${!searchActive ? 'pointer-events-none' : ''}`}
            >
              <Search size={16} className="text-text-secondary/50 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search games..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none min-w-0"
              />
              {localSearch && (
                <button
                  onClick={clearSearch}
                  className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
