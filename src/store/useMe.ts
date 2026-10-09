import { create } from 'zustand';

interface MeState {
  stats: any | null;
  chapterProgress: any[] | null;
  history: any | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useMe = create<MeState>((set) => ({
  stats: null,
  chapterProgress: null,
  history: null,
  isLoading: true,
  refetch: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/me/export?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        set({
          stats: {
            ...data.statistics,
            profile: data.profile,
          },
          chapterProgress: data.chapter_progress,
          history: data.history,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  }
}));

// We can optionally trigger fetch on init
useMe.getState().refetch();
