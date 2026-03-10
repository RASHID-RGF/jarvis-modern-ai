import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 50;

type SearchHistoryState = {
  history: string[];
  addQuery: (q: string) => void;
  removeQuery: (q: string) => void;
  clear: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addQuery: (q: string) => {
        const query = q.trim();
        if (!query) return;
        const current = get().history.filter((item) => item.toLowerCase() !== query.toLowerCase());
        const next = [query, ...current].slice(0, MAX_ITEMS);
        set({ history: next });
      },
      removeQuery: (q: string) => {
        const current = get().history.filter((item) => item !== q);
        set({ history: current });
      },
      clear: () => set({ history: [] }),
    }),
    { name: 'search-history', version: 1 }
  )
);
