// Ported from Omni-Tools (src/pages/tools/pdf/editor), MIT: the same viewer, EmbedPDF, set up to
// work offline and to look like the rest of the app.

/** Locales EmbedPDF has, plus the Russian one of this tool. */
const EMBEDPDF_LOCALES = ['en', 'de', 'es', 'fr', 'ja', 'nl', 'sv', 'pt-BR', 'zh-CN', 'zh-TW', 'ru'];

const ALIASES: Record<string, string> = { pt: 'pt-BR', zh: 'zh-CN' };

/** The EmbedPDF locale for a locale of the app, English if it has none. */
export function embedpdfLocale(appLocale: string): string {
  if (ALIASES[appLocale]) {
    return ALIASES[appLocale];
  }
  const language = appLocale.split('-')[0];
  return EMBEDPDF_LOCALES.includes(appLocale) ? appLocale : EMBEDPDF_LOCALES.includes(language) ? language : 'en';
}

// Colors of the fork's themes (src/ui/theme/themes.ts and src/themes.ts).
const accentLight = {
  primary: '#18a058',
  primaryHover: '#1ea54c',
  primaryActive: '#0c7a43',
  primaryLight: '#18a0582f',
  primaryForeground: '#ffffff',
};

export const embedpdfTheme = {
  light: {
    accent: accentLight,
    interactive: { selected: '#18a0582f', focus: '#18a058', focusRing: '#18a05866' },
  },
  dark: {
    background: {
      app: '#1e1e1e',
      surface: '#232323',
      surfaceAlt: '#2c2c2c',
      elevated: '#2c2c2c',
      input: '#1e1e1e',
    },
    foreground: {
      primary: '#ffffffd1',
      secondary: '#ffffffa6',
      muted: '#ffffff80',
      disabled: '#ffffff4d',
      onAccent: '#ffffff',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.12)',
      subtle: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(255, 255, 255, 0.24)',
    },
    accent: { ...accentLight, primary: '#1ea54c', primaryHover: '#36ad6a' },
    interactive: {
      hover: 'rgba(255, 255, 255, 0.08)',
      active: 'rgba(255, 255, 255, 0.12)',
      selected: '#18a0582f',
      focus: '#1ea54c',
      focusRing: '#1ea54c66',
    },
  },
};
