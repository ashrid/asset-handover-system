// Premium theme system inspired by popular brands and design systems
export const themes = {
  github: {
    name: 'GitHub Professional',
    colors: {
      // GitHub's signature colors
      primary: '#0969da',           // GitHub blue
      primaryHover: '#0550ae',      // Darker blue
      primaryLight: '#ddf4ff',      // Very light blue

      secondary: '#1f883d',         // GitHub green
      accent: '#8250df',            // GitHub purple

      // Semantic colors
      success: '#1a7f37',           // GitHub green success
      successLight: '#dafbe1',
      warning: '#bf8700',           // GitHub yellow
      warningLight: '#fff8c5',
      danger: '#d1242f',            // GitHub red
      dangerLight: '#ffebe9',
      info: '#0969da',
      infoLight: '#ddf4ff',

      // Backgrounds - GitHub style
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#f6f8fa',          // GitHub header gray

      // Text colors
      textPrimary: '#24292f',       // GitHub dark
      textSecondary: '#57606a',     // GitHub gray
      textLight: '#8c959f',         // Light gray

      // Table specific
      tableHeaderBg: '#f6f8fa',
      tableHeaderText: '#24292f',
      tableStripeBg: '#f6f8fa',

      // Borders
      border: '#d0d7de',
      borderDark: '#8c959f',
    }
  },

  spotify: {
    name: 'Spotify Vibrant',
    colors: {
      // Spotify's vibrant colors
      primary: '#1db954',           // Spotify green
      primaryHover: '#1ed760',      // Brighter green
      primaryLight: '#d7f5e3',      // Very light green

      secondary: '#191414',         // Spotify black
      accent: '#1db954',            // Spotify green accent

      // Semantic colors
      success: '#1db954',
      successLight: '#d7f5e3',
      warning: '#ffa500',
      warningLight: '#fff4e0',
      danger: '#e22134',
      dangerLight: '#ffe5e7',
      info: '#509bf5',
      infoLight: '#e3f2fd',

      // Backgrounds
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#f0f0f0',

      // Text colors
      textPrimary: '#191414',       // Almost black
      textSecondary: '#535353',     // Dark gray
      textLight: '#a7a7a7',

      // Table specific
      tableHeaderBg: '#f5f5f5',
      tableHeaderText: '#191414',
      tableStripeBg: '#fafafa',

      // Borders
      border: '#e0e0e0',
      borderDark: '#b3b3b3',
    }
  },

  notion: {
    name: 'Notion Clean',
    colors: {
      // Notion's clean, minimal palette
      primary: '#2383e2',           // Notion blue
      primaryHover: '#0f7ce6',
      primaryLight: '#e3f2fd',

      secondary: '#eb5757',         // Notion red
      accent: '#9065b0',            // Notion purple

      // Semantic colors
      success: '#0f7b6c',           // Notion teal
      successLight: '#d3f8f2',
      warning: '#f2a359',           // Notion orange
      warningLight: '#fef0e3',
      danger: '#eb5757',
      dangerLight: '#fde9e9',
      info: '#2383e2',
      infoLight: '#e3f2fd',

      // Backgrounds - Notion's signature warm white
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#fbfbfa',

      // Text colors
      textPrimary: '#37352f',       // Notion dark
      textSecondary: '#787774',     // Notion gray
      textLight: '#9b9a97',

      // Table specific
      tableHeaderBg: '#f7f6f3',
      tableHeaderText: '#37352f',
      tableStripeBg: '#fbfbfa',

      // Borders
      border: '#e9e9e7',
      borderDark: '#d3d1cb',
    }
  },

  slack: {
    name: 'Slack Energetic',
    colors: {
      // Slack's playful, energetic colors
      primary: '#611f69',           // Slack aubergine
      primaryHover: '#4a154b',      // Darker purple
      primaryLight: '#f4ede4',

      secondary: '#e01e5a',         // Slack pink
      accent: '#36c5f0',            // Slack blue

      // Semantic colors
      success: '#2eb67d',           // Slack green
      successLight: '#d8f5e7',
      warning: '#ecb22e',           // Slack yellow
      warningLight: '#fdf5df',
      danger: '#e01e5a',
      dangerLight: '#fce7ed',
      info: '#36c5f0',
      infoLight: '#e0f7fc',

      // Backgrounds
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#f8f8f8',

      // Text colors
      textPrimary: '#1d1c1d',       // Slack black
      textSecondary: '#616061',     // Slack gray
      textLight: '#868686',

      // Table specific
      tableHeaderBg: '#f8f8f8',
      tableHeaderText: '#1d1c1d',
      tableStripeBg: '#fafafa',

      // Borders
      border: '#e8e8e8',
      borderDark: '#d1d1d1',
    }
  },

  linear: {
    name: 'Linear Modern',
    colors: {
      // Linear's modern, sophisticated palette
      primary: '#5e6ad2',           // Linear purple-blue
      primaryHover: '#4c5fd5',
      primaryLight: '#e9ecfc',

      secondary: '#8b5cf6',         // Purple
      accent: '#06b6d4',            // Cyan

      // Semantic colors
      success: '#10b981',           // Green
      successLight: '#d1fae5',
      warning: '#f59e0b',           // Amber
      warningLight: '#fef3c7',
      danger: '#ef4444',            // Red
      dangerLight: '#fee2e2',
      info: '#5e6ad2',
      infoLight: '#e9ecfc',

      // Backgrounds - Linear's clean white
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#fafafa',

      // Text colors
      textPrimary: '#18181b',       // Zinc-900
      textSecondary: '#52525b',     // Zinc-600
      textLight: '#a1a1aa',         // Zinc-400

      // Table specific
      tableHeaderBg: '#fafafa',
      tableHeaderText: '#18181b',
      tableStripeBg: '#fafafa',

      // Borders
      border: '#e4e4e7',            // Zinc-200
      borderDark: '#d4d4d8',        // Zinc-300
    }
  },

  vercel: {
    name: 'Vercel Minimalist',
    colors: {
      // Vercel's ultra-minimal black & white
      primary: '#000000',           // Pure black
      primaryHover: '#171717',      // Near black
      primaryLight: '#fafafa',

      secondary: '#0070f3',         // Vercel blue
      accent: '#7928ca',            // Vercel purple

      // Semantic colors
      success: '#0070f3',           // Blue for success
      successLight: '#e6f4ff',
      warning: '#f5a623',           // Orange
      warningLight: '#fff4e6',
      danger: '#ff0000',            // Pure red
      dangerLight: '#ffe6e6',
      info: '#0070f3',
      infoLight: '#e6f4ff',

      // Backgrounds - Pure white
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#fafafa',

      // Text colors
      textPrimary: '#000000',
      textSecondary: '#666666',
      textLight: '#999999',

      // Table specific
      tableHeaderBg: '#fafafa',
      tableHeaderText: '#000000',
      tableStripeBg: '#fafafa',

      // Borders
      border: '#eaeaea',
      borderDark: '#999999',
    }
  },

  material: {
    name: 'Material Design 3',
    colors: {
      // Material Design 3 dynamic colors
      primary: '#6750a4',           // M3 primary purple
      primaryHover: '#4f378b',
      primaryLight: '#eaddff',

      secondary: '#625b71',         // M3 secondary
      accent: '#7d5260',            // M3 tertiary

      // Semantic colors
      success: '#006e1c',           // M3 success green
      successLight: '#c4eed0',
      warning: '#7d5700',           // M3 warning brown
      warningLight: '#ffddb3',
      danger: '#ba1a1a',            // M3 error red
      dangerLight: '#ffdad6',
      info: '#006a6a',              // M3 info teal
      infoLight: '#00ffd6',

      // Backgrounds
      background: '#fffbfe',        // M3 background
      cardBackground: '#ffffff',
      headerBg: '#f7f2fa',          // M3 surface variant

      // Text colors
      textPrimary: '#1c1b1f',       // M3 on-surface
      textSecondary: '#49454f',     // M3 on-surface-variant
      textLight: '#79747e',

      // Table specific
      tableHeaderBg: '#f7f2fa',
      tableHeaderText: '#1c1b1f',
      tableStripeBg: '#fffbfe',

      // Borders
      border: '#cac4d0',
      borderDark: '#79747e',
    }
  },

  ajmanOfficial: {
    name: 'AU Official Brand ⭐',
    colors: {
      // Official Ajman University brand colors
      primary: '#F29F00',           // Pantone 144 C - Official Orange
      primaryHover: '#d68a00',
      primaryLight: '#fef3e2',

      secondary: '#39A9DC',         // Pantone 298 C - Official Light Blue
      accent: '#F6C900',            // Pantone 7406 C - Official Yellow

      // Semantic colors
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#F6C900',           // Official Yellow
      warningLight: '#fef9e7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      info: '#39A9DC',              // Official Light Blue
      infoLight: '#e8f4f8',

      // Backgrounds
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBg: '#e8f4f8',          // Light blue tint

      // Text colors
      textPrimary: '#1a1a1a',
      textSecondary: '#4b5563',
      textLight: '#9ca3af',

      // Table specific
      tableHeaderBg: '#e8f4f8',
      tableHeaderText: '#1e87b5',
      tableStripeBg: '#f8fafc',

      // Borders
      border: '#e5e7eb',
      borderDark: '#d1d5db',
    }
  }
}

export function applyTheme(themeName) {
  const theme = themes[themeName]
  if (!theme) return

  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })

  // Save to localStorage
  localStorage.setItem('selectedTheme', themeName)
}

export function getStoredTheme() {
  return localStorage.getItem('selectedTheme') || 'github'
}

export function initializeTheme() {
  const storedTheme = getStoredTheme()
  applyTheme(storedTheme)
  return storedTheme
}
