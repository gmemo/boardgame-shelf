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
      setTimeout(() => inputRef.current?.focus(), 50);
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-4 right-4 mb-[max(0.75rem,env(safe-area-inset-bottom))] z-50 glass-strong rounded-2xl h-14 flex items-center nav-glow overflow-hidden">
        {/* Tabs layer — always mounted, fades out when search is active */}
        <motion.div
          animate={{ opacity: searchActive ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className={`flex items-center w-full h-full ${searchActive ? 'pointer-events-none' : ''}`}
        >
          {/* Tabs — always offset right to reserve space for search button */}
          <div className="flex items-center justify-around flex-1 pr-12">
            {tabs.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    setActiveTab(path);
                    navigate(path);
                  }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                    active ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Search button — fixed right slot, only visible on collection */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isCollectionTab && (
              <button
                onClick={() => setSearchOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors active:scale-90"
              >
                <Search size={18} strokeWidth={1.5} />
                {hasActiveFilters && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Search layer — always mounted when on collection, fades in when active */}
        {isCollectionTab && (
          <motion.div
            animate={{ opacity: searchActive ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className={`absolute inset-0 flex items-center gap-2 px-3 ${!searchActive ? 'pointer-events-none' : ''}`}
          >
            <button
              onClick={() => closeSearch()}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-primary active:scale-90 transition-transform"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <div className="flex-1 flex items-center gap-2 rounded-xl glass-input px-3 py-2">
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
          </motion.div>
        )}
      </nav>
    </>
  );
}
