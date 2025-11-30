# Theme System Documentation

## Overview

The Asset Handover Management System now includes a flexible multi-theme system that allows you to switch between different color schemes without affecting functionality.

## Available Themes

### 1. **Ajman Blue** (Default)
- **Colors**: Deep navy blue (#003366) to ocean blue (#005599)
- **Character**: Professional, corporate, trustworthy
- **Best for**: Conservative corporate look

### 2. **AU Official Brand** ⭐ **RECOMMENDED**
- **Colors**: Official Ajman University brand colors
  - Orange: #F29F00 (Pantone 144 C)
  - Light Blue: #39A9DC (Pantone 298 C)
  - Yellow: #F6C900 (Pantone 7406 C)
- **Character**: Modern, bright, energetic academic brand
- **Best for**: Official university communications and branding
- **Note**: Uses the exact colors from AU's official brand guidelines

### 3. **Emerald Green**
- **Colors**: Forest green (#047857) to emerald (#059669)
- **Character**: Fresh, natural, growth-oriented
- **Best for**: Environmental or sustainability focus

### 4. **Royal Purple**
- **Colors**: Deep purple (#6b21a8) to vibrant purple (#7c3aed)
- **Character**: Regal, creative, sophisticated
- **Best for**: Premium or creative branding

### 5. **Sunset Orange**
- **Colors**: Burnt orange (#c2410c) to bright orange (#ea580c)
- **Character**: Energetic, warm, approachable
- **Best for**: Dynamic, modern feel

### 6. **Ocean Teal**
- **Colors**: Deep teal (#0f766e) to turquoise (#14b8a6)
- **Character**: Calming, balanced, modern
- **Best for**: Tech-forward, contemporary look

### 7. **Crimson Red**
- **Colors**: Deep red (#991b1b) to bright red (#dc2626)
- **Character**: Bold, powerful, attention-grabbing
- **Best for**: High-impact, urgent messaging

### 8. **Midnight Black**
- **Colors**: Charcoal (#1f2937) to dark gray (#374151)
- **Character**: Sleek, modern, minimalist
- **Best for**: Professional, understated elegance

## How to Use

### Switching Themes

1. **Using the Theme Switcher Button**:
   - Look for the "Theme" button in the top-right corner of the header
   - Click it to open the theme dropdown
   - Select any theme from the list
   - The theme changes instantly across the entire application

2. **Theme Persistence**:
   - Your selected theme is automatically saved to browser localStorage
   - The theme will persist across browser sessions
   - Each user can have their own preferred theme

### For Developers

#### Adding a New Theme

1. Open `src/themes.js`
2. Add a new theme object to the `themes` export:

```javascript
myCustomTheme: {
  name: 'My Custom Theme',
  colors: {
    primary: '#hexcolor',
    secondary: '#hexcolor',
    accent: '#hexcolor',
    success: '#48c78e',
    warning: '#ffe08a',
    danger: '#f14668',
    info: '#3e8ed0',
    light: '#f5f5f5',
    dark: '#363636',
    headerGradientStart: '#hexcolor',
    headerGradientEnd: '#hexcolor',
    headerText: '#ffffff',
    cardBackground: '#ffffff',
    tableHeaderBg: '#f8f9fa',
    tableHeaderColor: '#hexcolor',
    buttonPrimary: '#hexcolor',
    buttonPrimaryHover: '#hexcolor',
    tagSuccess: '#48c78e',
    tagDanger: '#f14668',
    tagWarning: '#ffe08a',
    tagInfo: '#3e8ed0'
  }
}
```

3. The new theme will automatically appear in the theme switcher dropdown

#### Using Theme Variables in CSS

All theme colors are available as CSS custom properties:

```css
.my-element {
  background-color: var(--theme-primary);
  color: var(--theme-headerText);
  border-color: var(--theme-secondary);
}
```

Available CSS variables:
- `--theme-primary`
- `--theme-secondary`
- `--theme-accent`
- `--theme-success`
- `--theme-warning`
- `--theme-danger`
- `--theme-info`
- `--theme-light`
- `--theme-dark`
- `--theme-headerGradientStart`
- `--theme-headerGradientEnd`
- `--theme-headerText`
- `--theme-cardBackground`
- `--theme-tableHeaderBg`
- `--theme-tableHeaderColor`
- `--theme-buttonPrimary`
- `--theme-buttonPrimaryHover`
- `--theme-tagSuccess`
- `--theme-tagDanger`
- `--theme-tagWarning`
- `--theme-tagInfo`

#### Programmatic Theme Changes

```javascript
import { applyTheme } from './themes'

// Apply a theme programmatically
applyTheme('royalPurple')

// Get current theme
import { getStoredTheme } from './themes'
const currentTheme = getStoredTheme()
```

## Theme Architecture

The theme system uses CSS custom properties (CSS variables) for maximum flexibility:

1. **Theme Definition** (`src/themes.js`):
   - Defines all available themes and their color palettes
   - Exports utility functions for theme management

2. **Theme Application**:
   - Sets CSS custom properties on the document root
   - Saves selection to localStorage for persistence

3. **CSS Integration** (`src/index.css`):
   - All theme-dependent styles use CSS variables
   - Automatic fallback to default Ajman Blue theme

4. **Component Integration**:
   - ThemeSwitcher component provides the UI
   - App component initializes theme on load
   - No component changes needed for new themes

## Benefits

✅ **Easy Testing**: Quickly preview different color schemes
✅ **User Preference**: Each user can choose their preferred theme
✅ **No Code Changes**: Switch themes without modifying components
✅ **Persistent**: Theme choice saved across sessions
✅ **Extendable**: Add new themes by editing a single file
✅ **Real-time**: Instant theme switching without page reload

## Future Enhancements

Possible additions to the theme system:
- Dark mode variants
- Custom theme creator
- Organization-specific theme presets
- Accessibility-focused high-contrast themes
- Export/import theme configurations
