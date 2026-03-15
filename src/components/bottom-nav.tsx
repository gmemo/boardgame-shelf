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
      setTimeout(() => inputRef.current?.focus(), 100);
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

  const handleOpenSearch = () => {
    setSearchOpen(true);
  };

  const handleCloseSearch = () => {
    closeSearch();
  };

  return (
    <>
      {/* Tag filter panel — slides up above nav when search is open */}
      <AnimatePresence>
        {isSearchOpen && isCollectionTab && (
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
      <nav className="fixed bottom-0 left-4 right-4 mb-[max(0.75rem,env(safe-area-inset-bottom))] z-50 glass-strong rounded-2xl h-14 flex items-center nav-glow">
        <AnimatePresence mode="sync">
          {isSearchOpen && isCollectionTab ? (
            /* Search mode: home button + search input */
            <motion.div
              key="search-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 w-full px-3"
            >
              <button
                onClick={handleCloseSearch}
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-primary active:scale-90 transition-transform"
              >
                <Home size={20} strokeWidth={2} />
              </button>
              <motion.div
                layoutId="search-trigger"
                className="flex-1 flex items-center gap-2 rounded-xl glass-input px-3 py-2"
                transition={spring}
              >
                <Search size={16} className="text-text-secondary/50 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search games..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
                {localSearch && (
                  <button
                    onClick={clearSearch}
                    className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            </motion.div>
          ) : (
            /* Default mode: tabs + optional search button */
            <motion.div
              key="tabs-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center w-full"
            >
              <div className="flex items-center justify-around flex-1">
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
              {isCollectionTab && (
                <motion.button
                  layoutId="search-trigger"
                  onClick={handleOpenSearch}
                  className="relative shrink-0 flex items-center justify-center w-10 h-10 mr-2 rounded-xl text-text-secondary hover:text-primary transition-colors active:scale-90"
                  transition={spring}
                >
                  <Search size={20} strokeWidth={1.5} />
                  {hasActiveFilters && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
