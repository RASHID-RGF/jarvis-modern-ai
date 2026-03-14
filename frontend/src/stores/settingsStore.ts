import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark';

type SettingsState = {
  voiceEnabled: boolean;
  selectedVoice: string | null;
  autoScroll: boolean;
  model: string;
  theme: Theme;
  setVoiceEnabled: (v: boolean) => void;
  setSelectedVoice: (v: string | null) => void;
  setAutoScroll: (v: boolean) => void;
  setModel: (m: string) => void;
  setTheme: (t: Theme) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      selectedVoice: null,
      autoScroll: true,
      model: 'default',
      theme: 'system',
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setSelectedVoice: (v) => set({ selectedVoice: v }),
      setAutoScroll: (v) => set({ autoScroll: v }),
      setModel: (m) => set({ model: m }),
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'app-settings',
      version: 2,
      partialize: (state) => ({
        voiceEnabled: state.voiceEnabled,
        selectedVoice: state.selectedVoice,
        autoScroll: state.autoScroll,
        model: state.model,
        theme: state.theme,
      }),
    }
  )
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Simplified: toggle dark class and data-theme attribute
  root.dataset.theme = theme;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', shouldDark);
}
