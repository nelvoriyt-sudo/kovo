import { useEffect } from 'react';

export const ACCENTS = {
  blue: { label: 'Harbor', hex: '#315d99', dark: '#9dbff0' },
  moss: { label: 'Forest', hex: '#286451', dark: '#90cbb2' },
  amber: { label: 'Ochre', hex: '#805f25', dark: '#dec18b' },
  rose: { label: 'Berry', hex: '#96536b', dark: '#e4a9bf' },
};

export function normalizeAppearance(settings = {}) {
  return {
    colorMode: ['light', 'dark', 'system'].includes(settings.colorMode) ? settings.colorMode : 'system',
    accentTheme: Object.hasOwn(ACCENTS, settings.accentTheme) ? settings.accentTheme : 'blue',
    density: settings.density === 'compact' ? 'compact' : 'comfortable',
    textSize: settings.textSize === 'large' ? 'large' : 'standard',
  };
}

export function useAppearance(settings) {
  const preferences = normalizeAppearance(settings);
  const { colorMode, accentTheme, density, textSize } = preferences;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = colorMode === 'dark' || (colorMode === 'system' && media.matches);
      const root = document.documentElement;
      root.dataset.theme = dark ? 'dark' : 'light';
      root.dataset.density = density;
      root.dataset.textSize = textSize;
      root.style.setProperty('--accent', ACCENTS[accentTheme][dark ? 'dark' : 'hex']);
      root.style.setProperty('--accent-ink', dark ? '#172129' : '#ffffff');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#172129' : '#f3f5f7');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [colorMode, accentTheme, density, textSize]);
}
