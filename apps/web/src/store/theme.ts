import { createSignal } from 'solid-js';

export type WallpaperType = 'default' | 'image' | 'url';

export interface WallpaperState {
  type: WallpaperType;
  value: string | null;
}

const STORAGE_KEY = 'jemaw_wallpaper';

const getInitialState = (): WallpaperState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse wallpaper state from localStorage', e);
    }
  }
  return { type: 'default', value: null };
};

const [wallpaper, setWallpaperState] = createSignal<WallpaperState>(getInitialState());

export const setWallpaper = (type: WallpaperType, value: string | null = null) => {
  const newState = { type, value };
  setWallpaperState(newState);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error('Failed to save wallpaper to localStorage (might be too large)', e);
    alert('The image is too large to save in your browser memory. Please try a smaller image or use an image URL instead.');
  }
};

export { wallpaper };
